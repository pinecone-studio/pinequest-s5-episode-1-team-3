import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { config } from "@/config";
import { prepareSpeech } from "./talkSpeech";

jest.mock("@/config", () => ({ config: { apiUrl: "https://server.invalid" } }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

describe("talk speech", () => {
  test("warms a greeting and returns the audio playback URL", async () => {
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true, headers: { get: () => "audio/mpeg" },
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as Response);
    const uri = await prepareSpeech("greeting", new AbortController().signal);
    expect(uri).toBe(`${config.apiUrl}/api/v1/talk/speech?phrase=greeting`);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test.each([[503, "configuration"], [502, "provider"]])("reports HTTP %s as %s", async (status, code) => {
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: false, status } as Response);
    await expect(prepareSpeech("thanks", new AbortController().signal)).rejects.toMatchObject({ code });
  });

  test("rejects a non-audio response", async () => {
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({ ok: true, headers: { get: () => "text/html" } } as unknown as Response);
    await expect(prepareSpeech("thanks", new AbortController().signal)).rejects.toMatchObject({ code: "provider" });
  });

  test("passes stop cancellation into the HTTP request", async () => {
    const controller = new AbortController();
    controller.abort();
    global.fetch = jest.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      expect(init?.signal?.aborted).toBe(true);
      throw new Error("aborted");
    });
    await expect(prepareSpeech("greeting", controller.signal)).rejects.toMatchObject({ code: "network" });
  });
});
