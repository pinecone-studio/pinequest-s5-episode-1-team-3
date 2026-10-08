import { StyleSheet } from "react-native";

import { MAX_CONTENT_WIDTH, MIN_BUTTON, MIN_FONT, scaleSize } from "../lib/alertLayout";

export const WHITE = "#FFFFFF";
export const ICON_SIZE = 120;
export const ICON_SIZE_TICKET = 72;

const PILL_BG = "rgba(0, 0, 0, 0.2)";
const TIME_COLOR = "rgba(255, 255, 255, 0.85)";
const PILL_RADIUS = 999;

function createTextStyles(scale: number) {
  const font = (value: number) => scaleSize(value, scale, MIN_FONT);
  const windowNumberSize = scaleSize(130, scale);

  return {
    title: { color: WHITE, fontSize: font(34), fontWeight: "700", textAlign: "center" },
    time: { color: TIME_COLOR, fontSize: font(18) },
    pillText: { color: WHITE, fontSize: font(20), fontWeight: "700" },
    windowLabel: { fontSize: font(18), fontWeight: "700" },
    windowNumber: { fontSize: windowNumberSize, lineHeight: windowNumberSize, fontWeight: "800" },
    buttonText: { fontSize: font(22), fontWeight: "700" },
  } as const;
}

function createBoxStyles(scale: number) {
  const px = (value: number) => scaleSize(value, scale);

  return {
    scroll: { flex: 1 },
    content: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: px(20),
    },
    inner: {
      width: "100%",
      maxWidth: MAX_CONTENT_WIDTH,
      alignItems: "center",
      gap: px(28),
    },
    pill: {
      backgroundColor: PILL_BG,
      borderRadius: PILL_RADIUS,
      paddingHorizontal: px(20),
      paddingVertical: px(6),
    },
    windowCard: {
      backgroundColor: WHITE,
      borderRadius: px(24),
      paddingVertical: px(20),
      width: px(190),
      alignItems: "center",
    },
    button: {
      alignSelf: "stretch",
      minHeight: scaleSize(68, scale, MIN_BUTTON),
      marginTop: px(12),
      borderRadius: px(16),
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },
  } as const;
}

export function createAlertStyles(scale: number) {
  return StyleSheet.create({ ...createBoxStyles(scale), ...createTextStyles(scale) });
}

export type AlertStyles = ReturnType<typeof createAlertStyles>;