import { normalizeSpeech } from "./incomingSigns";

// Цөөн гол үг л: олон дохиог дараалуулбал бүтэн өгүүлбэр мэт харагдаж, буруу ойлгуулна.
export const MAX_KEYWORD_SIGNS = 4;
// «сайн байна уу» шиг хэд хэдэн үгтэй толь бичгийн үг.
const MAX_ENTRY_WORDS = 3;
// Нөхцөл тасласны дараах богино үндэс өөр үгтэй андуурагдана («ба» → «баяртай» биш).
const MIN_STEM_LENGTH = 3;
// «очно» → «оч»: хоёр үсэгтэй үйл үгийн үндсийг зөвхөн толь бичгийн хэлбэрээр нь («очих») хайна.
const MIN_VERB_STEM_LENGTH = 2;
const VOWEL_END = /[аэиоуөүяеёюы]$/u;
const VERB_ENDINGS = ["ах", "эх", "ох", "өх", "их"];
// ElevenLabs тоог цифрээр бичдэг: «10», «10-р».
const NUMBER = /^\d+/u;
// Үгүйсгэлтэй өгүүлбэрт гол үгийн дохио эсрэг утга өгнө: «туслах боломжгүй» ≠ [ТУСЛАХ].
const NEGATION_WORDS = ["үгүй", "биш", "битгий", "бүү"];
const NEGATION_SUFFIX = "гүй";
// Төлөөний, асуух үг нөхцөлөөр үндсээ өөрчилдөг тул тасалж олохгүй.
const PRONOUNS: Record<string, string> = {
  танд: "та", таньд: "та", таныг: "та", таны: "та", тантай: "та", танаас: "та",
  надад: "би", намайг: "би", миний: "би", надтай: "би", надаас: "би",
  юугаар: "юу", юуг: "юу", юуны: "юу", юунд: "юу", юунаас: "юу", хэдэн: "хэд", хаанаас: "хаана", хаашаа: "хаана",
};
// Дохио нь утга нэмдэггүй, 4 байрны нэгийг эзэлдэг үгс.
const FILLER_WORDS = new Set(["энэ", "тэр", "байна"]);
// «нэг» (нэг юм), «тав» (тавих) ихэвчлэн тоо биш: тэдгээрийг зөвхөн дэс тоо («нэгдүгээр») болгож уншина.
const NUMBER_WORDS: Record<string, number> = {
  тэг: 0, хоёр: 2, гурав: 3, гурван: 3, дөрөв: 4, дөрвөн: 4, таван: 5, зургаа: 6, зургаан: 6, долоо: 7, долоон: 7,
  найм: 8, найман: 8, ес: 9, есөн: 9, арав: 10, арван: 10, хорь: 20, хорин: 20, гуч: 30, гучин: 30, дөч: 40,
  дөчин: 40, тавь: 50, тавин: 50, жаран: 60, далан: 70, наян: 80, ерэн: 90, зуу: 100, зуун: 100, мянга: 1000, мянган: 1000,
};
const ORDINAL_ROOTS: Record<string, number> = {
  нэг: 1, хоёр: 2, гурав: 3, дөрөв: 4, тав: 5, зургаа: 6, долоо: 7, найм: 8, ес: 9, арав: 10,
};
const ORDINAL = /^(.+?)(?:дугаар|дүгээр)$/u;
const TENS_LIMIT = 100;
const NOUN_SUFFIXES = [
  "уудыг", "үүдийг", "ууд", "үүд", "аас", "ээс", "оос", "өөс", "аар", "ээр", "оор", "өөр",
  "тай", "тэй", "той", "руу", "рүү", "луу", "лүү", "ийн", "ийг", "ыг", "ын", "ий", "ны", "ний",
  "онд", "энд", "өнд", "анд", "даа", "дээ", "доо", "дөө", "аа", "ээ", "оо", "өө", "д", "т", "г", "н",
];
// Үйл үгийн нөхцөл: тасалсан үндсийг эхлээд үйл үг гэж хайна («гарна» → «гарах», «гар» биш).
const VERB_SUFFIXES = [
  "на", "нэ", "но", "нө", "сан", "сэн", "сон", "сөн", "аад", "ээд", "оод", "өөд", "гаад", "гээд", "гоод", "гөөд",
  "аарай", "ээрэй", "оорой", "өөрэй", "гаарай", "гээрэй", "гоорой", "гөөрэй", "ж", "ч",
];

