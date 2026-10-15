import { describe, expect, test } from "@jest/globals";

import { normalizeTicket } from "./ticket";

describe("normalizeTicket", () => {
  test.each([
    ["24", "24"], ["  15  ", "15"], ["015", "15"],
    ["007", "7"], ["999", "999"], ["0", "0"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeTicket(input)).toBe(expected);
  });

  test.each(["", "   ", "А", "А24", "A024", "Б-024", "1234", "-24", "24.5", "24!"])(
    "rejects invalid ticket %s", (input) => {
      expect(normalizeTicket(input)).toBeNull();
    },
  );
});
