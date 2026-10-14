import io
import time
import wave
from collections import deque
from email import policy
from email.parser import BytesParser
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import uuid4

import numpy as np
from pydantic import ValidationError

from app.config import Settings
from app.models.tts import REQUEST_TIMEOUT_SECONDS, SpeechError
from app.schemas import TalkAudioRequest, TalkTranscript

MAX_RESPONSE_BYTES = 100_000
MAX_UPLOAD_BYTES = 1_020_000
BUDGET_WINDOW_SECONDS = 3600


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
        self._calls: deque[float] = deque()
        self._lock = Lock()

    def _claim_request(self) -> None:
        # Нийтийн demo хаягаар төлбөртэй дуудлага хязгааргүй явахгүй: сүүлийн нэг цагт N-ээс ихгүй.
        with self._lock:
            now = time.monotonic()
            while self._calls and now - self._calls[0] >= BUDGET_WINDOW_SECONDS:
                self._calls.popleft()
            if len(self._calls) >= self.settings.elevenlabs_stt_per_hour:
                raise SpeechError("STT_DEMO_LIMIT", 429)
            self._calls.append(now)

    def configured(self) -> bool:
        settings = self.settings
        return bool(settings.elevenlabs_api_key) and urlparse(settings.elevenlabs_url).scheme == "https"

    def transcribe(self, audio: TalkAudioRequest) -> TalkTranscript:
        settings = self.settings
        if not self.configured():
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
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
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


def wav_bytes(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * np.iinfo(np.int16).max).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(pcm.tobytes())
    return buffer.getvalue()


class ElevenLabsTranscriber:
    """«Нэр», «ярих» горим: ерийн Whisper монгол яриаг бараг сонсдоггүй тул ElevenLabs Scribe (монгол)."""

    def __init__(self, service: TranscriptionService, rate: int) -> None:
        self._service = service
        self._rate = rate

    def transcribe(self, samples: np.ndarray) -> str:
        audio = TalkAudioRequest(audio=wav_bytes(samples, self._rate), content_type="audio/wav")
        return self._service.transcribe(audio).text
