import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLayout } from "@/hooks/useLayout";
import { scaleFont } from "@/lib/responsive";

import { colors, fontSize, sizes, spacing } from "./theme";

type Props = {
  title: string;
  backLabel: string;
  onBack: () => void;
};

export function ScreenHeader({ title, backLabel, onBack }: Props) {
  const { scale } = useLayout();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        hitSlop={spacing.sm}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={28} color={colors.primary} />
      </Pressable>
      <Text
        accessibilityRole="header"
        style={[styles.title, { fontSize: scaleFont(fontSize.screenTitle, scale) }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  back: {
    minWidth: sizes.minTouch,
    minHeight: sizes.minTouch,
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    color: colors.text,
  },
});