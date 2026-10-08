import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  iconColor?: string;
  // Rows without onPress are plain information, not buttons.
  onPress?: () => void;
};

const ICON_SIZE = 26;

export function ListRow({
  title,
  subtitle,
  icon,
  color,
  iconColor = colors.white,
  onPress,
}: Props) {
  return (
    <Pressable
      accessible
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${title}, ${subtitle}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={ICON_SIZE} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.minTouch + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: sizes.itemIcon,
    height: sizes.itemIcon,
    borderRadius: radius.icon,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  title: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textMuted },
});
