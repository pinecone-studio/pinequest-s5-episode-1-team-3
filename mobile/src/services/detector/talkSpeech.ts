import { config } from "@/config";
import { type PhraseId, SPEECH_TIMEOUT_MS } from "@/lib/talk";

export type SpeechErrorCode = "configuration" | "provider" | "network";
export class SpeechRequestError extends Error {
  constructor(public readonly code: SpeechErrorCode) { super(code); }
}

export async function prepareSpeech(phrase: PhraseId, signal: AbortSignal): Promise<string> {
  if (!config.apiUrl) throw new SpeechRequestError("configuration");
  const uri = `${config.apiUrl}/api/v1/talk/speech?phrase=${phrase}`;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, SPEECH_TIMEOUT_MS);
  try {
    // The server caches the fixed phrase in RAM; the player reuses the same URL.
    const response = await fetch(uri, { signal: controller.signal });
    if (!response.ok) throw new SpeechRequestError(response.status === 503 ? "configuration" : "provider");
    if (!response.headers.get("content-type")?.startsWith("audio/")) throw new SpeechRequestError("provider");
    const audio = await response.arrayBuffer();
    if (!audio.byteLength) throw new SpeechRequestError("provider");
    return uri;
  } catch (error) {
    if (error instanceof SpeechRequestError) throw error;
    throw new SpeechRequestError("network");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
