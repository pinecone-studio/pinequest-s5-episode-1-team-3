import { matchIncomingSign, type IncomingSignId } from "./incomingSigns";
import { findKeywordSigns } from "./keywordSigns";

// Бүтэн өгүүлбэрийн дохио = тухайн өгүүлбэрт зориулж хүн сонгосон үгсийн дараалал.
export const PHRASE_SIGNS: Record<IncomingSignId, readonly string[]> = {
  greeting: ["сайн байна уу"],
  thanks: ["баярлалаа"],
  sorry: ["уучлаарай"],
  goodbye: ["баяртай"],
  helpQuestion: ["туслах"],
};

export type SignPlan =
  | { kind: "phrase"; phrase: IncomingSignId; words: readonly string[] }
  | { kind: "keywords"; words: readonly string[] };

/** Эхлээд бүтэн өгүүлбэр (найдвартай), үгүй бол гол үгс. Аль нь ч үгүй бол зөвхөн бичвэр. */
export function planSigns(transcript: string, vocabulary: ReadonlySet<string>): SignPlan | null {
  const phrase = matchIncomingSign(transcript);
  if (phrase) return { kind: "phrase", phrase, words: PHRASE_SIGNS[phrase] };
  const words = findKeywordSigns(transcript, vocabulary);
  return words.length ? { kind: "keywords", words } : null;
}
