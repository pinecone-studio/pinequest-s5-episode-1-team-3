import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.models.stt import (
    BUDGET_WINDOW_SECONDS,
    MAX_UPLOAD_BYTES,
    TALK_KEYTERMS,
    TranscriptionService,
    keyterm,
    parse_audio,
    provider_body,
)
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
    # Must finish before the app's 8 s contract timeout, or the app shows "offline" instead of our error.
    assert provider.call_args.kwargs["timeout"] < 8
    assert b"keyterms" not in request.data


def test_name_is_sent_as_keyterm() -> None:
    # «Болд»-ыг «Bold» гэж бичээд нэр таарахгүй байсныг дахин гаргахгүй.
    body = provider_body(AUDIO, "scribe_v2", "b", ("Болд", "Бат-Эрдэнэ"))
    assert body.count(b'name="keyterms"') == 2
    assert "Бат-Эрдэнэ".encode() in body


@pytest.mark.parametrize(
    "raw, expected",
    [(" Болд ", "Болд"), ("Бол[д]", "Бол д"), ("", None), ("а" * 50, None), ("а б в г д е", None)],
)
def test_keyterm_respects_provider_limits(raw: str, expected: str | None) -> None:
    assert keyterm(raw) == expected


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


def test_hourly_budget_prevents_unbounded_paid_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    now = [1000.0]
    monkeypatch.setattr("app.models.stt.time.monotonic", lambda: now[0])
    service = TranscriptionService(
        Settings("test-secret", "", "https://provider.invalid", "eleven_v4", (), elevenlabs_stt_per_hour=2)
    )

    def reply(*_args: object, **_kwargs: object) -> BytesIO:
        return BytesIO(b'{"text": "ok"}')

    with patch("app.models.stt.urlopen", side_effect=reply) as provider:
        service.transcribe(AUDIO)
        service.transcribe(AUDIO)
        with pytest.raises(SpeechError) as error:
            service.transcribe(AUDIO)
        assert error.value.status == 429
        assert provider.call_count == 2
        now[0] += BUDGET_WINDOW_SECONDS  # цаг өнгөрөхөд дахин нээгдэнэ
        assert service.transcribe(AUDIO).text == "ok"


def test_endpoint_receives_one_audio_file(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeTranscription:
        def transcribe(self, audio: TalkAudioRequest, keyterms: tuple[str, ...] = ()) -> TalkTranscript:
            # «Сайн байна уу»-г «300» гэж бичдэг байсныг дахин гаргахгүй.
            assert "Сайн байна уу" in keyterms
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


def test_talk_keyterms_fit_provider_limits() -> None:
    assert len(TALK_KEYTERMS) <= 100  # дээш бол хүсэлт бүр 20 сек-ийн төлбөртэй
    assert all(keyterm(term) == term for term in TALK_KEYTERMS)
