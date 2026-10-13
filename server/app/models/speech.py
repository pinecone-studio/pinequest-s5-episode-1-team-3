"""Монгол яриа → бичвэр: Whisper (faster-whisper).

WHISPER_MODEL-ийг сольж бэлэн загвар ("small") эсвэл бидний fine-tune хийсэн
CTranslate2 загвар (HF Hub-ийн нэр) руу шилжинэ. Код өөрчлөхгүй.
Ерийн Whisper монгол яриаг бараг танихгүй: training/whisper/convert_ct2.py-аар монгол загварыг хөрвүүлнэ.
"""

from __future__ import annotations

from typing import Protocol

import numpy as np

# Тодорхой тоо бүү бич: чимээгүй бичлэг дээр загвар тэр тоог «сонссон» гэж гаргадаг.
INITIAL_PROMPT = "Дарааллын дугаар, цонх."
# Монгол загвар шуугиан дээр «ааааа…» давталтад орж, temperature-ээр 5 дахин оролдоод 3 сек бичлэгт
# 30+ сек зарцуулсан. Загвар lock-той тул бусад хүсэлт ч зогсоно. 3 сек зарлал ~20–30 токен.
MAX_NEW_TOKENS = 64
NO_REPEAT_NGRAM = 3


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
            temperature=0.0,
            max_new_tokens=MAX_NEW_TOKENS,
            no_repeat_ngram_size=NO_REPEAT_NGRAM,
        )
        return " ".join(segment.text.strip() for segment in segments).strip()
