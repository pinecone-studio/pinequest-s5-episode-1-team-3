import json
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from app.config import Settings
from app.schemas import PhraseId

REQUEST_TIMEOUT_SECONDS = 8
MAX_AUDIO_BYTES = 2_000_000
PHRASES: dict[PhraseId, str] = {"greeting": "Сайн байна уу?", "thanks": "Баярлалаа"}


class SpeechError(Exception):
    def __init__(self, code: str, status: int) -> None:
        self.code = code
        self.status = status
        super().__init__(code)


class SpeechService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._cache: dict[PhraseId, bytes] = {}
        self._lock = Lock()

    def speak(self, phrase: PhraseId) -> bytes:
        # Only two public demo phrases can trigger a paid generation, once per process.
        with self._lock:
            if phrase in self._cache:
                return self._cache[phrase]
            audio = self._generate(PHRASES[phrase])
            self._cache[phrase] = audio
            return audio

    def _generate(self, text: str) -> bytes:
        settings = self.settings
        if not all((settings.elevenlabs_api_key, settings.elevenlabs_voice_id, settings.elevenlabs_url)):
            raise SpeechError("TTS_NOT_CONFIGURED", 503)
        if urlparse(settings.elevenlabs_url).scheme != "https":
            raise SpeechError("TTS_NOT_CONFIGURED", 503)
        payload = {
            "inputs": [{"text": text, "voice_id": settings.elevenlabs_voice_id}],
            "model_id": settings.elevenlabs_model,
            "language_code": "mn",
        }
        request = Request(
            f"{settings.elevenlabs_url.rstrip('/')}/v1/text-to-dialogue?output_format=mp3_44100_128",
            data=json.dumps(payload).encode(),
            headers={"xi-api-key": settings.elevenlabs_api_key, "Content-Type": "application/json"},
            method="POST",
        )
        return self._download(request)

    def _download(self, request: Request) -> bytes:
        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                content_type = response.headers.get("Content-Type", "")
                audio = response.read(MAX_AUDIO_BYTES + 1)
        except HTTPError as exc:
            code = "TTS_QUOTA_EXCEEDED" if exc.code == 429 else "TTS_PROVIDER_ERROR"
            raise SpeechError(code, 502) from None
        except (URLError, TimeoutError, OSError):
            raise SpeechError("TTS_UNAVAILABLE", 502) from None
        if not content_type.startswith("audio/") or not audio or len(audio) > MAX_AUDIO_BYTES:
            raise SpeechError("TTS_BAD_AUDIO", 502)
        return audio
