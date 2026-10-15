import faster_whisper
import numpy as np

from app.models.speech import MAX_NEW_TOKENS, WhisperTranscriber


class FakeWhisper:
    def __init__(self, model, device, compute_type):
        self.calls = []

    def transcribe(self, samples, **options):
        self.calls.append(options)
        return iter([type("Segment", (), {"text": " А тэг хорин дөрөв "})()]), None


def test_transcribe_cannot_loop_for_long(monkeypatch):
    # Шуугиан дээр давталтад ороод 3 сек бичлэгт 30+ сек зарцуулдаг байсныг дахин гаргахгүй.
    monkeypatch.setattr(faster_whisper, "WhisperModel", FakeWhisper)
    transcriber = WhisperTranscriber("any", "int8", "mn")
    assert transcriber.transcribe(np.zeros(16_000, dtype=np.float32)) == "А тэг хорин дөрөв"
    options = transcriber._model.calls[0]
    assert options["temperature"] == 0.0
    assert options["max_new_tokens"] == MAX_NEW_TOKENS
    assert options["no_repeat_ngram_size"] > 0
    assert options["language"] == "mn"
    assert options["hotwords"] is None


def test_keyterms_become_whisper_hotwords(monkeypatch):
    monkeypatch.setattr(faster_whisper, "WhisperModel", FakeWhisper)
    transcriber = WhisperTranscriber("any", "int8", "mn")
    transcriber.transcribe(np.zeros(16_000, dtype=np.float32), ("Батбаяр",))
    assert transcriber._model.calls[0]["hotwords"] == "Батбаяр"
