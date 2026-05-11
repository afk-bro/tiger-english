"""AI tutor service — wraps the Anthropic SDK with graceful fallback.

If the ``anthropic`` package is not installed (or no API key is configured)
every public method raises ``AiDisabledException`` instead of crashing.
"""
from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from ..core.config import settings
from ..models.ai_tutor import (
    CorrectionResponse,
    ExplainResponse,
    PracticeItem,
    PracticeResponse,
    WritingCoachResponse,
    WritingScore,
    InlineAnnotation,
)

if TYPE_CHECKING:
    pass  # keep imports clean for type checker

logger = logging.getLogger(__name__)

# Try to import the Anthropic SDK — it may not be installed yet.
try:
    import anthropic as _anthropic_sdk  # noqa: F401 – import only to verify availability

    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False


class AiDisabledException(Exception):
    """Raised when the AI tutor cannot be used (no key / no package)."""


def _build_client():
    """Lazily construct an Anthropic client only when needed."""
    if not _ANTHROPIC_AVAILABLE:
        raise AiDisabledException("anthropic package not installed")
    if not settings.ai_tutor_enabled:
        raise AiDisabledException(
            "AI tutor disabled — set AI_TUTOR_ENABLED=true and a valid ANTHROPIC_API_KEY"
        )
    import anthropic  # noqa: PLC0415 – intentional lazy import

    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


# ── System prompts ───────────────────────────────────────────────────────────

_SYSTEM_EXPLAIN = (
    "You are an expert English language tutor for adult learners. "
    "Your explanations are clear, concise, and matched to the learner's CEFR level. "
    "Use simple language for A0-A2 learners, richer examples for B1-C1. "
    "Always respond in the learner's native language unless asked otherwise, "
    "but keep English examples in English."
)

_SYSTEM_CORRECT = (
    "You are an English grammar correction assistant. "
    "You respond ONLY with valid JSON matching the schema provided. Do not add markdown fences. "
    "Fields: original (the sentence as given), corrected (fixed English), "
    "explanation (why, in English), explanation_l1 (same in the learner's language), "
    "try_again_prompt (a short fill-in-the-blank or rewrite prompt based on the correction), "
    "try_again_answer (the expected answer)."
)

_SYSTEM_PRACTICE = (
    "You are an English drill generator. "
    "Respond ONLY with valid JSON: { \"items\": [ { \"question\": \"...\", \"answer\": \"...\", \"hint\": \"...\" } ] }. "
    "Do not add markdown fences. Tailor difficulty to the CEFR level."
)

_SYSTEM_WRITING = (
    "You are a writing coach for English learners. "
    "Respond ONLY with valid JSON matching the schema provided. Do not add markdown fences. "
    "Fields: scores (array of { skill, score 0-10, comment }), "
    "inline_annotations (array of { offset, length, issue, suggestion }), "
    "rewritten_exemplar (a polished rewrite of the text)."
)


def _history_to_anthropic_messages(
    history: list[dict],
    latest_user_message: str,
) -> list[dict]:
    """Convert our domain conversation history into a valid Anthropic
    `messages` array for `client.messages.create`.

    Handles three concrete invariants Anthropic enforces:

    1. Role mapping: domain roles are {"tutor", "learner"} (matching the
       frontend's ChatMessage shape). Map tutor → assistant, learner →
       user.
    2. Must start with a user turn: if the history begins with one or
       more assistant turns (the seeded scenario opening line is one of
       these), drop them. The opening line is preserved as context in
       the system prompt by the caller.
    3. Must alternate roles: collapse consecutive same-role turns by
       joining their text with newlines. This is defensive — a
       well-behaved frontend shouldn't produce same-role runs, but the
       cost of guarding is one pass and the failure mode (HTTP 400 from
       Anthropic) is hard to debug at runtime.
    """
    # Step 1: map roles, ignore unknown role values defensively.
    mapped: list[dict] = []
    for turn in history:
        role = turn.get("role")
        if role == "tutor":
            mapped.append({"role": "assistant", "content": turn.get("text", "")})
        elif role == "learner":
            mapped.append({"role": "user", "content": turn.get("text", "")})
        # Unknown roles are skipped silently — better to lose a turn than
        # to send an invalid sequence.

    # Step 2: drop leading assistant turns so the array starts with user.
    while mapped and mapped[0]["role"] == "assistant":
        mapped.pop(0)

    # Step 3: collapse consecutive same-role turns (defensive).
    collapsed: list[dict] = []
    for turn in mapped:
        if collapsed and collapsed[-1]["role"] == turn["role"]:
            collapsed[-1]["content"] = collapsed[-1]["content"] + "\n" + turn["content"]
        else:
            collapsed.append(turn)

    # Append the latest user message. If the previous turn is also a
    # user turn (e.g. history was empty after stripping), merge into it
    # to maintain alternation.
    if collapsed and collapsed[-1]["role"] == "user":
        collapsed[-1]["content"] = collapsed[-1]["content"] + "\n" + latest_user_message
    else:
        collapsed.append({"role": "user", "content": latest_user_message})

    return collapsed


