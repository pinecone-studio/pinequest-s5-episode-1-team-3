"""Endpoint-ууд. Нимгэн байна: ажлыг pipeline.py, models/, text/ руу шилжүүлнэ."""

from __future__ import annotations

import logging
import threading
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Any

import numpy as np
from fastapi import FastAPI, File, Form, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from app.audio import SAMPLE_RATE, AudioError, decode, duration_seconds
from app.config import load_settings, settings
from app.models.sound import SoundClassifier, YamnetClassifier
from app.models.speech import Transcriber, WhisperTranscriber
from app.models.stt import (
    MAX_UPLOAD_BYTES,
    ElevenLabsTranscriber,
    TranscriptionService,
    parse_audio,
)
from app.models.tts import SpeechError, SpeechService
from app.pipeline import TALK_KEYTERMS, run_detection
from app.schemas import (
    DetectionResult,
    DetectMode,
    ErrorBody,
    ErrorResponse,
    HealthResponse,
    ModelVersions,
    PhraseId,
    TalkSpeechRequest,
    TalkTranscript,
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
    remote_transcriber: Transcriber | None = None  # ElevenLabs. None бол «нэр», «ярих» Whisper-ээр


# Монгол нэр, чөлөөт ярианд ерийн Whisper бараг ажилладаггүй. Дугаарыг парсер шалгадаг тул Whisper хэвээр.
REMOTE_MODES = ("name", "talk")


models = Models()
# MediaPipe/Whisper are not guaranteed thread-safe, and phones send a clip every 3 s.
_models_lock = threading.Lock()


def _detect_locked(*args: Any, **kwargs: Any) -> DetectionResult:
    with _models_lock:
        return run_detection(*args, **kwargs)


def _detect_remote(samples: np.ndarray, mode: DetectMode, name: str | None) -> DetectionResult:
    assert models.classifier is not None and models.transcriber is not None and models.remote_transcriber
    with _models_lock:
        sound = models.classifier.classify(samples)
    # Төлбөртэй, цагийн хязгаартай: яриагүй, чимээгүй хэсгийг илгээхгүй (Whisper ч чимээгүйд зохиодог).
    if sound is None or sound.label == "other":
        return DetectionResult()
    try:
        # Сүлжээний дуудлага (6 сек хүртэл): загварын lock-ийг барьвал бусад утас бүгд зогсоно.
        return run_detection(samples, mode, models.classifier, models.remote_transcriber, name=name)
    except SpeechError as exc:
        # Хязгаар, сүлжээ, ElevenLabs-ийн алдаа апп-ыг зогсоохгүй: орон нутгийн Whisper-ээр үргэлжилнэ.
        logger.warning("ElevenLabs %s (%s) → Whisper", exc.code, mode)
        with _models_lock:
            return run_detection(samples, mode, models.classifier, models.transcriber, name=name)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.load_models:
        logger.info("Загвар ачаалж байна: YAMNet, Whisper %s", settings.whisper_model)
        models.classifier = YamnetClassifier(
            settings.sound_model_path, settings.sound_min_score, settings.sound_head_model
        )
        models.transcriber = WhisperTranscriber(
            settings.whisper_model, settings.whisper_compute_type, settings.whisper_language
        )
        if transcription_service.configured():
            models.remote_transcriber = ElevenLabsTranscriber(transcription_service, SAMPLE_RATE)
        backend = "ElevenLabs → Whisper" if models.remote_transcriber else "Whisper"
        logger.info("«нэр», «ярих»: %s, цагт %d дуудлага", backend, talk_settings.elevenlabs_stt_per_hour)
    yield


app = FastAPI(title="SIGNO API", version=settings.version, lifespan=lifespan)
talk_settings = load_settings()
speech_service = SpeechService(talk_settings)
transcription_service = TranscriptionService(talk_settings)
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
    sound = "yamnet+head" if settings.sound_head_model else "yamnet"
    versions = ModelVersions(sound=sound, whisper=settings.whisper_model) if loaded else ModelVersions()
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

    # Read one byte past the limit so an oversized upload is never loaded whole.
    data = await audio.read(settings.max_audio_bytes + 1)
    if len(data) > settings.max_audio_bytes:
        return error_response(413, "AUDIO_TOO_LARGE", "Аудио хэт том байна")
    try:
        # Decode and models are CPU-bound; off the event loop so other requests keep flowing.
        samples = await run_in_threadpool(decode, data)
    except AudioError as exc:
        return error_response(400, "BAD_AUDIO", str(exc))
    if duration_seconds(samples) > settings.max_audio_seconds:
        return error_response(400, "AUDIO_TOO_LONG", "Аудио хэт урт байна")

    if mode in REMOTE_MODES and models.remote_transcriber is not None:
        result = await run_in_threadpool(_detect_remote, samples, mode, name)
    else:
        result = await run_in_threadpool(
            _detect_locked, samples, mode, models.classifier, models.transcriber, ticket=ticket, name=name
        )
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


@app.post("/api/v1/talk/transcribe", response_model=TalkTranscript)
async def talk_transcribe(request: Request) -> TalkTranscript | JSONResponse:
    try:
        body = bytearray()
        async for chunk in request.stream():
            if len(body) + len(chunk) > MAX_UPLOAD_BYTES:
                raise SpeechError("AUDIO_TOO_LARGE", 413)
            body.extend(chunk)
        audio = parse_audio(bytes(body), request.headers.get("content-type", ""))
        return await run_in_threadpool(transcription_service.transcribe, audio, TALK_KEYTERMS)
    except SpeechError as exc:
        return error_response(exc.status, exc.code, "Speech transcription is unavailable.")
