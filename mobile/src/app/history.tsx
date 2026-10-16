import { useRouter } from "expo-router";
import { useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/Chip";
import { ListRow } from "@/components/ListRow";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, spacing } from "@/components/theme";
import type { IconName } from "@/components/types";
import { ALERTS, formatTime, type AlertKind } from "@/lib/alerts";
import { getHistory, historyTitle, subscribeHistory } from "@/lib/history";
import { strings } from "@/strings";

const t = strings.history;

type Filter = keyof typeof t.filters;

const FILTERS: Filter[] = ["all", "home", "queue", "name"];
const MODE: Record<AlertKind, Exclude<Filter, "all">> = { knock: "home", doorbell: "home", alarm: "home", queue: "queue", name: "name" };
const ICON: Record<AlertKind, IconName> = { knock: "hand-right", doorbell: "notifications", alarm: "alarm", queue: "ticket", name: "person" };

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const history = useSyncExternalStore(subscribeHistory, getHistory);
  const entries = history.filter((entry) => filter === "all" || MODE[entry.kind] === filter);

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
          title={historyTitle(entry)}
          subtitle={formatTime(entry.at)}
          icon={ICON[entry.kind]}
          color={ALERTS[entry.kind].color}
        />
      ))}
      <Text style={styles.note}>{t.sessionOnly}</Text>
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
  note: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