function isNegation(word: string): boolean {
  return NEGATION_WORDS.includes(word) || word.endsWith(NEGATION_SUFFIX);
}

/** Үйл үгийн толь бичгийн хэлбэр: «тусла» → «туслах», «оч» → «очих». */
function infinitives(stem: string): string[] {
  return VOWEL_END.test(stem) ? [`${stem}х`] : VERB_ENDINGS.map((ending) => `${stem}${ending}`);
}

function stems(word: string, suffixes: string[], minLength: number): string[] {
  return suffixes.filter((suffix) => word.endsWith(suffix) && word.length - suffix.length >= minLength)
    .map((suffix) => word.slice(0, -suffix.length));
}

/** Толь бичигт байж болох хэлбэрүүд: үг өөрөө, нөхцөлгүй үндэс, үйл үгийн толь бичгийн хэлбэр. */
export function dictionaryForms(word: string): string[] {
  const number = NUMBER.exec(word)?.[0];
  if (number) return [String(Number(number))];
  const base = PRONOUNS[word] ?? word;
  // «уу» (асуух сул үг) → «уух», «бол» → «болох» биш: нөхцөлгүй үгэнд зөвхөн «хүлээ» → «хүлээх».
  const own = base.length >= MIN_STEM_LENGTH && VOWEL_END.test(base) ? [base, `${base}х`] : [base];
  // «уут» (уут) → «уу» → «уух» биш: хоёр үсэгтэй үндсийг зөвхөн үйл үгийн нөхцөлөөс.
  const verbs = stems(base, VERB_SUFFIXES, MIN_VERB_STEM_LENGTH)
    .flatMap((stem) => (stem.length >= MIN_STEM_LENGTH ? [...infinitives(stem), stem] : infinitives(stem)));
  const nouns = stems(base, NOUN_SUFFIXES, MIN_STEM_LENGTH).flatMap((stem) => [stem, ...infinitives(stem)]);
  return [...new Set([...own, ...verbs, ...nouns])];
}

/** Үгээр хэлсэн тоо: «гуравдугаар» → 3, «гурван» → 3. Тоо биш бол null. */
export function spokenNumber(word: string): number | null {
  const ordinal = ORDINAL.exec(word);
  if (ordinal) return ORDINAL_ROOTS[ordinal[1]] ?? null;
  return NUMBER_WORDS[word] ?? null;
}

/** «арван тав» → «15», «хорин гурав» → «23»: аравтын ба нэгжийн тоог нэг дохио болгоно. */
function withNumbers(words: string[]): string[] {
  const result: string[] = [];
  for (const word of words.map((w) => String(spokenNumber(w) ?? w))) {
    const previous = Number(result.at(-1));
    // «арван тав»: аравтын дараа «нэг», «тав» нь тоо л байна.
    const current = Number(ORDINAL_ROOTS[word] ?? word);
    const tensThenUnit = previous % 10 === 0 && previous > 0 && previous < TENS_LIMIT && current > 0 && current < 10;
    if (tensThenUnit) result[result.length - 1] = String(previous + current);
    else result.push(word);
  }
  return result;
}

function longestEntry(words: string[], start: number, vocabulary: ReadonlySet<string>) {
  for (let size = Math.min(MAX_ENTRY_WORDS, words.length - start); size >= 1; size -= 1) {
    const head = words.slice(start, start + size - 1).join(" ");
    const entry = dictionaryForms(words[start + size - 1]).map((form) => (head ? `${head} ${form}` : form))
      .find((candidate) => vocabulary.has(candidate));
    if (entry) return { entry, size };
  }
  return null;
}

/** Ярианаас дохионы видеотой гол үгсийг дарааллаар нь. Үгүйсгэлтэй бол хоосон (буруу ойлгуулахгүй). */
export function findKeywordSigns(transcript: string, vocabulary: ReadonlySet<string>): string[] {
  const spoken = normalizeSpeech(transcript).split(" ").filter(Boolean);
  if (spoken.some(isNegation)) return [];
  const words = withNumbers(spoken);
  const found: string[] = [];
  for (let i = 0; i < words.length && found.length < MAX_KEYWORD_SIGNS;) {
    const hit = longestEntry(words, i, vocabulary);
    if (hit && !found.includes(hit.entry) && !FILLER_WORDS.has(hit.entry)) found.push(hit.entry);
    i += hit?.size ?? 1;
  }
  return found;
}
