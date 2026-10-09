import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  label: string;
  icon?: IconName;
  // "soft" is the quieter second choice next to a primary button.
  variant?: "primary" | "soft";
  disabled?: boolean;
  onPress: () => void;
};

const ICON_SIZE = 22;

export function ActionButton({
  label,
  icon,
  variant = "primary",
  disabled = false,
  onPress,
}: Props) {
  const soft = variant === "soft";
  const tint = soft ? colors.primary : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        soft && styles.soft,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {icon !== undefined && <Ionicons name={icon} size={ICON_SIZE} color={tint} />}
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.minTouch,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.icon,
  },
  soft: { backgroundColor: colors.primarySoft },
  dimmed: { opacity: 0.6 },
  label: {
    fontSize: fontSize.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
