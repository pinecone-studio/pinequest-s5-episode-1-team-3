import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

import { useLayout } from "@/hooks/useLayout";
import { scaleFont, scaleSize } from "@/lib/responsive";

import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

type Props = {
  label: string;
  icon: IconName;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const ICON_SIZE = 26;

export function ToggleRow({ label, icon, value, onValueChange }: Props) {
  const { scale } = useLayout();

  return (
    <View
      style={[
        styles.row,
        { minHeight: scaleSize(sizes.minTouch + spacing.md, scale) },
      ]}
    >
      <Ionicons
        name={icon}
        size={scaleSize(ICON_SIZE, scale)}
        color={colors.text}
      />
      <Text style={[styles.label, { fontSize: scaleFont(fontSize.body, scale) }]}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.switchOff, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  label: {
    flex: 1,
    color: colors.text,
  },
});