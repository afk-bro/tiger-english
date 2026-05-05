"""
Lessons API — serves unit and CEFR-level data.

In production this would query the `units` and `modules` Supabase tables
(created by the Phase 1 DB migration).  During development, when the
migration tables are not yet available, this module falls back to the
same canonical data that the frontend static `units.ts` file exposes,
so the lessons page can always load through the backend API.
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter(tags=["lessons"])

# ---------------------------------------------------------------------------
# Canonical unit catalogue — mirrors src/features/lessons/data/units.ts
# ---------------------------------------------------------------------------

_UNITS = [
    # ── A1 ──────────────────────────────────────────────────────────────────
    {
        "slug": "unit-1",
        "number": 1,
        "title": "To Be: Introduction",
        "topic": "Personal information & meeting people",
        "grammar_focus": "Present tense of 'to be' (am / is / are)",
        "cefr_level": "A1",
        "status": "available",
        "estimated_minutes": 30,
        "sections": ["overview", "grammar", "vocabulary", "dialogues", "activities"],
    },
    {
        "slug": "unit-2",
        "number": 2,
        "title": "To Be + Location",
        "topic": "Talking about where people and things are",
        "grammar_focus": "Subject pronouns + 'to be' for location",
        "cefr_level": "A1",
        "status": "available",
        "estimated_minutes": 35,
        "sections": ["overview", "grammar", "vocabulary", "dialogues", "activities"],
    },
    {
        "slug": "unit-3", "number": 3,
        "title": "Greetings & Saying Goodbye", "topic": "Common greetings and farewells",
        "grammar_focus": "Hello / Hi / Good morning / Goodbye / See you",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-4", "number": 4,
        "title": "The Alphabet & Spelling", "topic": "Spelling your name out loud",
        "grammar_focus": "English alphabet pronunciation",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-5", "number": 5,
        "title": "Numbers 1–20", "topic": "Counting and basic numbers",
        "grammar_focus": "Cardinal numbers; asking 'How many?'",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-6", "number": 6,
        "title": "My Age & Birthday", "topic": "Talking about age and dates",
        "grammar_focus": "How old are you? Ordinal numbers.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-7", "number": 7,
        "title": "Where Are You From?", "topic": "Countries and nationalities",
        "grammar_focus": "I'm from … / I'm [nationality].",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-8", "number": 8,
        "title": "Colours & Basic Descriptions", "topic": "Describing things with colours",
        "grammar_focus": "What colour is it? Adjective + noun order.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-9", "number": 9,
        "title": "Classroom Commands", "topic": "Following teacher instructions",
        "grammar_focus": "Open your book. Listen. Repeat.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-10", "number": 10,
        "title": "Classroom Objects", "topic": "Naming things around you",
        "grammar_focus": "What is this? It's a … pen, book, desk.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-11", "number": 11,
        "title": "Asking for Help", "topic": "Getting clarification in class",
        "grammar_focus": "Can you repeat that? I don't understand.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-12", "number": 12,
        "title": "Please & Thank You", "topic": "Basic politeness formulas",
        "grammar_focus": "Thank you / You're welcome / Excuse me / Sorry.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-13", "number": 13,
        "title": "Food & Drink Vocabulary", "topic": "Common foods and drinks",
        "grammar_focus": "This is … / I like … / I don't like …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-14", "number": 14,
        "title": "At the Café", "topic": "Ordering a drink or snack",
        "grammar_focus": "Can I have …? I'd like … How much is it?",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-15", "number": 15,
        "title": "Do You Like …?", "topic": "Expressing likes and dislikes",
        "grammar_focus": "Do you like …? Yes, I love it. / No, not really.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-16", "number": 16,
        "title": "Numbers 20–100 & Prices", "topic": "Bigger numbers and shopping vocabulary",
        "grammar_focus": "How much does it cost? It costs …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-17", "number": 17,
        "title": "My Family", "topic": "Family member vocabulary",
        "grammar_focus": "This is my mother / father. Possessive adjectives.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-18", "number": 18,
        "title": "Describing People", "topic": "Basic physical descriptions",
        "grammar_focus": "She is tall / short / young / old.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-19", "number": 19,
        "title": "This Is My Friend", "topic": "Introducing others",
        "grammar_focus": "This is … / He is … / She is … Third-person 'to be'.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-20", "number": 20,
        "title": "Possessive 's", "topic": "Showing belonging",
        "grammar_focus": "That is Maria's bag. Whose is this? It's mine / yours.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-21", "number": 21,
        "title": "Telling the Time", "topic": "Hours and minutes",
        "grammar_focus": "What time is it? It's … o'clock / half past.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-22", "number": 22,
        "title": "Days of the Week", "topic": "Seven days and schedules",
        "grammar_focus": "What day is it today? It's Monday.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-23", "number": 23,
        "title": "Months & Seasons", "topic": "Months and weather patterns",
        "grammar_focus": "What month is it? In winter / summer it's …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-24", "number": 24,
        "title": "Daily Routine", "topic": "Simple daily schedule",
        "grammar_focus": "I wake up at … I go to school at …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-25", "number": 25,
        "title": "My Home", "topic": "Rooms and furniture",
        "grammar_focus": "This is the living room. There is a sofa.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-26", "number": 26,
        "title": "In the Classroom", "topic": "School objects and places",
        "grammar_focus": "Where is the … ? It's next to / under / on the …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-27", "number": 27,
        "title": "Getting Around", "topic": "Basic transport and directions",
        "grammar_focus": "Turn left / right. Go straight. Take the bus.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-28", "number": 28,
        "title": "Places in Town", "topic": "Local landmarks and shops",
        "grammar_focus": "There is a park near here. Where is the bank?",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-29", "number": 29,
        "title": "Can You …?", "topic": "Talking about ability",
        "grammar_focus": "Can you swim? Yes, I can. / No, I can't. Modal: can.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-30", "number": 30,
        "title": "Sports & Hobbies", "topic": "Free-time activities",
        "grammar_focus": "I play football. I like reading.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-31", "number": 31,
        "title": "How Often?", "topic": "Frequency adverbs",
        "grammar_focus": "I always / usually / sometimes / never …",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-32", "number": 32,
        "title": "A0–A1 Review", "topic": "Consolidation of A0–A1 learning",
        "grammar_focus": "Review all A0–A1 grammar, vocabulary, and dialogue patterns.",
        "cefr_level": "A1", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    # ── A2 ──────────────────────────────────────────────────────────────────
    {
        "slug": "unit-33", "number": 33,
        "title": "Simple Present Tense", "topic": "Talking about habits and facts",
        "grammar_focus": "I work. She works. Do you work? Yes/No questions.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-34", "number": 34,
        "title": "A Morning Routine", "topic": "Sequencing daily events",
        "grammar_focus": "First I … then I … After that I … Time connectors.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-35", "number": 35,
        "title": "At the Weekend", "topic": "Weekend activities and plans",
        "grammar_focus": "What do you do at the weekend? I usually …",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-36", "number": 36,
        "title": "Plans for Tomorrow", "topic": "Simple future with 'going to'",
        "grammar_focus": "I'm going to … tomorrow. Are you going to …?",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-37", "number": 37,
        "title": "At the Shop", "topic": "Shopping vocabulary and prices",
        "grammar_focus": "How much is this? That's too expensive. I'll take it.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-38", "number": 38,
        "title": "Clothes & Sizes", "topic": "Clothing vocabulary and trying on",
        "grammar_focus": "I'd like to try on … Do you have it in size …?",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-39", "number": 39,
        "title": "Comparing Things", "topic": "Comparative adjectives",
        "grammar_focus": "This is bigger / cheaper / nicer than … Which one do you prefer?",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-40", "number": 40,
        "title": "Making a Purchase", "topic": "Completing a transaction",
        "grammar_focus": "I'll pay by card / cash. Can I have a receipt?",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-41", "number": 41,
        "title": "Parts of the Body", "topic": "Body vocabulary and health",
        "grammar_focus": "My head hurts. I have a cold. What's wrong?",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-42", "number": 42,
        "title": "At the Doctor's", "topic": "Medical appointments",
        "grammar_focus": "I have a … I feel … You should rest.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-43", "number": 43,
        "title": "Giving Advice", "topic": "Should / shouldn't",
        "grammar_focus": "You should drink water. You shouldn't eat sugar.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
    {
        "slug": "unit-44", "number": 44,
        "title": "A1–A2 Review", "topic": "Consolidation of A1–A2 learning",
        "grammar_focus": "Review all A1–A2 grammar, vocabulary, and dialogue patterns.",
        "cefr_level": "A2", "status": "coming-soon", "estimated_minutes": 40, "sections": [],
    },
]

# CEFR levels in canonical order
_CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]


@router.get("/levels")
async def get_levels():
    """
    Returns a summary of CEFR levels with unit counts.
    Used by the lessons index page to display the level structure.

    In production this queries the `units` table in Supabase.
    """
    level_counts: dict[str, dict] = {}
    for unit in _UNITS:
        lvl = unit["cefr_level"]
        if lvl not in level_counts:
            level_counts[lvl] = {"cefr_level": lvl, "unit_count": 0, "available_count": 0}
        level_counts[lvl]["unit_count"] += 1
        if unit["status"] == "available":
            level_counts[lvl]["available_count"] += 1

    levels = [level_counts[lvl] for lvl in _CEFR_ORDER if lvl in level_counts]
    return {"levels": levels, "total_units": len(_UNITS)}


@router.get("/units")
async def get_units(cefr_level: Optional[str] = None, status: Optional[str] = None):
    """
    Returns the unit catalogue, optionally filtered by CEFR level or status.
    The lessons index page uses this to render unit cards.

    In production this queries the `units` table in Supabase.
    """
    result = _UNITS
    if cefr_level:
        result = [u for u in result if u["cefr_level"] == cefr_level.upper()]
    if status:
        result = [u for u in result if u["status"] == status]
    return {"units": result, "count": len(result)}
