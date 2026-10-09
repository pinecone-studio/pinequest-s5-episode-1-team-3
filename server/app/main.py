from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.config import load_settings
from app.models.tts import SpeechError, SpeechService
from app.schemas import ErrorBody, ErrorResponse, PhraseId, TalkSpeechRequest

app = FastAPI(title="SIGNO API")
settings = load_settings()
speech_service = SpeechService(settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET"],
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