def _build_conversation_system_prompt(
    scenario: dict,
    remaining_targets: list[str],
    cefr_level: str,
) -> str:
    """Build the system prompt for one conversation turn.

    Includes scenario roleplay context, target vocabulary still to elicit,
    and CEFR-appropriate language difficulty. The 'remaining targets'
    line is the steering signal — it tells the model which vocab the
    learner has not yet practiced this session, so the model can set up
    situations that naturally elicit those words rather than running in
    generic loops.
    """
    target_grammar = ", ".join(scenario.get("target_grammar", [])) or "natural conversational English"
    if remaining_targets:
        steering = (
            "Vocabulary the learner has NOT yet used in this session: "
            + ", ".join(remaining_targets)
            + ". Naturally guide the conversation toward situations where they would "
            "produce these words. Do NOT say the words for them — set up prompts that "
            "elicit them. Once a target word appears in the learner's reply, move on."
        )
    else:
        steering = (
            "The learner has used every target word at least once. "
            "Wrap the scenario up with a friendly, in-character closing exchange."
        )

    # The scenario's seeded opening line is shown to the learner in the UI
    # but isn't part of the messages array (Anthropic requires the array
    # to start with a user turn, so any leading assistant turn is folded
    # into the system prompt instead). Include it here so the model knows
    # what the learner is responding to in their first message.
    opening = scenario.get("opening_line")
    opening_clause = f'You opened the scenario by saying: "{opening}"\n\n' if opening else ""

    return (
        f"You are roleplaying as: {scenario.get('ai_role', 'an English tutor')}. "
        f"The learner is roleplaying as: {scenario.get('learner_role', 'an English learner')}. "
        f"Scenario: {scenario.get('description', '')}\n\n"
        f"{opening_clause}"
        f"Target grammar to practice: {target_grammar}.\n"
        f"Learner CEFR level: {cefr_level} — keep your English at or just above this level. "
        f"Use short sentences and concrete vocabulary for A0-A2; richer structures and "
        f"idioms for B1+.\n\n"
        f"{steering}\n\n"
        "Stay in character. Keep replies short (1-3 sentences). Do not lecture, do not "
        "translate, do not break the fourth wall. Vary your wording — never repeat your "
        "previous reply verbatim or near-verbatim."
    )


# ── Public service class ─────────────────────────────────────────────────────


