import { expect, test } from "@jest/globals";

import { matchIncomingSign, type IncomingSignId } from "./incomingSigns";

const CASES: [string, IncomingSignId | null][] = [
  ["Сайн байна уу?", "greeting"],
  ["  САЙН   БАЙНА УУ!  ", "greeting"],
  ["Сайн уу", "greeting"],
  ["Баярлалаа.", "thanks"],
  ["Маш их баярлалаа", "thanks"],
  ["Уучлаарай!", "sorry"],
  ["Өршөөгөөрэй", "sorry"],
  ["Баяртай", "goodbye"],
  ["Танд юугаар туслах вэ?", "helpQuestion"],
  ["Юугаар туслах вэ?", "helpQuestion"],
  ["Тусламж хэрэггүй", null],
  ["Танд туслахгүй", null],
  ["Баяртай биш байна", null],
  ["Сайн байна уу гэж хэлээгүй", null],
  ["Туслах", null],
  ["", null],
];

test.each(CASES)("maps %s to %s without guessing unsupported sentences", (transcript, expected) => {
  expect(matchIncomingSign(transcript)).toBe(expected);
});
