from typing import Annotated

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from app.config import load_settings
from app.models.stt import MAX_UPLOAD_BYTES, TranscriptionService, parse_audio
from app.models.tts import SpeechError, SpeechService
from app.schemas import ErrorBody, ErrorResponse, PhraseId, TalkSpeechRequest, TalkTranscript

app = FastAPI(title="SIGNO API")
settings = load_settings()
speech_service = SpeechService(settings)
transcription_service = TranscriptionService(settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/talk/speech", responses={200: {"content": {"audio/mpeg": {}}}})
def talk_speech(phrase: Annotated[PhraseId, Query()]) -> Response:
    request = TalkSpeechRequest(phrase=phrase)
    try:
        audio = speech_service.speak(request.phrase)
    except SpeechError as exc:
        body = ErrorResponse(error=ErrorBody(code=exc.code, message="Speech audio is unavailable."))
        return JSONResponse(body.model_dump(), status_code=exc.status)
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
        return await run_in_threadpool(transcription_service.transcribe, audio)
    except SpeechError as exc:
        error = ErrorResponse(error=ErrorBody(code=exc.code, message="Speech transcription is unavailable."))
        return JSONResponse(error.model_dump(), status_code=exc.status)
