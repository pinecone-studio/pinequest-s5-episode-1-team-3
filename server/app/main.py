"""Endpoint-ууд. Нимгэн байна: ажлыг pipeline.py, models/, text/ руу шилжүүлнэ."""

from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response

from app.audio import AudioError, decode, duration_seconds
from app.config import load_settings, settings
from app.models.sound import SoundClassifier, YamnetClassifier
from app.models.speech import Transcriber, WhisperTranscriber
from app.models.tts import SpeechError, SpeechService
from app.pipeline import run_detection
from app.schemas import (
    DetectMode,
    ErrorBody,
    ErrorResponse,
    HealthResponse,
    ModelVersions,
    PhraseId,
    TalkSpeechRequest,
)
from app.text.matching import parse_ticket

logger = logging.getLogger("signo")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
TEST_PAGE = Path(__file__).parent / "static" / "test.html"


class Models:
    classifier: SoundClassifier | None = None
    transcriber: Transcriber | None = None


models = Models()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.load_models:
        logger.info("Загвар ачаалж байна: YAMNet, Whisper %s", settings.whisper_model)
        models.classifier = YamnetClassifier(settings.sound_model_path, settings.sound_min_score)
        models.transcriber = WhisperTranscriber(
            settings.whisper_model, settings.whisper_compute_type, settings.whisper_language
        )
    yield


app = FastAPI(title="SIGNO API", version=settings.version, lifespan=lifespan)
talk_settings = load_settings()
speech_service = SpeechService(talk_settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(talk_settings.cors_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=body.model_dump(by_alias=True))


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return error_response(400, "BAD_REQUEST", str(exc.errors()))


@app.get("/api/v1/health", response_model=HealthResponse, response_model_by_alias=True)
def health() -> HealthResponse:
    loaded = models.classifier is not None and models.transcriber is not None
    versions = ModelVersions(sound="yamnet", whisper=settings.whisper_model) if loaded else ModelVersions()
    return HealthResponse(version=settings.version, models=versions)


@app.post("/api/v1/detect")
async def detect(
    audio: Annotated[UploadFile, File()],
    mode: Annotated[DetectMode, Form()],
    ticket: Annotated[str | None, Form()] = None,
    name: Annotated[str | None, Form()] = None,
) -> JSONResponse:
    started = time.perf_counter()
    if models.classifier is None or models.transcriber is None:
        return error_response(503, "MODELS_NOT_LOADED", "Загвар ачаалагдаагүй байна")
    if mode == "queue" and (not ticket or parse_ticket(ticket) is None):
        return error_response(400, "BAD_TICKET", "Тасалбарын дугаар буруу байна")
    if mode == "name" and not (name and name.strip()):
        return error_response(400, "BAD_NAME", "Нэр хоосон байна")

    data = await audio.read()
    if len(data) > settings.max_audio_bytes:
        return error_response(413, "AUDIO_TOO_LARGE", "Аудио хэт том байна")
    try:
        samples = decode(data)
    except AudioError as exc:
        return error_response(400, "BAD_AUDIO", str(exc))
    if duration_seconds(samples) > settings.max_audio_seconds:
        return error_response(400, "AUDIO_TOO_LONG", "Аудио хэт урт байна")

    result = run_detection(samples, mode, models.classifier, models.transcriber, ticket=ticket, name=name)
    result.latency_ms = round((time.perf_counter() - started) * 1000)
    return JSONResponse(content=result.model_dump(by_alias=True))


@app.get("/", include_in_schema=False)
def test_page() -> FileResponse:
    """POC-д зориулсан туршилтын хуудас: микрофоноор бичээд /detect руу илгээнэ."""
    return FileResponse(TEST_PAGE)


@app.get("/api/v1/talk/speech", responses={200: {"content": {"audio/mpeg": {}}}})
def talk_speech(phrase: Annotated[PhraseId, Query()]) -> Response:
    request = TalkSpeechRequest(phrase=phrase)
    try:
        audio = speech_service.speak(request.phrase)
    except SpeechError as exc:
        return error_response(exc.status, exc.code, "Speech audio is unavailable.")
    return Response(audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=3600"})
