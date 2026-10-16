import { describe, expect, test } from "@jest/globals";

import { ALERT_KINDS, ALERTS, formatTime, isAlertKind, parseWindowNumber } from "./alerts";

describe("alert routes", () => {
  test.each(ALERT_KINDS)("supports the %s alert and vibration", (kind) => {
    expect(isAlertKind(kind)).toBe(true);
    expect(ALERTS[kind].title).not.toBe("");
    expect(ALERTS[kind].vibration.length).toBeGreaterThan(0);
  });

  test.each([undefined, null, "invalid", ["knock"], {}])("rejects invalid kind %p", (kind) => {
    expect(isAlertKind(kind)).toBe(false);
  });

  test("formats the event time with leading zeroes", () => {
    expect(formatTime(new Date(2026, 9, 8, 9, 5))).toBe("09:05");
  });

  test.each([undefined, "", "0", "-1", "1.5", "invalid"])("hides invalid window %p", (value) => {
    expect(parseWindowNumber(value)).toBeNull();
  });

  test("shows a valid service window", () => {
    expect(parseWindowNumber("3")).toBe(3);
  });
});
