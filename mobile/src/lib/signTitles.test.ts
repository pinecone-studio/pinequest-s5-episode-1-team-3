import { expect, test } from "@jest/globals";

import { buildSignDictionary, parseSignTitle } from "./signTitles";

test.each<[string, string[] | null]>([
  ["0951_ДАХИН", ["дахин"]],
  ["1309_НАГАЦ ЭГЧ", ["нагац эгч"]],
  ["1333_ШУНАХ, ШУНАЛ", ["шунах", "шунал"]],
  ["1260_ЗА_ЗӨВ", ["за", "зөв"]],
  ["1401_ЗУГТАХ2", ["зугтах"]],
  ["1214_МУУ_ҮЙЛ ҮГ", ["муу"]],
  ["1030_ОЙЛГОХ_ТАРХИНД ҮГИЙГ ОЙЛГОХ", ["ойлгох", "тархинд үгийг ойлгох"]],
  ["0949_БАТ БӨХ, ХАТУУ_ТУН ИХ ХҮЧТЭЙ ЧАНГА", ["бат бөх", "хатуу"]],
  ["1125_POWER POINT", null],
  ["0386 – Өгүүлбэр – ХОЖИХ_Ө", null],
  ["20. С", null],
  ["700", ["700"]],
  ["10_2", ["10"]],
  ["11.000_1", ["11000"]],
  ["10.1", null],
  ["100,000", null],
])("reads «%s» as %j", (title, words) => {
  expect(parseSignTitle(title)?.words ?? null).toEqual(words);
});

test("the dictionary's main (lowest-numbered) video wins for repeated words", () => {
  const dictionary = buildSignDictionary([
    { title: "1312_ӨРГӨСТ ХЭМХ", path: "2024/08/1312.mp4" },
    { title: "1315_ӨРГӨСТ ХЭМХ", path: "2024/08/1315.mp4" },
    { title: "0386 – Өгүүлбэр – ХОЖИХ_Ө", path: "2024/08/0386-sentence.mp4" },
    { title: "10_2", path: "2024/08/10_2.mp4" },
    { title: "10_1", path: "2024/08/10_1.mp4" },
  ]);
  expect(dictionary).toEqual({ "өргөст хэмх": "2024/08/1312.mp4", 10: "2024/08/10_1.mp4" });
});
