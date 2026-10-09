import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.models.stt import MAX_DEMO_TRANSCRIPTIONS, MAX_UPLOAD_BYTES, TranscriptionService, parse_audio
from app.models.tts import SpeechError
from app.schemas import TalkAudioRequest, TalkTranscript

SETTINGS = Settings("test-secret", "", "https://provider.invalid", "eleven_v4", ())
AUDIO = TalkAudioRequest(audio=b"test-audio", content_type="audio/mp4")


def test_service_sends_mongolian_audio_and_validates_transcript() -> None:
    response = BytesIO(json.dumps({"text": "Сайн байна уу?"}).encode())
    with patch("app.models.stt.urlopen", return_value=response) as provider:
        assert TranscriptionService(SETTINGS).transcribe(AUDIO).text == "Сайн байна уу?"
    request = provider.call_args.args[0]
    assert b"scribe_v2" in request.data
    assert b"mon" in request.data
    assert AUDIO.audio in request.data
    assert provider.call_args.kwargs["timeout"] == 8


@pytest.mark.parametrize("payload", [b"{}", b"not-json", b'{"text": 123}'])
def test_invalid_provider_response_is_rejected(payload: bytes) -> None:
    with patch("app.models.stt.urlopen", return_value=BytesIO(payload)), pytest.raises(SpeechError):
        TranscriptionService(SETTINGS).transcribe(AUDIO)


@pytest.mark.parametrize(
    "failure", [URLError("offline"), TimeoutError(), HTTPError("https://provider.invalid", 403, "", {}, None)]
)
def test_provider_errors_do_not_leak_key(failure: Exception) -> None:
    with patch("app.models.stt.urlopen", side_effect=failure), pytest.raises(SpeechError) as error:
        TranscriptionService(SETTINGS).transcribe(AUDIO)
    assert "test-secret" not in str(error.value)


def test_missing_key_never_calls_provider() -> None:
    with patch("app.models.stt.urlopen") as provider, pytest.raises(SpeechError):
        TranscriptionService(Settings("", "", "", "eleven_v4", ())).transcribe(AUDIO)
    provider.assert_not_called()


def test_demo_budget_prevents_unbounded_paid_requests() -> None:
    service = TranscriptionService(SETTINGS)
    service._request_count = MAX_DEMO_TRANSCRIPTIONS
    with patch("app.models.stt.urlopen") as provider, pytest.raises(SpeechError) as error:
        service.transcribe(AUDIO)
    assert error.value.status == 429
    provider.assert_not_called()


def test_endpoint_receives_one_audio_file(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeTranscription:
        def transcribe(self, audio: TalkAudioRequest) -> TalkTranscript:
            assert audio.audio == b"demo"
            assert audio.content_type == "audio/webm"
            return TalkTranscript(text="Баярлалаа")

    monkeypatch.setattr("app.main.transcription_service", FakeTranscription())
    response = TestClient(app).post(
        "/api/v1/talk/transcribe", files={"audio": ("speech.webm", b"demo", "audio/webm")}
    )
    assert response.status_code == 200
    assert response.json() == {"text": "Баярлалаа"}


@pytest.mark.parametrize("mime,data", [("text/plain", b"text"), ("audio/mp4", b"")])
def test_bad_upload_is_rejected_before_provider(mime: str, data: bytes) -> None:
    with patch("app.main.transcription_service.transcribe") as provider:
        response = TestClient(app).post("/api/v1/talk/transcribe", files={"audio": ("speech", data, mime)})
    assert response.status_code == 400
    provider.assert_not_called()


def test_oversized_upload_is_rejected() -> None:
    with patch("app.main.transcription_service.transcribe") as provider:
        response = TestClient(app).post("/api/v1/talk/transcribe", content=b"x" * (MAX_UPLOAD_BYTES + 1))
    assert response.status_code == 413
    provider.assert_not_called()


def test_non_multipart_input_is_rejected() -> None:
    with pytest.raises(SpeechError) as error:
        parse_audio(b"test", "audio/mp4")
    assert error.value.status == 415
