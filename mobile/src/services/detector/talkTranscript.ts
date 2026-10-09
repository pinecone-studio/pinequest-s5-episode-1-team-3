import { Platform } from "react-native";

import { config } from "@/config";
import { SPEECH_TIMEOUT_MS } from "@/lib/talk";
import { MAX_RECORDING_BYTES, talkTranscriptSchema } from "@/lib/talkTranscript";
import { SpeechRequestError } from "./talkSpeech";

export class TranscriptionAccessError extends Error {}

async function audioForm(uri: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    if (blob.size > MAX_RECORDING_BYTES) throw new SpeechRequestError("provider");
    form.append("audio", blob, "speech.webm");
  } else {
    form.append("audio", { uri, name: "speech.m4a", type: "audio/mp4" } as unknown as Blob);
  }
  return form;
}

export async function transcribeTalk(uri: string, signal: AbortSignal): Promise<string> {
  if (!config.apiUrl) throw new SpeechRequestError("configuration");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, SPEECH_TIMEOUT_MS);
  try {
    const body = await audioForm(uri);
    const response = await fetch(`${config.apiUrl}/api/v1/talk/transcribe`, {
      method: "POST", body, signal: controller.signal,
    });
    if (response.status === 403) throw new TranscriptionAccessError();
    if (!response.ok) throw new SpeechRequestError(response.status === 503 ? "configuration" : "provider");
    const data: unknown = await response.json();
    const parsed = talkTranscriptSchema.safeParse(data);
    if (!parsed.success) throw new SpeechRequestError("provider");
    return parsed.data.text;
  } catch (cause) {
    throw cause instanceof SpeechRequestError || cause instanceof TranscriptionAccessError ? cause : new SpeechRequestError("network");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
