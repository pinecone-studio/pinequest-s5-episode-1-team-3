import { expect, test } from "@jest/globals";

import { dictionaryForms, findKeywordSigns, MAX_KEYWORD_SIGNS, spokenNumber } from "./keywordSigns";

// mnsl.mn толь бичгийн жишээ үгс (одоо апп-д зөвхөн 5-ынх нь видео бий).
const VOCABULARY = new Set([
  "сайн байна уу", "баярлалаа", "баяртай", "туслах", "хүлээх", "цонх", "та", "гурав", "очих", "ирэх", "10", "гар", "болох",
]);

test.each<[string, string[]]>([
  ["Таньд юугаар туслах вэ?", ["та", "туслах"]],
  ["Би танд одоо туслана", ["та", "туслах"]],
  ["Түр хүлээнэ үү, гуравдугаар цонх руу орно уу", ["хүлээх", "цонх"]],
  ["Цонхоор орно уу", ["цонх"]],
  // Утсан дээр зөвхөн [ТА] гарч байсныг дахин гаргахгүй.
  ["Та 10 дугаарын цонхонд очно уу", ["та", "10", "цонх", "очих"]],
  ["10-р цонх руу очоорой", ["10", "цонх", "очих"]],
  ["Маргааш дахин ирээрэй", ["ирэх"]],
  ["Энэ бол цонх", ["цонх"]],
  ["Сайн байна уу, баярлалаа", ["сайн байна уу", "баярлалаа"]],
  ["Баярлалаа, баярлалаа", ["баярлалаа"]],
  ["Өнөөдөр цаг агаар сайхан", []],
  ["", []],
])("finds signs for key words in «%s»", (transcript, expected) => {
  expect(findKeywordSigns(transcript, VOCABULARY)).toEqual(expected);
});

// Үгүйсгэлтэй өгүүлбэрт гол үгийн дохио эсрэг утга өгнө.
test.each(["Танд туслахгүй", "Туслах боломжгүй", "Цонх биш", "Битгий хүлээ", "Үгүй, баярлалаа", "Хүлээх хэрэггүй"])(
  "shows no signs for negated «%s»",
  (transcript) => {
    expect(findKeywordSigns(transcript, VOCABULARY)).toEqual([]);
  },
);

test("short stems never match a longer word", () => {
  // «ба» нь «баяртай»-гаас тасарсан мэт харагдаж болох ч таарахгүй.
  expect(findKeywordSigns("ба бол", VOCABULARY)).toEqual([]);
  expect(dictionaryForms("бол")).not.toContain("б");
});

test("keeps only a few signs so a long sentence is not mistaken for a translation", () => {
  const long = "Та цонх дугаар гурав хүлээх туслах баяртай";
  expect(findKeywordSigns(long, VOCABULARY)).toHaveLength(MAX_KEYWORD_SIGNS);
});

test("question particles are not read as verbs", () => {
  // «уу» + «-х» = «уух» (уух) гэж буруу таарч байсныг дахин гаргахгүй.
  expect(dictionaryForms("уу")).toEqual(["уу"]);
  expect(findKeywordSigns("Цонх руу орно уу", new Set(["уух", "цонх"]))).toEqual(["цонх"]);
});

test.each<[string, number | null]>([
  ["гуравдугаар", 3], ["нэгдүгээр", 1], ["аравдугаар", 10], ["гурван", 3], ["мянган", 1000],
  // «нэг юм», «энд тав» — тоо биш байх нь элбэг
  ["нэг", null], ["тав", null], ["дугаар", null],
])("reads the spoken number «%s» as %s", (word, number) => {
  expect(spokenNumber(word)).toBe(number);
});

test("spoken tens and units become one number sign", () => {
  const numbers = new Set(["15", "23", "10", "5"]);
  expect(findKeywordSigns("арван тав", numbers)).toEqual(["15"]);
  expect(findKeywordSigns("хорин гурав", numbers)).toEqual(["23"]);
  expect(findKeywordSigns("тав", numbers)).toEqual([]);
});

test("after a verb ending the verb wins over a look-alike noun", () => {
  // «гарна» (гарах) нь «гар» (гар) биш; «гарын» (гарын) нь гар хэвээр.
  const vocabulary = new Set(["гар", "гарах"]);
  expect(findKeywordSigns("гарна уу", vocabulary)).toEqual(["гарах"]);
  expect(findKeywordSigns("гарын", vocabulary)).toEqual(["гар"]);
});

test("a two-letter stem is read as a verb only after a verb ending", () => {
  // «уут» (уут) → «уух» гэж буруу таарч байсныг дахин гаргахгүй.
  expect(findKeywordSigns("Уут хэрэгтэй юу", new Set(["уух"]))).toEqual([]);
  expect(findKeywordSigns("Ус уугаарай", new Set(["уух"]))).toEqual(["уух"]);
});

test("filler words do not take one of the few sign slots", () => {
  expect(findKeywordSigns("Энэ цонх байна", new Set(["энэ", "цонх", "байна"]))).toEqual(["цонх"]);
});

test("verb forms map to the dictionary infinitive", () => {
  expect(dictionaryForms("туслана")).toContain("туслах");
  expect(dictionaryForms("хүлээсэн")).toContain("хүлээх");
  expect(dictionaryForms("таньд")).toContain("та");
  expect(dictionaryForms("юугаар")).toContain("юу");
  expect(dictionaryForms("хүлээ")).toContain("хүлээх");
  expect(dictionaryForms("очно")).toContain("очих");
  expect(dictionaryForms("бол")).toEqual(["бол"]);
});
