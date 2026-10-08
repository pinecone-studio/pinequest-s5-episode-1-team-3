import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { ListenButton } from "@/components/ListenButton";
import { PillButton } from "@/components/PillButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, radius, sizes, spacing } from "@/components/theme";
import { useLayout } from "@/hooks/useLayout";
import { scaleFont } from "@/lib/responsive";
import { normalizeTicket } from "@/lib/ticket";
import { strings } from "@/strings";

const t = strings.queue;
const TICKET_FONT_SIZE = fontSize.title + spacing.md;

export default function QueueScreen() {
  const router = useRouter();
  const { scale, isWide } = useLayout();
  const [input, setInput] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const toggleListening = () => {
    if (ticket) { setTicket(null); return; }
    const normalized = normalizeTicket(input);
    setError(!normalized);
    if (!normalized) return;
    Keyboard.dismiss();
    setInput(normalized);
    setTicket(normalized);
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.canGoBack() ? router.back() : router.replace("/")} />
      <View style={[styles.body, isWide && styles.wide]}>
        <View style={[styles.center, isWide && styles.half]}>
          <ListenButton listening={ticket !== null} idleLabel={t.listen} activeLabel={t.listening} onPress={toggleListening} />
          {ticket && <Text style={styles.bodyText}>{t.tapToStop}</Text>}
        </View>
        <View style={[styles.details, isWide && styles.half]}>
          {ticket ? <WaitingDetails ticket={ticket} /> : <TicketInput value={input} error={error} scale={scale} onChange={(value) => { setInput(value); setError(false); }} onSubmit={toggleListening} />}
        </View>
      </View>
      {ticket && <PillButton label={t.testAlert} icon="notifications-outline" onPress={() => router.push({ pathname: "/alert", params: { kind: "queue", ticket } })} />}
      <QueueNotice />
    </ScreenContainer>
  );
}

type InputProps = {
  value: string;
  error: boolean;
  scale: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

function TicketInput({ value, error, scale, onChange, onSubmit }: InputProps) {
  return (
    <View style={styles.details}>
      <Text nativeID="ticket-label" style={styles.label}>{t.ticketLabel}</Text>
      <TextInput
        accessibilityLabel={t.ticketLabel}
        accessibilityHint={t.example}
        accessibilityLabelledBy="ticket-label"
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={t.placeholder}
        placeholderTextColor={colors.text}
        autoCapitalize="characters"
        autoCorrect={false}
        underlineColorAndroid="transparent"
        returnKeyType="go"
        style={[styles.input, { fontSize: scaleFont(fontSize.title, scale) }]}
      />
      <Text style={styles.bodyText}>{t.example}</Text>
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.label}>{t.invalidTicket}</Text>}
    </View>
  );
}

function WaitingDetails({ ticket }: { ticket: string }) {
  return (
    <View style={styles.details}>
      <View style={styles.ticketCard}>
        <Text accessibilityLabel={`${t.ticketLabel}: ${ticket}`} style={styles.ticket}>{ticket}</Text>
      </View>
      <View style={styles.status}><Text style={styles.statusText}>{t.waiting}</Text></View>
      <Text accessibilityRole="header" style={styles.label}>{t.recent}</Text>
      <View style={styles.recent}><Ionicons name="megaphone-outline" accessible={false} size={fontSize.screenTitle} color={colors.text} /><Text style={[styles.bodyText, styles.half]}>{t.emptyRecent}</Text></View>
    </View>
  );
}

function QueueNotice() {
  return (
    <View style={styles.noticeArea}>
      <View style={styles.status}>
        <Ionicons name="phone-portrait-outline" accessible={false} size={fontSize.screenTitle} color={colors.primary} />
        <Text style={[styles.statusText, styles.half]}>{t.keepOpen}</Text>
      </View>
      <Text style={styles.bodyText}>{t.preview}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.xl },
  wide: { flexDirection: "row", alignItems: "flex-start" },
  half: { flex: 1 },
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  details: { gap: spacing.lg },
  bodyText: { color: colors.text, fontSize: fontSize.body },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  input: { minHeight: sizes.minTouch + spacing.xl, borderWidth: StyleSheet.hairlineWidth + StyleSheet.hairlineWidth, borderColor: colors.primary, borderRadius: radius.card, padding: spacing.lg, color: colors.text, fontWeight: "700" },
  ticketCard: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.successRing, backgroundColor: colors.surface, padding: spacing.xl, alignItems: "center" },
  ticket: { color: colors.success, fontWeight: "800", fontSize: TICKET_FONT_SIZE },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primarySoft, padding: spacing.lg },
  statusText: { color: colors.primary, fontSize: fontSize.body, fontWeight: "700" },
  recent: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.card },
  noticeArea: { gap: spacing.md, marginTop: spacing.xl },
});
