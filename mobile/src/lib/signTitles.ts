// mnsl.mn-ийн видеоны гарчиг: «0951_ДАХИН», «1333_ШУНАХ, ШУНАЛ», «1260_ЗА_ЗӨВ».
// «0386 – Өгүүлбэр – ХОЖИХ_Ө» (жишээ өгүүлбэр), «20. С» (хурууны үсэг), «700» (тоо) нь үгийн дохио биш.
const WORD_TITLE = /^(\d{4})_(.+)$/u;
// Тоо: «3», «10_1» (хувилбар), «11.000_1» (11 000). «10.1», «100,000» нь тодорхойгүй тул алгасна.
const NUMBER_TITLE = /^(\d+)(\.000)?(?:_(\d+))?$/u;
// Урт нь тайлбар («ТАРХИНД ҮГИЙГ ОЙЛГОХ»), үг биш. keywordSigns-ийн хамгийн урт хайлттай ижил.
const MAX_ALIAS_WORDS = 3;
const MIN_ALIAS_LENGTH = 2;
// Гарчигт дүрмийн шошго ордог: «1214_МУУ_ҮЙЛ ҮГ».
const GRAMMAR_LABELS = new Set(["үйл үг", "нэр үг", "тэмдэг нэр", "эр", "эм"]);

// rank: ижил үгийн олон видеоноос аль нь үндсэн (бага нь түрүүлнэ).
export type SignTitle = { rank: number; words: string[] };

function parseNumberTitle(title: string): SignTitle | null {
  const match = NUMBER_TITLE.exec(title);
  if (!match) return null;
  return { rank: Number(match[3] ?? 0), words: [String(Number(match[1] + (match[2] ? "000" : "")))] };
}

/** Үгийн (эсвэл тооны) дохионы гарчгаас хайж болох үгс. Бусад видео бол null. */
export function parseSignTitle(title: string): SignTitle | null {
  const number = parseNumberTitle(title.trim());
  if (number) return number;
  const match = WORD_TITLE.exec(title.normalize("NFC").trim());
  if (!match) return null;
  const words = match[2].split(/[,_]/u)
    // «ЗУГТАХ2» — ижил үгийн хоёр дахь хувилбар
    .map((part) => part.toLocaleLowerCase("mn").replace(/\d+$/u, "").replace(/\s+/gu, " ").trim())
    .filter((word) => word.length >= MIN_ALIAS_LENGTH && word.split(" ").length <= MAX_ALIAS_WORDS)
    .filter((word) => /^[а-яёөү ]+$/u.test(word) && !GRAMMAR_LABELS.has(word));
  return words.length ? { rank: Number(match[1]), words: [...new Set(words)] } : null;
}

/** Олон видеотой үгэнд дугаар нь бага (толь бичгийн үндсэн) видеог сонгоно. */
export function buildSignDictionary(videos: { title: string; path: string }[]): Record<string, string> {
  const parsed = videos.flatMap((video) => {
    const title = parseSignTitle(video.title);
    return title ? [{ ...title, path: video.path }] : [];
  }).sort((a, b) => a.rank - b.rank);
  const dictionary: Record<string, string> = {};
  for (const { words, path } of parsed) {
    for (const word of words) dictionary[word] ??= path;
  }
  return dictionary;
}
