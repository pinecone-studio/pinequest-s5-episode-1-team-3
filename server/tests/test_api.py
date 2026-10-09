import pytest
from conftest import FakeClassifier, FakeTranscriber, wav_bytes
from fastapi.testclient import TestClient

from app.main import app, models
from app.schemas import SoundResult

client = TestClient(app)


@pytest.fixture
def fake_models():
    models.classifier = FakeClassifier(SoundResult(label="knock", score=0.9))
    models.transcriber = FakeTranscriber("А тэг хорин дөрөв, гуравдугаар цонх")
    yield models
    models.classifier = None
    models.transcriber = None


def post(mode: str, data: dict | None = None, audio: bytes | None = None):
    files = {"audio": ("clip.wav", audio if audio is not None else wav_bytes(), "audio/wav")}
    return client.post("/api/v1/detect", data={"mode": mode, **(data or {})}, files=files)


def test_health_without_models():
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok"
    assert body["models"] == {"sound": None, "whisper": None}


def test_detect_without_models_returns_503():
    response = post("home")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "MODELS_NOT_LOADED"


def test_home_returns_sound(fake_models):
    body = post("home").json()
    assert body["sound"] == {"label": "knock", "score": 0.9}
    assert body["match"] is None
    assert body["latencyMs"] >= 0


def test_queue_match(fake_models):
    body = post("queue", {"ticket": "А-024"}).json()
    assert body["match"] == {"type": "queue", "value": "А-024", "window": 3}
    assert body["transcript"] == "А тэг хорин дөрөв, гуравдугаар цонх"


def test_queue_other_ticket_does_not_match(fake_models):
    assert post("queue", {"ticket": "Б-024"}).json()["match"] is None


@pytest.mark.parametrize(
    ("mode", "data", "audio", "status", "code"),
    [
        ("queue", {}, None, 400, "BAD_TICKET"),
        ("name", {"name": " "}, None, 400, "BAD_NAME"),
        ("home", {}, b"not audio", 400, "BAD_AUDIO"),
        ("home", {}, wav_bytes(seconds=12), 400, "AUDIO_TOO_LONG"),
        ("home", {}, b"0" * 1_000_001, 413, "AUDIO_TOO_LARGE"),
        ("music", {}, None, 400, "BAD_REQUEST"),
    ],
    ids=["no-ticket", "empty-name", "bad-audio", "too-long", "too-large", "unknown-mode"],
)
def test_errors_use_contract_format(fake_models, mode, data, audio, status, code):
    response = post(mode, data, audio)
    assert response.status_code == status
    assert response.json()["error"]["code"] == code
