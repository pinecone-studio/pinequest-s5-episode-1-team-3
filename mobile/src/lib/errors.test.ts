import { describe, expect, it } from "@jest/globals";

import { isErrorKind, isErrorSource } from "./errors";

describe("isErrorKind", () => {
  it("accepts known kinds", () => {
    expect(isErrorKind("network")).toBe(true);
    expect(isErrorKind("server")).toBe(true);
  });

  it("rejects anything else a route param can carry", () => {
    expect(isErrorKind("timeout")).toBe(false);
    expect(isErrorKind(undefined)).toBe(false);
    expect(isErrorKind(["network"])).toBe(false);
  });
});

describe("isErrorSource", () => {
  it("accepts the four modes", () => {
    expect(isErrorSource("home")).toBe(true);
    expect(isErrorSource("queue")).toBe(true);
    expect(isErrorSource("name")).toBe(true);
    expect(isErrorSource("talk")).toBe(true);
  });

  it("rejects screens that never call the server", () => {
    expect(isErrorSource("settings")).toBe(false);
    expect(isErrorSource("")).toBe(false);
    expect(isErrorSource(undefined)).toBe(false);
  });
});
