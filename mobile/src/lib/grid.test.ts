import { expect, test } from "@jest/globals";

import { gridRows } from "./grid";

test("splits items into rows of equal length", () => {
  expect(gridRows([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
});

// Сүүлийн мөрийн ганц элемент бүтэн өргөнөөр сунах ёсгүй: баганаараа тэгш байна.
test("pads the last row so its items keep the column width", () => {
  expect(gridRows(["a", "b", "c", "d", "e"], 3)).toEqual([["a", "b", "c"], ["d", "e", null]]);
});

test("empty input or invalid column count gives no rows", () => {
  expect(gridRows([], 2)).toEqual([]);
  expect(gridRows([1], 0)).toEqual([]);
});
