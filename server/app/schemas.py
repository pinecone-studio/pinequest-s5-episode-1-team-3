from typing import Literal

from pydantic import BaseModel, Field

PhraseId = Literal["greeting", "thanks"]


class TalkSpeechRequest(BaseModel):
    phrase: PhraseId


class TalkAudioRequest(BaseModel):
    audio: bytes = Field(min_length=1, max_length=1_000_000)
    content_type: Literal["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/webm", "audio/wav"]


class TalkTranscript(BaseModel):
    text: str = Field(max_length=2_000)


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
