import { expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { strings } from "@/strings";
import type { PhraseId } from "@/lib/talk";

import { TalkPhraseCard } from "./TalkPhraseCard";

jest.mock("../../assets/images/signGreetingSequence.png", () => ({ uri: "signGreetingSequence.png" }));
jest.mock("../../assets/images/signThanksSequence.png", () => ({ uri: "signThanksSequence.png" }));

type SelectionArea = ReactElement<{
  onPress: () => void;
  accessibilityRole: string;
  accessibilityLabel: string;
  accessibilityState: { selected: boolean };
}>;

const SELECTION_CASES: [PhraseId, boolean][] = [["greeting", false], ["greeting", true], ["thanks", false], ["thanks", true]];

test.each<[PhraseId, string]>([["greeting", "signGreetingSequence.png"], ["thanks", "signThanksSequence.png"]])("card %s bundles a native-safe illustration", (phrase, asset) => {
  type Illustration = ReactElement<{ source: { uri: string }; contentFit: string }>;
  type ImageArea = ReactElement<{ children: Illustration }>;
  const card = TalkPhraseCard({ phrase, selected: false, disabled: false, onSelect: jest.fn(), onSpeak: jest.fn(), onPreview: jest.fn() }) as ReactElement<{ children: ImageArea[] }>;
  const image = card.props.children[0].props.children;
  expect(image.props.source).toEqual({ uri: asset });
  expect(image.props.contentFit).toBe("contain");
});

test.each(SELECTION_CASES)("card %s selects without speaking and exposes selected=%s", (phrase, selected) => {
  const onSelect = jest.fn();
  const onSpeak = jest.fn();
  const onPreview = jest.fn();
  const card = TalkPhraseCard({ phrase, selected, disabled: false, onSelect, onSpeak, onPreview }) as ReactElement<{ children: SelectionArea[] }>;
  const selectArea = card.props.children[0];
  expect(selectArea.props.accessibilityRole).toBe("button");
  expect(selectArea.props.accessibilityLabel).toBe(strings.talk.phrases[phrase]);
  expect(selectArea.props.accessibilityState.selected).toBe(selected);
  selectArea.props.onPress();
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSpeak).not.toHaveBeenCalled();
  expect(onPreview).not.toHaveBeenCalled();
});

test("preview and speech controls remain independent of selection", () => {
  const onSelect = jest.fn();
  const onSpeak = jest.fn();
  const onPreview = jest.fn();
  type Control = ReactElement<{ onPress: () => void }>;
  type Controls = ReactElement<{ children: [Control, ReactElement<{ children: Control }>] }>;
  const card = TalkPhraseCard({ phrase: "greeting", selected: false, disabled: false, onSelect, onSpeak, onPreview }) as ReactElement<{ children: [SelectionArea, Controls] }>;
  const controls = card.props.children[1].props.children;
  controls[0].props.onPress();
  expect(onPreview).toHaveBeenCalledTimes(1);
  expect(onSpeak).not.toHaveBeenCalled();
  controls[1].props.children.props.onPress();
  expect(onSpeak).toHaveBeenCalledTimes(1);
  expect(onSelect).not.toHaveBeenCalled();
});
