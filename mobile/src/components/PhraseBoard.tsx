import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { phrasesFor, QUICK_REPLIES, SITUATIONS, type BoardPhraseId, type Situation } from "@/lib/phraseBoard";
import { strings } from "@/strings";
import { Grid } from "./Grid";
import { PHRASE_ICONS, SITUATION_ICONS } from "./phraseIcons";
import { PhraseTile } from "./PhraseTile";
import { colors, fontSize, radius, sizes, spacing } from "./theme";
import type { IconName } from "./types";

const t = strings.talk;
const TAB_ICON_SIZE = 24;
// «Тийм», «Үгүй»-г өнгөөр ялгана: хурдан яриан дунд буруу дарахаас сэргийлнэ.
const REPLY_COLORS: Partial<Record<BoardPhraseId, string>> = { yes: colors.success, no: colors.danger };
const SHORT_LABELS: Partial<Record<BoardPhraseId, string>> = t.quickShort;

type Props = {
  selected: BoardPhraseId | null;
  disabled: boolean;
  onSpeak: (phrase: BoardPhraseId) => void;
  onPreview?: (phrase: BoardPhraseId) => void;
};

type TabProps = { label: string; a11yLabel?: string; icon: IconName; iconColor?: string; active: boolean; disabled?: boolean; onPress: () => void };

function Tab({ label, a11yLabel, icon, iconColor = colors.primary, active, disabled, onPress }: TabProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11yLabel ?? label} accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed, active && styles.tabActive, disabled && styles.disabled]}>
      <Ionicons name={icon} size={TAB_ICON_SIZE} color={active ? colors.white : iconColor} accessible={false} />
      <Text numberOfLines={1} style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Нөхцөл байдлын таб + 2 баганатай өгүүлбэрийн сүлжээ. */
export function PhraseBoard({ selected, disabled, onSpeak, onPreview }: Props) {
  const [situation, setSituation] = useState<Situation>("daily");
  return (
    <View style={styles.board}>
      <Text style={styles.heading}>{t.instruction}</Text>
      <Grid items={SITUATIONS} columns={3} keyOf={(id) => id} render={(id) => (
        <Tab label={t.situations[id]} icon={SITUATION_ICONS[id]} active={situation === id} onPress={() => setSituation(id)} />
      )} />
      <Grid items={phrasesFor(situation)} columns={2} keyOf={(id) => id} render={(id) => (
        <PhraseTile phrase={id} selected={selected === id} disabled={disabled} onSpeak={() => onSpeak(id)} onPreview={() => onPreview?.(id)} />
      )} />
    </View>
  );
}

/** Дэлгэцийн доор үргэлж харагдах «Тийм», «Үгүй» … Нэг мөрөнд: гүйлгэх талбайг аль болох бага эзэлнэ. */
export function QuickReplies({ selected, disabled, onSpeak }: Props) {
  return (
    <View accessibilityLabel={t.quickReplies}>
      <Grid items={QUICK_REPLIES} columns={QUICK_REPLIES.length} keyOf={(id) => id} render={(id) => (
        <Tab label={SHORT_LABELS[id] ?? t.board[id]} a11yLabel={t.board[id]} icon={PHRASE_ICONS[id]} iconColor={REPLY_COLORS[id]}
          active={selected === id} disabled={disabled} onPress={() => onSpeak(id)} />
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: spacing.md },
  heading: { fontSize: fontSize.body, fontWeight: "600", color: colors.textMuted },
  tab: { flexGrow: 1, minHeight: sizes.minTouch, alignItems: "center", justifyContent: "center", gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radius.icon, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.body, fontWeight: "600", color: colors.text, textAlign: "center" },
  tabTextActive: { color: colors.white },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.5 },
});
