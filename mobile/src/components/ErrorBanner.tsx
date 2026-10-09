import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, sizes, spacing } from "./theme";

type Props = { message: string };

const ICON_SIZE = 26;

export function ErrorBanner({ message }: Props) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
      <Ionicons name="warning-outline" accessible={false} size={ICON_SIZE} color={colors.text} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: sizes.minTouch + spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.card,
  },
  message: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.danger,
  },
});
