export const INCOMING_SIGN_IDS = ["greeting", "thanks", "sorry", "goodbye", "helpQuestion"] as const;
export type IncomingSignId = (typeof INCOMING_SIGN_IDS)[number];

const PHRASES: Record<IncomingSignId, readonly string[]> = {
  greeting: ["сайн байна уу", "сайн уу", "та сайн байна уу", "сайн байн уу", "сайн байну", "сайн уу та"],
  thanks: ["баярлалаа", "маш их баярлалаа", "их баярлалаа", "танд баярлалаа", "таньд баярлалаа", "талархаж байна"],
  sorry: ["уучлаарай", "өршөөгөөрэй", "намайг уучлаарай", "уучлаарай та", "хүлцэл өчье"],
  goodbye: ["баяртай", "түр баяртай", "за баяртай"],
  helpQuestion: [
    "танд юугаар туслах вэ", "танд юугаар туслах бэ", "юугаар туслах вэ",
    "танд юугаар туслах уу", "юугаар туслах уу", "танд юугаар туслаху", "юугаар туслаху",
    "таньд юугаар туслах вэ", "таньд юугаар туслах уу", "таньд юугаар туслаху",
    "танд яаж туслах вэ", "таньд яаж туслах вэ", "яаж туслах вэ",
    "би танд юугаар туслах вэ", "би таньд юугаар туслах вэ", "танд ямар тусламж хэрэгтэй вэ",
  ],
};

export function matchIncomingSign(transcript: string): IncomingSignId | null {
  const normalized = transcript.normalize("NFC").toLocaleLowerCase("mn")
    .replace(/[.,!?…:;。？！]/gu, " ").replace(/\s+/gu, " ").trim();
  // Match the whole utterance: a keyword alone cannot distinguish an offer from a refusal.
  return INCOMING_SIGN_IDS.find((id) => PHRASES[id].includes(normalized)) ?? null;
}
