"""API гэрээ (AGENTS.md → API гэрээ). mobile/src/lib/schemas.ts-тэй ЯГ таарна.

Өөрчлөх бол апп, сервер хоёуланг нэг PR-т засна.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

DetectMode = Literal["home", "queue", "name", "talk"]
SoundLabel = Literal["knock", "doorbell", "alarm", "speech", "other"]


class CamelModel(BaseModel):
    """JSON-д camelCase (latencyMs), Python дотор snake_case (latency_ms)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SoundResult(CamelModel):
    label: SoundLabel
    score: float = Field(ge=0, le=1)


class DetectionMatch(CamelModel):
    type: Literal["queue", "name"]
    value: str
    window: int | None = None


class DetectionResult(CamelModel):
    sound: SoundResult | None = None
    transcript: str | None = None
    match: DetectionMatch | None = None
    latency_ms: int = Field(default=0, ge=0)


class ModelVersions(CamelModel):
    sound: str | None = None
    whisper: str | None = None


class HealthResponse(CamelModel):
    status: Literal["ok"] = "ok"
    version: str
    models: ModelVersions


class ErrorBody(CamelModel):
    code: str
    message: str


class ErrorResponse(CamelModel):
    error: ErrorBody


# Харилцах хэсэг: зөвхөн эдгээр бэлэн өгүүлбэрийг хэлүүлнэ.
PhraseId = Literal["greeting", "thanks"]


class TalkSpeechRequest(BaseModel):
    phrase: PhraseId
