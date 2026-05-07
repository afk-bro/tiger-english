"""
conversations.py — Conversation scenarios endpoints

GET  /api/v1/me/conversations/scenarios — list all scenarios (filterable by ?level=A1)
POST /api/v1/me/conversations/turn      — send a message; rate-limited to 60 req/min per user
POST /api/v1/me/conversations/end       — end a session; returns 6-criteria scores + feedback

Note: The ai_scenarios table may not exist yet (DB migration blocked in this env).
We serve 25 hardcoded scenarios that match the spec seed data. When the table exists,
the backend can be updated to query it.
"""
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.security import get_current_user
from app.core.supabase import get_supabase_admin
from app.core.config import settings
from app.api.v1.ai_tutor import get_ai_tutor_service
from app.services.ai_tutor_service import AiDisabledException, AiTutorService

logger = logging.getLogger(__name__)

# ── Simple in-memory rate limiter ────────────────────────────────────────────
# Maps user_id → list of request timestamps within the current window.
_RATE_LIMIT_WINDOW = 60   # seconds
_RATE_LIMIT_MAX = 60      # max requests per window
_rate_store: Dict[str, List[float]] = defaultdict(list)


def _check_rate_limit(user_id: str) -> Optional[int]:
    """Return seconds until retry if rate limited, else None."""
    now = time.monotonic()
    window_start = now - _RATE_LIMIT_WINDOW
    timestamps = [t for t in _rate_store[user_id] if t > window_start]
    _rate_store[user_id] = timestamps

    if len(timestamps) >= _RATE_LIMIT_MAX:
        oldest = min(timestamps)
        retry_after = int(_RATE_LIMIT_WINDOW - (now - oldest)) + 1
        return max(retry_after, 1)

    _rate_store[user_id].append(now)
    return None

router = APIRouter()

