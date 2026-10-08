export const PHRASE_IDS = ["greeting", "thanks"] as const;
export type PhraseId = (typeof PHRASE_IDS)[number];
export const SPEECH_TIMEOUT_MS = 8_000;

export function isPhraseId(value: unknown): value is PhraseId {
  return PHRASE_IDS.some((phrase) => phrase === value);
}
