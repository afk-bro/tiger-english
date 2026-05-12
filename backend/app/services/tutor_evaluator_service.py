"""Rule-based AI tutor evaluator.

Evaluates a user transcript against a TutorTask definition's accept patterns
and correction templates. Pure function-style: deterministic, no I/O.
"""

from __future__ import annotations

import re
from typing import Any

from app.models.tutor import EvaluationResult, TurnCorrection, TutorTask


# Characters to keep when normalizing transcripts: word chars, whitespace, apostrophes.
_STRIP_RE = re.compile(r"[^\w\s']", flags=re.UNICODE)
_WS_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    """Lowercase, strip non-word/non-apostrophe punctuation, collapse whitespace."""
    lowered = text.lower()
    stripped = _STRIP_RE.sub(" ", lowered)
    collapsed = _WS_RE.sub(" ", stripped)
    return collapsed.strip()


def _normalize_preserve_case(text: str) -> str:
    """Like _normalize but keeps original casing — used for correction-template
    capture groups so substituted names keep their original case."""
    stripped = _STRIP_RE.sub(" ", text)
    collapsed = _WS_RE.sub(" ", stripped)
    return collapsed.strip()


def _as_dict(task: TutorTask | dict[str, Any]) -> dict[str, Any]:
    if isinstance(task, TutorTask):
        return task.model_dump()
    return task


class TutorEvaluatorService:
    """Rule-based evaluator for tutor turns.

    Given a transcript and a task definition (accept patterns + correction
    templates), determines whether the user attempted/completed the task,
    extracts any correction, and decides whether the session should advance.
    """

    def evaluate(
        self,
        transcript: str,
        task: TutorTask | dict[str, Any],
    ) -> EvaluationResult:
        task_data = _as_dict(task)
        normalized = _normalize(transcript)
        normalized_cased = _normalize_preserve_case(transcript)

        accept_patterns: list[Any] = task_data.get("accept_patterns") or []
        correction_templates: list[dict[str, Any]] = task_data.get("correction_templates") or []

        matched_pattern: str | None = None
        task_completed = False

        # Step 1: scan accept_patterns. First match wins.
        for pattern in accept_patterns:
            if isinstance(pattern, str):
                needle = pattern.lower().strip()
                if needle and needle in normalized:
                    matched_pattern = pattern
                    task_completed = True
                    break
            elif isinstance(pattern, dict) and "regex" in pattern:
                regex = pattern["regex"]
                if regex and re.search(regex, normalized, re.IGNORECASE):
                    matched_pattern = regex
                    task_completed = True
                    break

        # Step 2: scan correction_templates. First match wins.
        correction: TurnCorrection | None = None
        severity: str = "none"
        for tmpl in correction_templates:
            match_regex = tmpl.get("match_regex")
            if not match_regex:
                continue
            m = re.search(match_regex, normalized_cased, re.IGNORECASE)
            if not m:
                continue

            template_str = tmpl.get("corrected_en_template", "")
            # {0} = full match, {1..N} = capture groups
            groups = m.groups()
            corrected_en = template_str.format(m.group(0), *groups)

            tmpl_severity = tmpl.get("severity", "minor")
            correction = TurnCorrection(
                corrected_en=corrected_en,
                explanation_vi=tmpl.get("explanation_vi", ""),
                translation_vi=None,
                severity=tmpl_severity,
                explanation_key=tmpl.get("explanation_key"),
            )
            severity = tmpl_severity
            # A correction-template match implies an attempt at the task.
            task_completed = True
            break

        should_advance = task_completed and severity != "major"

        return EvaluationResult(
            kind="evaluated",
            task_completed=task_completed,
            severity=severity,  # type: ignore[arg-type]
            correction=correction,
            should_advance=should_advance,
            matched_pattern=matched_pattern,
        )


# ---------------------------------------------------------------------------
# Module-level detectors used by the tutor session loop.
# ---------------------------------------------------------------------------

_END_LESSON_EN = re.compile(r"\b(end|finish|stop)\s+(the\s+)?(lesson|session)\b", re.IGNORECASE)
_END_LESSON_VI = re.compile(r"kết thúc bài học", re.IGNORECASE)
_VI_DIACRITICS = re.compile(
    r"[ạáàảãâấầẩẫậăắằẳẵặéèẻẽêếềểễệíìỉĩịóòỏõôốồổỗộơớờởỡợúùủũưứừửữựýỳỷỹỵđ]",
    re.IGNORECASE,
)


def detect_end_lesson(transcript: str) -> bool:
    """Return True if the transcript signals an intent to end the lesson.

    Matches English variants like "end lesson", "end the lesson",
    "finish session", "stop the lesson", and the Vietnamese phrase
    "kết thúc bài học".
    """
    return bool(_END_LESSON_EN.search(transcript) or _END_LESSON_VI.search(transcript))


def is_vietnamese_text(transcript: str) -> bool:
    """Return True if the transcript contains Vietnamese diacritics.

    Used to detect the user falling back to L1 (Vietnamese) during an
    English-only tutor turn.
    """
    return bool(_VI_DIACRITICS.search(transcript))
