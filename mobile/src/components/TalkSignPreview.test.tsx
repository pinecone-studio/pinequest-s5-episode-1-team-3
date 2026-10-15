import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { signVideoUrl } from "@/lib/signDictionary";
import type { SignPlan } from "@/lib/signPlan";
import { strings } from "@/strings";
import { TalkSignPreview } from "./TalkSignPreview";

type MockPlayer = { source: string | null; muted: boolean; play: jest.Mock; onEnd?: () => void };
let mockStatus = "loading";
const mockPlayers: MockPlayer[] = [];

jest.mock("expo", () => ({
  useEvent: () => ({ status: mockStatus }),
  useEventListener: (player: MockPlayer, _event: string, listener: () => void) => { player.onEnd = listener; },
}));
jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: (source: string | null, setup: (player: MockPlayer) => void) => {
    const react = jest.requireActual<typeof import("react")>("react");
    const [player] = react.useState(() => {
      const created: MockPlayer = { source, muted: false, play: jest.fn() };
      setup(created);
      mockPlayers.push(created);
      return created;
    });
    return player;
  },
}));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
// Icon-ийн фонт асинхрон ачаалагдаж act() анхааруулга өгдөг.
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("@/config", () => ({ config: { signVideoBaseUrl: "https://sign.invalid" } }));

const KEYWORDS: SignPlan = { kind: "keywords", words: ["та", "туслах"] };
let tree: ReactTestRenderer;

function render(plan: SignPlan) {
  act(() => { tree = create(<TalkSignPreview plan={plan} onClose={jest.fn()} />); });
}
function texts(): string {
  return tree.root.findAllByType("Text" as never).map((node) => [node.props.children].flat().join("")).join(" | ");
}
const current = () => mockPlayers[mockPlayers.length - 1];

beforeEach(() => { mockPlayers.length = 0; mockStatus = "loading"; });
afterEach(() => { act(() => tree?.unmount()); });

test.each(["loading", "readyToPlay"])("starts muted sign playback only after %s", (status) => {
  mockStatus = status;
  render(KEYWORDS);
  expect(current().muted).toBe(true);
  expect(current().play).toHaveBeenCalledTimes(status === "readyToPlay" ? 1 : 0);
});

test("plays key-word signs one after another and says they are not a full translation", () => {
  render(KEYWORDS);
  expect(current().source).toBe(signVideoUrl("та", "https://sign.invalid"));
  expect(texts()).toContain(strings.talk.incoming.keywordsNotice);
  expect(texts()).toContain("ТА · 1/2");
  act(() => current().onEnd?.());
  expect(current().source).toBe(signVideoUrl("туслах", "https://sign.invalid"));
  expect(texts()).toContain("ТУСЛАХ · 2/2");
});

test("a word without a configured video says the sign is unavailable", () => {
  render({ kind: "keywords", words: ["байхгүйүг"] });
  expect(current().source).toBeNull();
  expect(texts()).toContain(strings.talk.signUnavailable);
});
