"""Апп-аас ирсэн аудиог (m4a, wav, webm) 16kHz mono float32 болгох."""

import io

import numpy as np
from faster_whisper.audio import decode_audio

SAMPLE_RATE = 16_000


class AudioError(ValueError):
    """Аудиог уншиж чадсангүй."""


def decode(data: bytes) -> np.ndarray:
    try:
        samples = decode_audio(io.BytesIO(data), sampling_rate=SAMPLE_RATE)
    except Exception as exc:  # PyAV формат бүрт өөр төрлийн алдаа өгдөг
        raise AudioError("Аудиог уншиж чадсангүй") from exc
    if samples.size == 0:
        raise AudioError("Аудио хоосон байна")
    return samples


def duration_seconds(samples: np.ndarray) -> float:
    return samples.size / SAMPLE_RATE
