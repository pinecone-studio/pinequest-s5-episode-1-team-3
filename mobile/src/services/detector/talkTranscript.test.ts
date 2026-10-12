import { afterEach, expect, jest, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TranscriptionAccessError, transcribeTalk } from "./talkTranscript";

jest.mock("@/config", () => ({ config: { apiUrl: "https://server.invalid" } }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

test("SDK 57 native URI uploads retain React Native fetch in the shared env template", () => {
  const template = readFileSync(resolve(__dirname, "../../..", ".env.example"), "utf8");
  expect(template).toMatch(/^EXPO_PUBLIC_USE_RN_FETCH=1$/m);
});

test("uploads native audio and parses the validated transcript", async () => {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: true, json: async () => ({ text: "Баяртай" }) } as Response);
  expect(await transcribeTalk("file:///speech.m4a", new AbortController().signal)).toBe("Баяртай");
  expect(global.fetch).toHaveBeenCalledWith("https://server.invalid/api/v1/talk/transcribe", expect.objectContaining({ method: "POST", body: expect.any(FormData) }));
});

test("rejects invalid response shapes", async () => {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: true, json: async () => ({ text: null }) } as Response);
  await expect(transcribeTalk("file:///speech.m4a", new AbortController().signal)).rejects.toMatchObject({ code: "provider" });
});

test("explains missing Speech to Text access separately from connectivity", async () => {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: false, status: 403 } as Response);
  await expect(transcribeTalk("file:///speech.m4a", new AbortController().signal)).rejects.toBeInstanceOf(TranscriptionAccessError);
});

test.each([[503, "configuration"], [502, "provider"]])("reports HTTP %s as %s", async (status, code) => {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: false, status } as Response);
  await expect(transcribeTalk("file:///speech.m4a", new AbortController().signal)).rejects.toMatchObject({ code });
});

test("cancellation reaches the upload request", async () => {
  const controller = new AbortController(); controller.abort();
  global.fetch = jest.fn<typeof fetch>().mockImplementation(async (_url, init) => {
    expect(init?.signal?.aborted).toBe(true); throw new Error("aborted");
  });
  await expect(transcribeTalk("file:///speech.m4a", controller.signal)).rejects.toMatchObject({ code: "network" });
});
