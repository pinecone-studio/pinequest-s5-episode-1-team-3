"""Орчны хувьсагч унших ЦОРЫН ГАНЦ газар (AGENTS.md → Deploy ба APK)."""

import os
from dataclasses import dataclass, field

from pydantic_settings import BaseSettings, SettingsConfigDict


@dataclass(frozen=True)
class Settings:
    """Харилцах хэсгийн дуу (ElevenLabs). Түлхүүр зөвхөн серверт."""

    elevenlabs_api_key: str = field(repr=False)
    elevenlabs_voice_id: str
    elevenlabs_url: str
    elevenlabs_model: str
    cors_origins: tuple[str, ...]


def load_settings() -> Settings:
    return Settings(
        elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
        elevenlabs_voice_id=os.getenv("ELEVENLABS_VOICE_ID", ""),
        elevenlabs_url=os.getenv("ELEVENLABS_API_URL", ""),
        elevenlabs_model=os.getenv("ELEVENLABS_MODEL", "eleven_v4"),
        cors_origins=tuple(
            origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()
        ),
    )


class DetectSettings(BaseSettings):
    """Дуу, яриа таних (YAMNet + Whisper)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    version: str = "0.1.0"
    # Тестэд загвар ачаалахгүй (tests/conftest.py)
    load_models: bool = True

    # Загвар солих = эдгээрийг солих. Код өөрчлөхгүй.
    whisper_model: str = "small"
    whisper_compute_type: str = "int8"
    whisper_language: str = "mn"
    sound_model_path: str = "models/yamnet.tflite"
    sound_min_score: float = 0.3

    max_audio_bytes: int = 1_000_000
    max_audio_seconds: float = 10.0


settings = DetectSettings()
