import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

export function PillButton({ label, icon, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: sizes.minTouch,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.7 },
  label: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primary,
  },
});