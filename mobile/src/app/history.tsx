import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { Chip } from "@/components/Chip";
import { ListRow } from "@/components/ListRow";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, spacing } from "@/components/theme";
import type { IconName } from "@/components/types";
import { ALERTS, type AlertKind } from "@/lib/alerts";
import { formatHistoryTime, type HistoryEntry, type HistoryMode, historyMode } from "@/lib/history";
import { clearHistory, listHistory } from "@/services/storage/history";
import { strings } from "@/strings";

const t = strings.history;

type Filter = "all" | HistoryMode;

const FILTERS: Filter[] = ["all", "home", "queue", "name"];

const ICONS: Record<AlertKind, IconName> = {
  knock: "hand-right",
  doorbell: "notifications",
  alarm: "alarm",
  queue: "ticket",
  name: "person",
};

function entryTitle(entry: HistoryEntry): string {
  if (entry.kind !== "queue" || !entry.ticket) return ALERTS[entry.kind].title;
  const ticket = `${entry.ticket} ${t.ticket}`;
  return entry.window ? `${ticket} · ${entry.window}${t.windowSuffix}` : ticket;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    listHistory()
      .then((rows) => {
        setEntries(rows);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }, []);
  // Мэдэгдлээс буцаж ирэх бүрт шинэ мөр харагдана.
  useFocusEffect(load);

  const clear = () => {
    clearHistory().then(load, () => setLoadError(true));
  };

  const now = new Date();
  const visible = entries.filter((entry) => filter === "all" || historyMode(entry.kind) === filter);

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.back()} />
      <View style={styles.filters}>
        {FILTERS.map((key) => (
          <Chip key={key} label={t.filters[key]} selected={filter === key} onPress={() => setFilter(key)} />
        ))}
      </View>
      {loadError && <Text accessibilityRole="alert" style={styles.empty}>{t.loadError}</Text>}
      {!loadError && visible.length === 0 && <Text style={styles.empty}>{t.empty}</Text>}
      {visible.map((entry) => (
        <ListRow
          key={entry.id}
          title={entryTitle(entry)}
          subtitle={formatHistoryTime(entry.createdAt, now, t)}
          icon={ICONS[entry.kind]}
          color={ALERTS[entry.kind].color}
        />
      ))}
      {entries.length > 0 && <ActionButton label={t.clear} icon="trash-outline" variant="soft" onPress={clear} />}
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