# 24 seed scenarios from the app spec
SEED_SCENARIOS = [
    # A0-A1
    {
        "id": "introduce-yourself-a1",
        "slug": "introduce-yourself-a1",
        "title": "Introduce yourself",
        "level": "A1",
        "level_band": "A0–A1",
        "description": "Practice saying your name, where you're from, and a simple greeting.",
        "ai_role": "A friendly person you've just met",
        "learner_role": "Yourself, meeting a new friend",
        "opening_line": "Hi there! I don't think we've met. What's your name?",
        "target_vocabulary": ["hello", "my name is", "I'm from", "nice to meet you", "goodbye"],
        "target_grammar": ["Simple present", "Subject pronouns (I, you, he, she)"],
        "estimated_minutes": 2,
    },
    {
        "id": "order-coffee-a1",
        "slug": "order-coffee-a1",
        "title": "Order a coffee",
        "level": "A1",
        "level_band": "A0–A1",
        "description": "Order a drink at a café using please, thank you, and simple requests.",
        "ai_role": "A barista at a café",
        "learner_role": "A customer ordering a drink",
        "opening_line": "Good morning! Welcome to our café. What can I get for you today?",
        "target_vocabulary": ["coffee", "please", "thank you", "how much", "here you go"],
        "target_grammar": ["Can I have…?", "I'd like…", "How much is…?"],
        "estimated_minutes": 3,
    },
    {
        "id": "ask-name-age-a1",
        "slug": "ask-name-age-a1",
        "title": "Ask basic personal info",
        "level": "A1",
        "level_band": "A0–A1",
        "description": "Practice asking and answering questions about name, age, and country.",
        "ai_role": "A classmate getting to know you",
        "learner_role": "A new student",
        "opening_line": "Hey! Are you new here? I'm curious — what's your name?",
        "target_vocabulary": ["name", "age", "country", "years old", "where are you from"],
        "target_grammar": ["What is…?", "How old are you?", "Where are you from?"],
        "estimated_minutes": 3,
    },
    {
        "id": "classroom-instructions-a0",
        "slug": "classroom-instructions-a0",
        "title": "Follow classroom instructions",
        "level": "A1",
        "level_band": "A0–A1",
        "description": "Respond to basic classroom instructions like click, repeat, and choose.",
        "ai_role": "A friendly English teacher",
        "learner_role": "A new student",
        "opening_line": "Hello! Let's start. Please repeat after me: 'Hello, how are you?'",
        "target_vocabulary": ["repeat", "choose", "click", "open", "close", "look"],
        "target_grammar": ["Imperative verbs", "Simple commands"],
        "estimated_minutes": 2,
    },
    {
        "id": "meet-someone-a1",
        "slug": "meet-someone-a1",
        "title": "Meet a stranger",
        "level": "A1",
        "level_band": "A0–A1",
        "description": "Introduce yourself to a stranger and ask back about them.",
        "ai_role": "A friendly stranger at a park",
        "learner_role": "Yourself, starting a conversation",
        "opening_line": "What a lovely day! Do you come here often?",
        "target_vocabulary": ["lovely", "often", "tell me about", "how about you", "nice"],
        "target_grammar": ["Question formation", "Do you…?", "I am / I'm"],
        "estimated_minutes": 4,
    },
    # A1-A2
    {
        "id": "order-food-a2",
        "slug": "order-food-a2",
        "title": "Order a full meal",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Order a starter, main course, and drink, and ask about the bill.",
        "ai_role": "A waiter at a restaurant",
        "learner_role": "A customer dining out",
        "opening_line": "Good evening! Here's your menu. Can I start you off with some drinks?",
        "target_vocabulary": ["starter", "main course", "dessert", "bill", "allergic to"],
        "target_grammar": ["Would you like…?", "I'll have…", "Can we get the bill?"],
        "estimated_minutes": 5,
    },
    {
        "id": "ask-directions-a1a2",
        "slug": "ask-directions-a1a2",
        "title": "Ask for directions",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Ask for and understand directions using left, right, near, and far.",
        "ai_role": "A local resident",
        "learner_role": "A tourist who is lost",
        "opening_line": "Excuse me, you look lost. Can I help you find something?",
        "target_vocabulary": ["left", "right", "straight ahead", "turn", "near", "far", "next to"],
        "target_grammar": ["How do I get to…?", "Is it far?", "Turn left/right at…"],
        "estimated_minutes": 4,
    },
    {
        "id": "shopping-clothes-a2",
        "slug": "shopping-clothes-a2",
        "title": "Buy clothes",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Shop for clothing by asking about size, price, and making a payment.",
        "ai_role": "A shop assistant",
        "learner_role": "A customer shopping for clothes",
        "opening_line": "Welcome! Are you looking for anything in particular today?",
        "target_vocabulary": ["size", "price", "try on", "too big", "too small", "receipt"],
        "target_grammar": ["Do you have this in…?", "How much does it cost?", "I'll take it."],
        "estimated_minutes": 5,
    },
    {
        "id": "describe-routine-a2",
        "slug": "describe-routine-a2",
        "title": "Describe your daily routine",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Talk about what you do every day using present simple and frequency words.",
        "ai_role": "A new friend curious about your life",
        "learner_role": "Yourself describing your day",
        "opening_line": "So, what does a typical day look like for you?",
        "target_vocabulary": ["usually", "always", "sometimes", "never", "in the morning", "after work"],
        "target_grammar": ["Present simple", "Frequency adverbs", "Time expressions"],
        "estimated_minutes": 5,
    },
    {
        "id": "past-weekend-a2",
        "slug": "past-weekend-a2",
        "title": "Talk about last weekend",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Share what you did last weekend using past simple and sequence words.",
        "ai_role": "A colleague on Monday morning",
        "learner_role": "Yourself talking about the weekend",
        "opening_line": "Hey! How was your weekend? Did you do anything fun?",
        "target_vocabulary": ["went", "saw", "had", "then", "after that", "finally"],
        "target_grammar": ["Past simple (regular + irregular)", "Time sequence: first, then, after that"],
        "estimated_minutes": 5,
    },
    {
        "id": "health-clinic-a2",
        "slug": "health-clinic-a2",
        "title": "Visit the health clinic",
        "level": "A2",
        "level_band": "A1–A2",
        "description": "Describe a health problem and understand simple medical advice.",
        "ai_role": "A doctor or nurse at a clinic",
        "learner_role": "A patient with a health complaint",
        "opening_line": "Good morning. What seems to be the problem today?",
        "target_vocabulary": ["headache", "fever", "sore throat", "pain", "symptoms", "medication"],
        "target_grammar": ["I have a…", "It hurts when I…", "How long have you had…?"],
        "estimated_minutes": 5,
    },
    # A2-B1
    {
        "id": "life-experiences-b1",
        "slug": "life-experiences-b1",
        "title": "Talk about life experiences",
        "level": "B1",
        "level_band": "A2–B1",
        "description": "Discuss things you have and haven't done using present perfect and past simple.",
        "ai_role": "A travel enthusiast swapping stories",
        "learner_role": "Yourself sharing experiences",
        "opening_line": "Have you ever traveled outside your home country?",
        "target_vocabulary": ["ever", "never", "been to", "experienced", "memorable"],
        "target_grammar": ["Present perfect: Have you ever…?", "Past simple for specifics"],
        "estimated_minutes": 7,
    },
    {
        "id": "give-opinion-b1",
        "slug": "give-opinion-b1",
        "title": "Give your opinion",
        "level": "B1",
        "level_band": "A2–B1",
        "description": "Express and support an opinion on a familiar topic with reasons and examples.",
        "ai_role": "A friend who enjoys debates",
        "learner_role": "Yourself sharing a viewpoint",
        "opening_line": "I was reading that more cities are banning cars from city centers. What do you think about that?",
        "target_vocabulary": ["I think", "in my opinion", "for example", "because", "on the other hand"],
        "target_grammar": ["Opinion phrases", "Reason clauses with 'because'", "Discourse markers"],
        "estimated_minutes": 7,
    },
    {
        "id": "explain-problem-b1",
        "slug": "explain-problem-b1",
        "title": "Explain a problem and ask advice",
        "level": "B1",
        "level_band": "A2–B1",
        "description": "Describe a problem clearly and use follow-up questions to get useful advice.",
        "ai_role": "A helpful advisor or friend",
        "learner_role": "Someone dealing with a challenge",
        "opening_line": "You seem a bit stressed. Is everything okay? What's going on?",
        "target_vocabulary": ["the problem is", "I'm struggling with", "What would you suggest?", "could you explain"],
        "target_grammar": ["Problem-solution language", "Indirect questions: Could you tell me…?"],
        "estimated_minutes": 7,
    },
    {
        "id": "tell-a-story-b1",
        "slug": "tell-a-story-b1",
        "title": "Tell a story",
        "level": "B1",
        "level_band": "A2–B1",
        "description": "Narrate a connected story with correct tense control and sequence markers.",
        "ai_role": "An interested listener",
        "learner_role": "A storyteller",
        "opening_line": "I love hearing stories! Tell me about something interesting that happened to you recently.",
        "target_vocabulary": ["suddenly", "meanwhile", "at that point", "eventually", "to my surprise"],
        "target_grammar": ["Past simple + past continuous", "Narrative sequence markers"],
        "estimated_minutes": 8,
    },
    # B1-B1+
    {
        "id": "work-update-b1plus",
        "slug": "work-update-b1plus",
        "title": "Give a work standup update",
        "level": "B1+",
        "level_band": "B1–B1+",
        "description": "Give a standup-style update: what you did, what you're doing, and any blockers.",
        "ai_role": "A team lead running a daily standup",
        "learner_role": "A team member giving their update",
        "opening_line": "Good morning everyone. Let's start our standup. What did you work on yesterday?",
        "target_vocabulary": ["completed", "in progress", "blocked by", "dependency", "pull request"],
        "target_grammar": ["Past simple for completed work", "Present continuous for ongoing work", "Passive for blockers"],
        "estimated_minutes": 6,
    },
    {
        "id": "cultural-opinion-b1plus",
        "slug": "cultural-opinion-b1plus",
        "title": "Discuss a movie or book",
        "level": "B1+",
        "level_band": "B1–B1+",
        "description": "Share your opinion about a film or book with nuance and recommendation.",
        "ai_role": "A friend who loves movies and books",
        "learner_role": "Yourself sharing a cultural opinion",
        "opening_line": "Have you seen anything good lately, or read a book you'd recommend?",
        "target_vocabulary": ["plot", "character", "themes", "I'd recommend", "it reminded me of"],
        "target_grammar": ["Relative clauses", "Hedging: I thought it was rather…", "Comparative structures"],
        "estimated_minutes": 7,
    },
    {
        "id": "decision-tradeoffs-b1plus",
        "slug": "decision-tradeoffs-b1plus",
        "title": "Compare two options",
        "level": "B1+",
        "level_band": "B1–B1+",
        "description": "Compare two choices using comparatives and give a reasoned recommendation.",
        "ai_role": "A colleague helping you decide",
        "learner_role": "Someone weighing a decision",
        "opening_line": "I heard you're trying to decide between two options. Walk me through the pros and cons.",
        "target_vocabulary": ["whereas", "in contrast", "on balance", "outweigh", "trade-off"],
        "target_grammar": ["Comparative adjectives", "Concession: Although… / Even though…"],
        "estimated_minutes": 7,
    },
    # B1+-B2
    {
        "id": "job-interview-b2",
        "slug": "job-interview-b2",
        "title": "Job interview (STAR method)",
        "level": "B2",
        "level_band": "B1+–B2",
        "description": "Answer behavioral interview questions using the STAR structure with examples.",
        "ai_role": "A hiring manager conducting an interview",
        "learner_role": "A job candidate",
        "opening_line": "Thank you for coming in today. Could you start by telling me about a time you handled a difficult situation at work?",
        "target_vocabulary": ["situation", "task", "action", "result", "I was responsible for", "as a result"],
        "target_grammar": ["STAR narrative structure", "Past perfect for context", "Result clauses"],
        "estimated_minutes": 10,
    },
    {
        "id": "debate-social-issue-b2",
        "slug": "debate-social-issue-b2",
        "title": "Debate a social issue",
        "level": "B2",
        "level_band": "B1+–B2",
        "description": "Take a position on a social issue, defend it, and address counterarguments.",
        "ai_role": "A debate partner with the opposing view",
        "learner_role": "An advocate for a position",
        "opening_line": "Today's topic: should social media platforms be held responsible for misinformation? You're arguing in favor. Go ahead.",
        "target_vocabulary": ["misinformation", "regulate", "accountability", "counterargument", "evidence suggests"],
        "target_grammar": ["Persuasive language", "Concession + rebuttal", "Passive for objectivity"],
        "estimated_minutes": 10,
    },
    {
        "id": "explain-data-trend-b2",
        "slug": "explain-data-trend-b2",
        "title": "Explain a data trend",
        "level": "B2",
        "level_band": "B1+–B2",
        "description": "Describe a chart or trend using precise vocabulary and appropriate hedging.",
        "ai_role": "A colleague asking you to present findings",
        "learner_role": "A presenter explaining data",
        "opening_line": "Can you walk me through what you found in the data? I'll ask some follow-up questions.",
        "target_vocabulary": ["peaked", "declined", "remained steady", "approximately", "it appears that"],
        "target_grammar": ["Trend vocabulary", "Hedging: appears to / tends to", "Passive voice"],
        "estimated_minutes": 8,
    },
    {
        "id": "professional-email-b2",
        "slug": "professional-email-b2",
        "title": "Write a professional email",
        "level": "B2",
        "level_band": "B1+–B2",
        "description": "Compose a professional email with correct tone, structure, and clarity.",
        "ai_role": "Your manager reviewing your draft",
        "learner_role": "An employee drafting an email",
        "opening_line": "Let's practice writing a professional email. I'll play your manager — tell me what the email is about, then draft it aloud.",
        "target_vocabulary": ["I am writing to", "Please find attached", "I look forward to", "Kind regards", "as per"],
        "target_grammar": ["Formal register", "Polite request forms", "Email structure conventions"],
        "estimated_minutes": 8,
    },
    # B2-C1
    {
        "id": "executive-summary-c1",
        "slug": "executive-summary-c1",
        "title": "Give an executive summary",
        "level": "C1",
        "level_band": "B2–C1",
        "description": "Summarize a complex problem and make a clear recommendation with precision.",
        "ai_role": "A senior executive listening to a briefing",
        "learner_role": "A manager presenting recommendations",
        "opening_line": "I have five minutes. Give me the situation, the options, your recommendation, and the risks.",
        "target_vocabulary": ["bottom line", "mitigate", "stakeholders", "risk appetite", "I recommend"],
        "target_grammar": ["Concise sentence structures", "Nominalization", "Diplomatic hedging"],
        "estimated_minutes": 12,
    },
    {
        "id": "academic-discussion-c1",
        "slug": "academic-discussion-c1",
        "title": "Discuss a research finding",
        "level": "C1",
        "level_band": "B2–C1",
        "description": "Discuss a research finding with hedged claims, nuance, and academic vocabulary.",
        "ai_role": "A fellow researcher or academic",
        "learner_role": "A researcher presenting findings",
        "opening_line": "I read your abstract — fascinating methodology. How would you qualify the external validity of your conclusions?",
        "target_vocabulary": ["methodology", "external validity", "correlation vs causation", "it could be argued", "one limitation is"],
        "target_grammar": ["Hedged language", "Passive for objectivity", "Complex nominalization"],
        "estimated_minutes": 15,
    },
    {
        "id": "long-form-debate-c1",
        "slug": "long-form-debate-c1",
        "title": "Long-form debate with counterarguments",
        "level": "C1",
        "level_band": "B2–C1",
        "description": "Sustain a structured debate with strong arguments, counterarguments, and persuasion.",
        "ai_role": "An experienced debater with the opposing view",
        "learner_role": "A debater making and defending a case",
        "opening_line": "The motion is: 'Artificial intelligence will do more harm than good.' You're proposing. You have the floor.",
        "target_vocabulary": ["proposition", "concede", "rebuttal", "whereas", "the crux of the matter"],
        "target_grammar": ["Complex subordination", "Rhetorical devices", "Concession and rebuttal structures"],
        "estimated_minutes": 20,
    },
]