class AiTutorService:
    """Thin async wrapper around the Anthropic Messages API."""

    async def explain(
        self,
        question: str,
        context: str | None,
        learner_language: str,
        cefr_level: str,
    ) -> ExplainResponse:
        client = _build_client()
        user_msg = f"[Learner level: {cefr_level}] [Native language: {learner_language}]\n\nQuestion: {question}"
        if context:
            user_msg += f"\n\nLesson context:\n{context}"

        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=1024,
            system=_SYSTEM_EXPLAIN,
            messages=[{"role": "user", "content": user_msg}],
        )
        explanation = message.content[0].text if message.content else ""
        return ExplainResponse(explanation=explanation)

    async def stream_explain(
        self,
        question: str,
        context: str | None,
        learner_language: str,
        cefr_level: str,
    ):
        """Async generator that yields text tokens from the AI explanation stream."""
        from typing import AsyncGenerator  # noqa: PLC0415

        client = _build_client()
        user_msg = f"[Learner level: {cefr_level}] [Native language: {learner_language}]\n\nQuestion: {question}"
        if context:
            user_msg += f"\n\nLesson context:\n{context}"

        async with client.messages.stream(
            model=settings.ai_default_model,
            max_tokens=1024,
            system=_SYSTEM_EXPLAIN,
            messages=[{"role": "user", "content": user_msg}],
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def correct(
        self,
        sentence: str,
        learner_language: str,
        cefr_level: str,
    ) -> CorrectionResponse:
        client = _build_client()
        user_msg = (
            f"[Learner level: {cefr_level}] [Native language: {learner_language}]\n\n"
            f"Correct this sentence and return JSON:\n{sentence}"
        )
        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=1024,
            system=_SYSTEM_CORRECT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("AI /correct returned non-JSON: %s", raw[:200])
            data = {
                "original": sentence,
                "corrected": sentence,
                "explanation": raw,
                "explanation_l1": raw,
                "try_again_prompt": "",
                "try_again_answer": "",
            }
        return CorrectionResponse(
            original=data.get("original", sentence),
            corrected=data.get("corrected", sentence),
            explanation=data.get("explanation", ""),
            explanation_l1=data.get("explanation_l1", ""),
            try_again_prompt=data.get("try_again_prompt", ""),
            try_again_answer=data.get("try_again_answer", ""),
        )

    async def practice(
        self,
        skill: str,
        topic: str | None,
        cefr_level: str,
        learner_language: str,
        count: int,
    ) -> PracticeResponse:
        client = _build_client()
        topic_clause = f" on the topic of '{topic}'" if topic else ""
        user_msg = (
            f"[Level: {cefr_level}] [Native: {learner_language}]\n\n"
            f"Generate {count} {skill} drill items{topic_clause}."
        )
        message = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=2048,
            system=_SYSTEM_PRACTICE,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
            items = [PracticeItem(**item) for item in data.get("items", [])]
        except (json.JSONDecodeError, Exception):
            logger.warning("AI /practice returned non-JSON: %s", raw[:200])
            items = []
        return PracticeResponse(items=items)

    async def writing_coach(
        self,
        text: str,
        learner_language: str,
        cefr_level: str,
    ) -> WritingCoachResponse:
        client = _build_client()
        user_msg = (
            f"[Level: {cefr_level}] [Native: {learner_language}]\n\n"
            f"Provide writing feedback for:\n\n{text}"
        )
        message = await client.messages.create(
            model=settings.ai_haiku_model,
            max_tokens=2048,
            system=_SYSTEM_WRITING,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text if message.content else "{}"
        try:
            data = json.loads(raw)
            scores = [WritingScore(**s) for s in data.get("scores", [])]
            annotations = [InlineAnnotation(**a) for a in data.get("inline_annotations", [])]
            rewritten = data.get("rewritten_exemplar", text)
        except (json.JSONDecodeError, Exception):
            logger.warning("AI /writing-coach returned non-JSON: %s", raw[:200])
            scores = []
            annotations = []
            rewritten = text
        return WritingCoachResponse(
            scores=scores,
            inline_annotations=annotations,
            rewritten_exemplar=rewritten,
        )

    async def conversation_turn(
        self,
        scenario: dict,
        history: list[dict],
        message: str,
        remaining_targets: list[str],
        cefr_level: str,
    ) -> str:
        """Generate one in-character roleplay reply for a /turn request.

        `history` is a list of {role, text} turns where role ∈ {"ai", "learner"}.
        Returns the reply text. Caller is responsible for ai_disabled
        gating and rate-limiting.
        """
        client = _build_client()
        system_prompt = _build_conversation_system_prompt(
            scenario, remaining_targets, cefr_level
        )

        msgs = _history_to_anthropic_messages(history, message)

        response = await client.messages.create(
            model=settings.ai_default_model,
            max_tokens=300,
            system=system_prompt,
            messages=msgs,
        )
        return response.content[0].text if response.content else ""
