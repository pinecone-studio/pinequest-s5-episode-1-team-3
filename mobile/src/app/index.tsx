import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ModeCard } from "@/components/ModeCard";
import { PillButton } from "@/components/PillButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors, fontSize, spacing } from "@/components/theme";
import type { IconName } from "@/components/types";
import { useLayout } from "@/hooks/useLayout";
import { GRID_COLUMN_WIDTH, scaleFont } from "@/lib/responsive";
import { strings } from "@/strings";

type ModeItem = {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  route: Href;
};

type ShortcutItem = {
  key: string;
  label: string;
  icon: IconName;
  route: Href;
};

const t = strings.index;

const MODES: ModeItem[] = [
  { key: "home", label: t.modes.home, icon: "home", color: colors.mode.home, route: "/home" },
  { key: "queue", label: t.modes.queue, icon: "ticket", color: colors.mode.queue, route: "/queue" },
  { key: "name", label: t.modes.name, icon: "person", color: colors.mode.name, route: "/name" },
  { key: "talk", label: t.modes.talk, icon: "chatbubble-ellipses", color: colors.mode.talk, route: "/talk" },
];

const SHORTCUTS: ShortcutItem[] = [
  { key: "history", label: t.shortcuts.history, icon: "time-outline", route: "/history" },
  { key: "settings", label: t.shortcuts.settings, icon: "settings-outline", route: "/settings" },
  { key: "interpreter", label: t.shortcuts.interpreter, icon: "hand-left-outline", route: "/help" },
];

export default function ModeSelectScreen() {
  const router = useRouter();
  const { scale, isWide } = useLayout();

  return (
    <ScreenContainer>
      <Text
        accessibilityRole="header"
        style={[styles.title, { fontSize: scaleFont(fontSize.title, scale) }]}
      >
        {t.title}
      </Text>
      <View style={styles.grid}>
        {MODES.map((mode) => (
          <View key={mode.key} style={{ width: isWide ? GRID_COLUMN_WIDTH : "100%" }}>
            <ModeCard
              label={mode.label}
              icon={mode.icon}
              color={mode.color}
              onPress={() => router.push(mode.route)}
            />
          </View>
        ))}
      </View>
      <View style={styles.shortcuts}>
        {SHORTCUTS.map((item) => (
          <PillButton
            key={item.key}
            label={item.label}
            icon={item.icon}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "800", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  shortcuts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
});