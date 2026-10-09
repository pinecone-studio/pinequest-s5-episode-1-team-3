from email import policy
from email.parser import BytesParser
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import uuid4

from pydantic import ValidationError

from app.config import Settings
from app.models.tts import SpeechError
from app.schemas import TalkAudioRequest, TalkTranscript

PROVIDER_TIMEOUT_SECONDS = 8
MAX_RESPONSE_BYTES = 100_000
MAX_UPLOAD_BYTES = 1_020_000
MAX_DEMO_TRANSCRIPTIONS = 30


def parse_audio(body: bytes, content_type: str) -> TalkAudioRequest:
    if not content_type.startswith("multipart/form-data"):
        raise SpeechError("BAD_AUDIO", 415)
    message = BytesParser(policy=policy.default).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode() + body
    )
    parts = list(message.iter_parts())
    if len(parts) != 1 or parts[0].get_param("name", header="content-disposition") != "audio":
        raise SpeechError("BAD_AUDIO", 400)
    try:
        return TalkAudioRequest(
            audio=parts[0].get_payload(decode=True), content_type=parts[0].get_content_type()
        )
    except ValidationError:
        raise SpeechError("BAD_AUDIO", 400) from None


def provider_body(audio: TalkAudioRequest, model: str, boundary: str) -> bytes:
    fields = {"model_id": model, "language_code": "mon", "tag_audio_events": "false", "diarize": "false"}
    chunks = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        for key, value in fields.items()
    ]
    extension = "webm" if audio.content_type == "audio/webm" else "m4a"
    chunks.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="speech.{extension}"\r\n'
        f"Content-Type: {audio.content_type}\r\n\r\n".encode()
        + audio.audio
        + b"\r\n"
    )
    return b"".join(chunks) + f"--{boundary}--\r\n".encode()


class TranscriptionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._request_count = 0
        self._lock = Lock()

    def _claim_request(self) -> None:
        # The public demo tunnel must not allow unlimited paid generation.
        with self._lock:
            if self._request_count >= MAX_DEMO_TRANSCRIPTIONS:
                raise SpeechError("STT_DEMO_LIMIT", 429)
            self._request_count += 1

    def transcribe(self, audio: TalkAudioRequest) -> TalkTranscript:
        settings = self.settings
        if not settings.elevenlabs_api_key or urlparse(settings.elevenlabs_url).scheme != "https":
            raise SpeechError("STT_NOT_CONFIGURED", 503)
        self._claim_request()
        boundary = uuid4().hex
        request = Request(
            f"{settings.elevenlabs_url.rstrip('/')}/v1/speech-to-text",
            data=provider_body(audio, settings.elevenlabs_stt_model, boundary),
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=PROVIDER_TIMEOUT_SECONDS) as response:
                payload = response.read(MAX_RESPONSE_BYTES + 1)
            if len(payload) > MAX_RESPONSE_BYTES:
                raise SpeechError("STT_BAD_RESPONSE", 502)
            return TalkTranscript.model_validate_json(payload)
        except HTTPError as exc:
            code = "STT_ACCESS_DENIED" if exc.code in (401, 403) else "STT_PROVIDER_ERROR"
            raise SpeechError(code, 403 if code == "STT_ACCESS_DENIED" else 502) from None
        except (URLError, TimeoutError, OSError):
            raise SpeechError("STT_UNAVAILABLE", 502) from None
        except ValidationError:
            raise SpeechError("STT_BAD_RESPONSE", 502) from None
