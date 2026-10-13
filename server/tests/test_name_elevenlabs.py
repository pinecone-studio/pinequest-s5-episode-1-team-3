import io
import wave

import numpy as np
import pytest
from conftest import FakeClassifier, FakeTranscriber
from test_api import fake_models, post  # noqa: F401  fixture-ийг дахин ашиглана

from app.main import models
from app.models.stt import ElevenLabsTranscriber
from app.models.tts import SpeechError
from app.schemas import SoundResult, TalkTranscript


class RecordingTranscriber(FakeTranscriber):
    def __init__(self, text: str = "", error: SpeechError | None = None) -> None:
        super().__init__(text)
        self.calls = 0
        self.error = error

    def transcribe(self, samples: np.ndarray) -> str:
        self.calls += 1
        if self.error:
            raise self.error
        return self.text


@pytest.fixture
def eleven(fake_models, monkeypatch):  # noqa: F811
    remote = RecordingTranscriber("Болдоо, нааш ир")
    monkeypatch.setattr(models, "classifier", FakeClassifier(SoundResult(label="speech", score=0.8)))
    monkeypatch.setattr(models, "name_transcriber", remote)
    return remote


def test_name_mode_uses_elevenlabs(eleven):
    body = post("name", {"name": "Болд"}).json()
    assert body["match"] == {"type": "name", "value": "Болд", "window": None}
    assert body["transcript"] == "Болдоо, нааш ир"
    assert eleven.calls == 1


@pytest.mark.parametrize("sound", [None, SoundResult(label="other", score=0.9)])
def test_quiet_clip_is_not_sent_to_elevenlabs(eleven, monkeypatch, sound):
    monkeypatch.setattr(models, "classifier", FakeClassifier(sound))
    body = post("name", {"name": "Болд"}).json()
    assert body["transcript"] is None and body["match"] is None
    assert eleven.calls == 0


def test_elevenlabs_failure_uses_error_contract(eleven):
    eleven.error = SpeechError("STT_DEMO_LIMIT", 429)
    response = post("name", {"name": "Болд"})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "STT_DEMO_LIMIT"


def test_queue_mode_still_uses_whisper(eleven):
    assert post("queue", {"ticket": "А-024"}).json()["match"]["value"] == "А-024"
    assert eleven.calls == 0


def test_elevenlabs_transcriber_sends_16khz_wav():
    class FakeService:
        def transcribe(self, audio):
            self.audio = audio
            return TalkTranscript(text="Болд")

    service = FakeService()
    samples = np.full(16_000, 0.5, dtype=np.float32)
    assert ElevenLabsTranscriber(service, 16_000).transcribe(samples) == "Болд"
    assert service.audio.content_type == "audio/wav"
    with wave.open(io.BytesIO(service.audio.audio)) as clip:
        assert (clip.getnchannels(), clip.getframerate(), clip.getnframes()) == (1, 16_000, 16_000)
