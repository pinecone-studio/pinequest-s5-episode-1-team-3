"""Орчны хувьсагч унших ЦОРЫН ГАНЦ газар (AGENTS.md → Deploy ба APK)."""

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
    elevenlabs_stt_model: str = "scribe_v2"
    # Төлбөртэй: «нэр»/«ярих» 3 сек тутам илгээдэг. Хэтэрвэл /detect Whisper руу шилжинэ.
    elevenlabs_stt_per_hour: int = 300


class _TalkEnv(BaseSettings):
    # DetectSettings шиг server/.env-ийг уншина: өмнө нь локалд ElevenLabs-ийн түлхүүр уншигддаггүй байсан.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    elevenlabs_api_url: str = ""
    elevenlabs_model: str = "eleven_v4"
    elevenlabs_stt_model: str = "scribe_v2"
    elevenlabs_stt_per_hour: int = 300
    cors_origins: str = ""


def load_settings() -> Settings:
    env = _TalkEnv()
    return Settings(
        elevenlabs_api_key=env.elevenlabs_api_key,
        elevenlabs_voice_id=env.elevenlabs_voice_id,
        elevenlabs_url=env.elevenlabs_api_url,
        elevenlabs_model=env.elevenlabs_model,
        elevenlabs_stt_model=env.elevenlabs_stt_model,
        elevenlabs_stt_per_hour=env.elevenlabs_stt_per_hour,
        cors_origins=tuple(origin.strip() for origin in env.cors_origins.split(",") if origin.strip()),
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
    # training/sound/train.py-ийн sound_head.json. Хоосон бол LABEL_MAP (baseline).
    sound_head_model: str = ""

    max_audio_bytes: int = 1_000_000
    max_audio_seconds: float = 10.0


settings = DetectSettings()
