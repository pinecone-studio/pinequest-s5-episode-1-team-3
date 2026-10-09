"""Горим бүрт аль загварыг ажиллуулж, хариуг хэрхэн бүрдүүлэх вэ.

Загваруудыг гаднаас авдаг тул жинхэнэ AI-гүйгээр тестлэхэд хялбар.
"""

from __future__ import annotations

import numpy as np

from app.models.sound import SoundClassifier
from app.models.speech import Transcriber
from app.schemas import DetectionMatch, DetectionResult, DetectMode
from app.text.matching import name_mentioned, parse_ticket, queue_matches
from app.text.numbers import parse_queue_call


def run_detection(
    samples: np.ndarray,
    mode: DetectMode,
    classifier: SoundClassifier,
    transcriber: Transcriber,
    ticket: str | None = None,
    name: str | None = None,
) -> DetectionResult:
    if mode == "home":
        return DetectionResult(sound=classifier.classify(samples))

    transcript = transcriber.transcribe(samples)
    match: DetectionMatch | None = None

    if mode == "queue" and ticket:
        parsed = parse_ticket(ticket)
        call = parse_queue_call(transcript)
        if parsed is not None and queue_matches(call, parsed):
            match = DetectionMatch(type="queue", value=parsed.label, window=call.window)
    elif mode == "name" and name and name_mentioned(transcript, name):
        match = DetectionMatch(type="name", value=name)

    return DetectionResult(transcript=transcript or None, match=match)
