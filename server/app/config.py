import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
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
