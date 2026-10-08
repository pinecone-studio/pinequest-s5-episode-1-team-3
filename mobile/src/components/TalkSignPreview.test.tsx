import { afterEach, expect, jest, test } from "@jest/globals";

import { TalkSignPreview } from "./TalkSignPreview";

let mockStatus = "loading";
const mockPlayer = { status: "loading", muted: false, play: jest.fn(), pause: jest.fn() };

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: (effect: () => void) => { effect(); },
}));
jest.mock("expo", () => ({ useEvent: () => ({ status: mockStatus }) }));
jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: (_source: unknown, setup: (player: typeof mockPlayer) => void) => {
    setup(mockPlayer);
    return mockPlayer;
  },
}));
jest.mock("@/config", () => ({ config: { greetingSignUrl: "https://sign.invalid/greeting.mp4" } }));

afterEach(() => { jest.restoreAllMocks(); mockPlayer.play.mockClear(); });

test.each(["loading", "readyToPlay"])("starts sign playback only after %s", (status) => {
  mockStatus = status;
  TalkSignPreview({ phrase: "greeting", onClose: jest.fn() });
  expect(mockPlayer.muted).toBe(true);
  expect(mockPlayer.play).toHaveBeenCalledTimes(status === "readyToPlay" ? 1 : 0);
});
