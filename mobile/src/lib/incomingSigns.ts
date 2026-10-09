export const INCOMING_SIGN_IDS = ["greeting", "thanks", "sorry", "goodbye", "helpQuestion"] as const;
export type IncomingSignId = (typeof INCOMING_SIGN_IDS)[number];

const PHRASES: Record<IncomingSignId, readonly string[]> = {
  greeting: ["сайн байна уу", "сайн уу"],
  thanks: ["баярлалаа", "маш их баярлалаа"],
  sorry: ["уучлаарай", "өршөөгөөрэй"],
  goodbye: ["баяртай"],
  helpQuestion: ["танд юугаар туслах вэ", "танд юугаар туслах бэ", "юугаар туслах вэ"],
};

export function matchIncomingSign(transcript: string): IncomingSignId | null {
  const normalized = transcript.normalize("NFC").toLocaleLowerCase("mn")
    .replace(/[.,!?…:;。？！]/gu, " ").replace(/\s+/gu, " ").trim();
  // Match the whole utterance: a keyword alone cannot distinguish an offer from a refusal.
  return INCOMING_SIGN_IDS.find((id) => PHRASES[id].includes(normalized)) ?? null;
}
