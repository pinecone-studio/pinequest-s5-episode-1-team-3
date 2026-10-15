import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BoardPhraseId } from "@/lib/phraseBoard";
import { strings } from "@/strings";
import { PHRASE_ICONS } from "./phraseIcons";
import { colors, fontSize, radius, sizes, spacing } from "./theme";

const t = strings.talk;
const ICON_SIZE = 28;
const SIGN_ICON_SIZE = 20;

type Props = { phrase: BoardPhraseId; selected: boolean; disabled: boolean; onSpeak: () => void; onPreview: () => void };

/** Нэг товшилт = хэлэх. Унших чадвар сул хэрэглэгч дүрсээр олоод, «Дохио»-гоор утгыг нь шалгана. */
export function PhraseTile({ phrase, selected, disabled, onSpeak, onPreview }: Props) {
  const text = t.board[phrase];
  // Хоёр товч зэрэгцээ: товч дотор товч байвал вэб дээр <button> давхардаж, screen reader-т ч ялгагдахгүй.
  return (
    <View style={[styles.tile, selected && styles.selected, disabled && styles.disabled]}>
      <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onSpeak}
        style={({ pressed }) => [styles.speak, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <Ionicons name={PHRASE_ICONS[phrase]} size={ICON_SIZE} color={colors.primary} accessible={false} />
        </View>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t.watchSign}: ${text}`} disabled={disabled} onPress={onPreview}
        style={({ pressed }) => [styles.sign, pressed && styles.pressed]}>
        <Ionicons name="play-circle-outline" size={SIGN_ICON_SIZE} color={colors.infoText} accessible={false} />
        <Text style={styles.signText}>{t.watchSign}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Grid-ийн нүдийг бүхэлд нь дүүргэж, нэг мөрийн хавтангууд ижил өндөртэй болно.
  tile: { flexGrow: 1, overflow: "hidden", borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.5 },
  speak: { flexGrow: 1, minHeight: sizes.minTouch, alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  iconCircle: { width: sizes.itemIcon + spacing.sm, height: sizes.itemIcon + spacing.sm, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  text: { fontSize: fontSize.body, fontWeight: "600", color: colors.text, textAlign: "center" },
  // Картын доод мөр: хэлэх товчноос сул харагдана, гэхдээ 56px хүрнэ.
  sign: { minHeight: sizes.minTouch, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  signText: { fontSize: fontSize.body, fontWeight: "600", color: colors.infoText },
  pressed: { backgroundColor: colors.surfaceMuted },
});
