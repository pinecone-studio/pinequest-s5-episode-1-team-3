import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.models.tts import PHRASES, SpeechError, SpeechService
from app.schemas import PhraseId

PROVIDER_URL = "https://provider.invalid"
SETTINGS = Settings("test-secret", "test-voice", PROVIDER_URL, "eleven_v4", ())


class AudioResponse(BytesIO):
    headers = {"Content-Type": "audio/mpeg"}


def test_greeting_generates_mongolian_speech_and_reuses_cache() -> None:
    service = SpeechService(SETTINGS)
    with patch("app.models.tts.urlopen", return_value=AudioResponse(b"demo-audio")) as provider:
        assert service.speak("greeting") == b"demo-audio"
        assert service.speak("greeting") == b"demo-audio"
        provider.assert_called_once()
        request = provider.call_args.args[0]
        payload = json.loads(request.data)
        assert payload == {
            "inputs": [{"text": PHRASES["greeting"], "voice_id": "test-voice"}],
            "model_id": "eleven_v4",
            "language_code": "mn",
        }
        assert provider.call_args.kwargs["timeout"] == 8


def test_missing_credentials_never_calls_provider() -> None:
    service = SpeechService(Settings("", "", "", "eleven_v4", ()))
    with patch("app.models.tts.urlopen") as provider, pytest.raises(SpeechError) as error:
        service.speak("greeting")
    assert error.value.code == "TTS_NOT_CONFIGURED"
    provider.assert_not_called()


@pytest.mark.parametrize(
    "failure", [URLError("offline"), TimeoutError(), HTTPError(PROVIDER_URL, 401, "", {}, None)]
)
def test_provider_failure_does_not_leak_credentials(failure: Exception) -> None:
    with patch("app.models.tts.urlopen", side_effect=failure), pytest.raises(SpeechError) as error:
        SpeechService(SETTINGS).speak("thanks")
    assert error.value.status == 502
    assert "test-secret" not in str(error.value)


def test_empty_audio_is_not_cached() -> None:
    service = SpeechService(SETTINGS)
    with patch("app.models.tts.urlopen", return_value=AudioResponse(b"")), pytest.raises(SpeechError):
        service.speak("greeting")
    assert service._cache == {}


def test_endpoint_returns_audio(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeSpeech:
        def speak(self, phrase: PhraseId) -> bytes:
            assert phrase == "greeting"
            return b"demo-audio"

    monkeypatch.setattr("app.main.speech_service", FakeSpeech())
    response = TestClient(app).get("/api/v1/talk/speech?phrase=greeting")
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"demo-audio"


def test_unknown_phrase_is_rejected() -> None:
    response = TestClient(app).get("/api/v1/talk/speech?phrase=arbitrary-text")
    assert response.status_code == 422


def test_endpoint_missing_configuration_has_error_envelope(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.main.speech_service", SpeechService(Settings("", "", "", "eleven_v4", ())))
    response = TestClient(app).get("/api/v1/talk/speech?phrase=thanks")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "TTS_NOT_CONFIGURED"
