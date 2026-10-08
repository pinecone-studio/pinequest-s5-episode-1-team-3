import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/Chip";
import { ListRow } from "@/components/ListRow";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, spacing } from "@/components/theme";
import type { IconName } from "@/components/types";
import { strings } from "@/strings";

const t = strings.history;

type Filter = keyof typeof t.filters;
type Mode = Exclude<Filter, "all">;

type HistoryEntry = {
  id: string;
  mode: Mode;
  icon: IconName;
  color: string;
  title: string;
  time: string;
};

const FILTERS: Filter[] = ["all", "home", "queue", "name"];

// Placeholder rows; replace with a services/storage query once it exists.
const SAMPLE_ENTRIES: HistoryEntry[] = [
  { id: "1", mode: "queue", icon: "ticket", color: colors.mode.queue, ...t.sample.queue },
  { id: "2", mode: "home", icon: "hand-right", color: colors.mode.home, ...t.sample.knock },
  { id: "3", mode: "home", icon: "notifications", color: colors.info, ...t.sample.doorbell },
  { id: "4", mode: "name", icon: "person", color: colors.mode.name, ...t.sample.name },
];

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const entries = SAMPLE_ENTRIES.filter(
    (entry) => filter === "all" || entry.mode === filter,
  );

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.back()} />
      <View style={styles.filters}>
        {FILTERS.map((key) => (
          <Chip
            key={key}
            label={t.filters[key]}
            selected={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </View>
      {entries.length === 0 && <Text style={styles.empty}>{t.empty}</Text>}
      {entries.map((entry) => (
        <ListRow
          key={entry.id}
          title={entry.title}
          subtitle={entry.time}
          icon={entry.icon}
          color={entry.color}
        />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  empty: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
