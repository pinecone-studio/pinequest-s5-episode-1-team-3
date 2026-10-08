import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLayout } from "@/hooks/useLayout";
import { scaleFont, scaleSize } from "@/lib/responsive";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
};

const ICON_SIZE = 32;

export function ModeCard({ label, icon, color, onPress }: Props) {
  const { scale } = useLayout();
  const box = scaleSize(sizes.modeIcon, scale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { minHeight: scaleSize(sizes.modeCardHeight, scale) },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.iconBox, { width: box, height: box, backgroundColor: color }]}
      >
        <Ionicons
          name={icon}
          size={scaleSize(ICON_SIZE, scale)}
          color={colors.white}
        />
      </View>
      <Text style={[styles.label, { fontSize: scaleFont(fontSize.body + 2, scale) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    borderRadius: radius.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
});