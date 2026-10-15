import { expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Pressable } from "react-native";

import { strings } from "@/strings";
import { PhraseTile } from "./PhraseTile";

type Button = ReactElement<{ onPress: () => void; accessibilityLabel: string; disabled: boolean; children: ReactElement[] }>;
type Tile = ReactElement<{ children: [Button, Button] }>;

function render(disabled = false) {
  const handlers = { onSpeak: jest.fn(), onPreview: jest.fn() };
  const tile = PhraseTile({ phrase: "headache", selected: false, disabled, ...handlers }) as Tile;
  const [speak, sign] = tile.props.children;
  return { speak, sign, ...handlers };
}

// Унших чадвар сул хэрэглэгчид хоёр алхам хэцүү: дармагц хэлнэ.
test("one tap on the tile speaks the phrase", () => {
  const { speak, onSpeak, onPreview } = render();
  expect(speak.props.accessibilityLabel).toBe(strings.talk.board.headache);
  speak.props.onPress();
  expect(onSpeak).toHaveBeenCalledTimes(1);
  expect(onPreview).not.toHaveBeenCalled();
});

test("the sign button previews without speaking", () => {
  const { sign, onSpeak, onPreview } = render();
  sign.props.onPress();
  expect(onPreview).toHaveBeenCalledTimes(1);
  expect(onSpeak).not.toHaveBeenCalled();
});

// Вэб дээр <button> дотор <button> алдаа өгч байсан.
test("speak and sign buttons are siblings, never nested", () => {
  const { speak, sign } = render();
  expect(speak.type).toBe(Pressable);
  expect(sign.type).toBe(Pressable);
  expect(speak.props.children.some((child) => child.type === Pressable)).toBe(false);
});

test("both actions are disabled while the other person is being recorded", () => {
  const { speak, sign } = render(true);
  expect(speak.props.disabled).toBe(true);
  expect(sign.props.disabled).toBe(true);
});
