from typing import Literal

from pydantic import BaseModel

PhraseId = Literal["greeting", "thanks"]


class TalkSpeechRequest(BaseModel):
    phrase: PhraseId


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
