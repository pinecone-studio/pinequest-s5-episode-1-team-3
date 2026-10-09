import io
import os
import wave

import numpy as np
import pytest

# Тестэд жинхэнэ AI загвар ачаалахгүй (хурдан, интернэтгүй ажиллана)
os.environ["LOAD_MODELS"] = "false"

from app.schemas import SoundResult  # noqa: E402


class FakeClassifier:
    def __init__(self, result: SoundResult | None = None) -> None:
        self.result = result

    def classify(self, samples: np.ndarray) -> SoundResult | None:
        return self.result


class FakeTranscriber:
    def __init__(self, text: str = "") -> None:
        self.text = text

    def transcribe(self, samples: np.ndarray) -> str:
        return self.text


def wav_bytes(seconds: float = 1.0, rate: int = 16_000) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(np.zeros(int(seconds * rate), dtype=np.int16).tobytes())
    return buffer.getvalue()


@pytest.fixture
def silence() -> np.ndarray:
    return np.zeros(16_000, dtype=np.float32)
