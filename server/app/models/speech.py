"""Монгол яриа → бичвэр: Whisper (faster-whisper).

WHISPER_MODEL-ийг сольж бэлэн загвар ("small") эсвэл бидний fine-tune хийсэн
CTranslate2 загвар (HF Hub-ийн нэр) руу шилжинэ. Код өөрчлөхгүй.
"""

from __future__ import annotations

from typing import Protocol

import numpy as np

# Тодорхой тоо бүү бич: чимээгүй бичлэг дээр загвар тэр тоог «сонссон» гэж гаргадаг.
INITIAL_PROMPT = "Дарааллын дугаар, цонх."


class Transcriber(Protocol):
    def transcribe(self, samples: np.ndarray) -> str: ...


class WhisperTranscriber:
    def __init__(self, model: str, compute_type: str, language: str) -> None:
        from faster_whisper import WhisperModel  # хүнд сан: зөвхөн серверт ачаална

        self._model = WhisperModel(model, device="cpu", compute_type=compute_type)
        self._language = language

    def transcribe(self, samples: np.ndarray) -> str:
        segments, _ = self._model.transcribe(
            samples,
            language=self._language,
            beam_size=1,
            vad_filter=True,
            initial_prompt=INITIAL_PROMPT,
        )
        return " ".join(segment.text.strip() for segment in segments).strip()
