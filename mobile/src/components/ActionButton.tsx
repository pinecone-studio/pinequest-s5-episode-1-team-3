import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  label: string;
  icon?: IconName;
  disabled?: boolean;
  onPress: () => void;
};

const ICON_SIZE = 22;

export function ActionButton({ label, icon, disabled = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed]}
    >
      {icon !== undefined && (
        <Ionicons name={icon} size={ICON_SIZE} color={colors.white} />
      )}
      <Text style={styles.label}>{label}</Text>
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
  dimmed: { opacity: 0.6 },
  label: {
    fontSize: fontSize.body,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
});