LEVEL_BAND_ORDER = ["A0–A1", "A1–A2", "A2–B1", "B1–B1+", "B1+–B2", "B2–C1"]


# ── Request / response models ─────────────────────────────────────────────────

class TurnMessage(BaseModel):
    role: str
    text: str


class TurnRequest(BaseModel):
    scenario_slug: str
    message: str
    history: List[TurnMessage] = []
    # Vocabulary targets the learner has NOT yet used in this session.
    # The frontend tracks chip status client-side and forwards the unused
    # subset on every turn so the AI can steer toward unmet objectives.
    remaining_targets: List[str] = []


@router.get("/me/conversations/scenarios")
async def list_scenarios(
    level: Optional[str] = Query(None, description="Filter by CEFR level band (e.g. A1, B1+–B2)"),
    _user=Depends(get_current_user),
):
    """Return all conversation scenarios, optionally filtered by level."""
    scenarios = SEED_SCENARIOS

    if level:
        # Support filtering by level band OR by individual level label
        level_upper = level.upper()
        scenarios = [
            s for s in scenarios
            if s["level"].upper() == level_upper
            or s["level_band"].upper() == level_upper
        ]

    return {
        "scenarios": scenarios,
        "total": len(scenarios),
        "level_bands": LEVEL_BAND_ORDER,
    }


