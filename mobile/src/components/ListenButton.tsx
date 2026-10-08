import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLayout } from "@/hooks/useLayout";
import { scaleFont, scaleSize } from "@/lib/responsive";

import { colors, fontSize, radius, sizes, spacing } from "./theme";

type Props = {
  listening: boolean;
  idleLabel: string;
  activeLabel: string;
  onPress: () => void;
};

export function ListenButton({
  listening,
  idleLabel,
  activeLabel,
  onPress,
}: Props) {
  const { scale } = useLayout();
  const label = listening ? activeLabel : idleLabel;
  const circle = scaleSize(sizes.listenCircle, scale);
  const outer = circle + sizes.listenRing * 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: listening }}
      onPress={onPress}
    >
      {/* The ring is always rendered (transparent when idle) so the layout doesn't jump. */}
      <View
        style={[
          styles.ring,
          { width: outer, height: outer },
          listening && { borderColor: colors.successRing },
        ]}
      >
        <View
          style={[
            styles.circle,
            {
              width: circle,
              height: circle,
              backgroundColor: listening ? colors.success : colors.primary,
            },
          ]}
        >
          <Ionicons
            name="ear"
            size={scaleSize(sizes.listenIcon, scale)}
            color={colors.white}
          />
          <Text style={[styles.label, { fontSize: scaleFont(fontSize.body, scale) }]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderRadius: radius.full,
    borderWidth: sizes.listenRing,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  label: {
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
});