@router.post("/me/conversations/turn")
async def conversation_turn(
    body: TurnRequest,
    user_id: UUID = Depends(get_current_user),
    service: AiTutorService = Depends(get_ai_tutor_service),
):
    """Send one conversational turn.

    Rate limited to 60 requests per minute per user. Returns 429 with
    Retry-After header when the limit is exceeded.

    Returns 503 with `ai_disabled` if the Anthropic key is not configured —
    consistent with the sibling AI tutor endpoints.
    """
    uid = str(user_id)
    retry_after = _check_rate_limit(uid)
    if retry_after is not None:
        return JSONResponse(
            status_code=429,
            content={
                "code": "rate_limited",
                "detail": f"Too many requests. Try again in {retry_after} seconds.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    if not settings.ai_tutor_enabled:
        return JSONResponse(
            status_code=503,
            content={
                "code": "ai_disabled",
                "detail": "AI features are not enabled on this server.",
            },
        )

    scenario = next(
        (s for s in SEED_SCENARIOS if s["slug"] == body.scenario_slug), None
    )
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    try:
        reply = await service.conversation_turn(
            scenario=scenario,
            history=[m.model_dump() for m in body.history],
            message=body.message,
            remaining_targets=body.remaining_targets,
            cefr_level=scenario.get("level", "A1"),
        )
    except AiDisabledException:
        return JSONResponse(
            status_code=503,
            content={
                "code": "ai_disabled",
                "detail": "AI features are not enabled on this server.",
            },
        )
    except Exception as exc:
        logger.exception("Conversation turn failed for user=%s: %s", uid, exc)
        raise HTTPException(status_code=500, detail="Conversation turn failed")

    return {
        "reply": reply,
        "turn_index": len(body.history) + 1,
        "vocab_used": [],  # populated server-side in phase 2b (per-turn evaluator)
    }


# ── End session models ────────────────────────────────────────────────────────

class EndSessionRequest(BaseModel):
    scenario_slug: str
    turn_count: int = 0
    vocab_hits: List[str] = []
    vocab_misses: List[str] = []
    history: List[TurnMessage] = []


class ConversationScores(BaseModel):
    task_success: float
    comprehension: float
    response_relevance: float
    language_control: float
    repair_ability: float
    independence: float


class EndSessionResponse(BaseModel):
    scores: ConversationScores
    feedback_summary: str
    review_items_added: List[str]
    target_vocab_hits: List[str]
    target_vocab_misses: List[str]


def _calculate_scores(
    turn_count: int,
    vocab_hits: List[str],
    vocab_misses: List[str],
    history: List[TurnMessage],
) -> ConversationScores:
    """Calculate conversation scores (0-5 scale) based on session data.

    When a live Claude scoring pass is available, replace this with an API call
    to score_session_prompt.py. For now, use heuristics.
    """
    total_vocab = len(vocab_hits) + len(vocab_misses)
    vocab_ratio = len(vocab_hits) / total_vocab if total_vocab > 0 else 0

    # Average learner message length (longer = more fluent)
    learner_msgs = [m.text for m in history if m.role == "learner"]
    avg_len = sum(len(m.split()) for m in learner_msgs) / len(learner_msgs) if learner_msgs else 0

    # Scale avg_len: 0 words=1, 5 words=2.5, 10 words=3.5, 20+=5
    fluency_proxy = min(5.0, 1.0 + (avg_len / 5.0))

    # task_success: based on vocab usage ratio and turn count
    task_success = round(min(5.0, 1.0 + vocab_ratio * 3.0 + min(1.0, turn_count / 5.0)), 1)

    # comprehension: based on turn count (more turns = better engagement)
    comprehension = round(min(5.0, 2.0 + min(2.0, turn_count / 3.0)), 1)

    # response_relevance: based on message length
    response_relevance = round(min(5.0, fluency_proxy), 1)

    # language_control: based on message length and vocab hits
    language_control = round(min(5.0, 1.5 + vocab_ratio * 2.0 + min(1.5, avg_len / 8.0)), 1)

    # repair_ability: default reasonable score for all learners
    repair_ability = round(min(5.0, 2.5 + min(1.5, turn_count / 4.0)), 1)

    # independence: based on vocab hits
    independence = round(min(5.0, 1.5 + vocab_ratio * 2.5 + min(1.0, turn_count / 5.0)), 1)

    return ConversationScores(
        task_success=task_success,
        comprehension=comprehension,
        response_relevance=response_relevance,
        language_control=language_control,
        repair_ability=repair_ability,
        independence=independence,
    )


def _generate_feedback(
    scores: ConversationScores,
    vocab_hits: List[str],
    vocab_misses: List[str],
    turn_count: int,
) -> str:
    """Generate a feedback summary string based on session scores."""
    avg_score = (
        scores.task_success + scores.comprehension + scores.response_relevance
        + scores.language_control + scores.repair_ability + scores.independence
    ) / 6

    if avg_score >= 4.0:
        opening = "Excellent work! You communicated clearly and confidently."
    elif avg_score >= 3.0:
        opening = "Good effort! You managed to communicate your message effectively."
    elif avg_score >= 2.0:
        opening = "Nice try! Keep practicing to build more fluency."
    else:
        opening = "Keep it up! Every conversation helps you improve."

    parts = [opening]

    if vocab_hits:
        parts.append(f"You used {len(vocab_hits)} target word(s): {', '.join(vocab_hits[:3])}{'...' if len(vocab_hits) > 3 else ''}.")

    if vocab_misses:
        parts.append(f"Try to use these next time: {', '.join(vocab_misses[:3])}.")

    if turn_count >= 4:
        parts.append("Great job keeping the conversation going!")
    elif turn_count >= 2:
        parts.append("Try to extend the conversation further next time.")

    return " ".join(parts)


@router.post("/me/conversations/end", response_model=EndSessionResponse)
async def end_conversation(
    body: EndSessionRequest,
    user_id: UUID = Depends(get_current_user),
    supabase=Depends(get_supabase_admin),
) -> EndSessionResponse:
    """End a conversation session and return scoring results.

    Calculates 6-criteria scores, generates feedback, and attempts to
    add missed vocabulary to the user's review queue.
    """
    scores = _calculate_scores(
        turn_count=body.turn_count,
        vocab_hits=body.vocab_hits,
        vocab_misses=body.vocab_misses,
        history=body.history,
    )
    feedback = _generate_feedback(scores, body.vocab_hits, body.vocab_misses, body.turn_count)

    review_items_added: List[str] = []

    if body.vocab_misses:
        now_iso = datetime.now(timezone.utc).isoformat()
        uid = str(user_id)
        for word in body.vocab_misses:
            try:
                supabase.table("review_items").insert({
                    "user_id": uid,
                    "item_type": "word",
                    "prompt": f"How do you use '{word}' in a sentence?",
                    "answer": word,
                    "note": f"Missed in '{body.scenario_slug}' conversation",
                    "ease_factor": 2.5,
                    "interval_days": 1,
                    "streak_correct": 0,
                    "next_review_at": now_iso,
                    "last_reviewed_at": None,
                }).execute()
                review_items_added.append(word)
            except Exception as exc:
                # Don't fail the whole end-session call if a single insert errors;
                # just skip the word and let the user retry later.
                logger.error("Failed to persist review_item '%s' for user %s: %s", word, uid, exc)

    return EndSessionResponse(
        scores=scores,
        feedback_summary=feedback,
        review_items_added=review_items_added,
        target_vocab_hits=body.vocab_hits,
        target_vocab_misses=body.vocab_misses,
    )


