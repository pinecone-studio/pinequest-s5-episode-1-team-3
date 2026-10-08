import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { ListenButton } from "@/components/ListenButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, radius, sizes, spacing } from "@/components/theme";
import { useLayout } from "@/hooks/useLayout";
import { scaleFont } from "@/lib/responsive";
import { strings } from "@/strings";

const t = strings.name;
const NAME_FONT_SIZE = fontSize.title + spacing.md;
const INPUT_BORDER_WIDTH = 2;

export default function NameScreen() {
  const router = useRouter();
  const { scale, isWide } = useLayout();
  const [input, setInput] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const toggleListening = () => {
    if (name) { setName(null); return; }
    const enteredName = input.trim();
    setError(!enteredName);
    if (!enteredName) return;
    Keyboard.dismiss();
    setInput(enteredName);
    setName(enteredName);
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.canGoBack() ? router.back() : router.replace("/")} />
      <View style={[styles.body, isWide && styles.wide]}>
        <View style={[styles.center, isWide && styles.half]}>
          <ListenButton listening={name !== null} idleLabel={t.listen} activeLabel={t.listening} onPress={toggleListening} />
          {name && <Text style={styles.bodyText}>{t.tapToStop}</Text>}
        </View>
        <View style={[styles.details, isWide && styles.half]}>
          {name ? <WaitingName name={name} /> : <NameInput value={input} error={error} scale={scale} onChange={(value) => { setInput(value); setError(false); }} onSubmit={toggleListening} />}
        </View>
      </View>
      <NameNotice />
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

function NameInput({ value, error, scale, onChange, onSubmit }: InputProps) {
  return (
    <View style={styles.details}>
      <Text nativeID="name-label" style={styles.label}>{t.nameLabel}</Text>
      <TextInput
        accessibilityLabel={t.nameLabel}
        accessibilityLabelledBy="name-label"
        accessibilityHint={t.hint}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={t.placeholder}
        placeholderTextColor={colors.text}
        autoCapitalize="words"
        autoCorrect={false}
        underlineColorAndroid="transparent"
        returnKeyType="go"
        style={[styles.input, { fontSize: scaleFont(fontSize.title, scale) }]}
      />
      <Text style={styles.bodyText}>{t.hint}</Text>
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.label}>{t.invalidName}</Text>}
    </View>
  );
}

function WaitingName({ name }: { name: string }) {
  return (
    <View style={styles.details}>
      <Text style={styles.label}>{t.nameLabel}</Text>
      <View style={styles.nameCard}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.status} accessibilityLiveRegion="polite">
        <Text style={styles.statusText}>{t.waiting}</Text>
      </View>
    </View>
  );
}

function NameNotice() {
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
  input: { minHeight: sizes.minTouch + spacing.xl, borderWidth: INPUT_BORDER_WIDTH, borderColor: colors.primary, borderRadius: radius.card, padding: spacing.lg, color: colors.text, fontWeight: "700" },
  nameCard: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.successRing, backgroundColor: colors.surface, padding: spacing.xl, alignItems: "center" },
  name: { color: colors.success, fontWeight: "800", fontSize: NAME_FONT_SIZE, textAlign: "center" },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primarySoft, padding: spacing.lg },
  statusText: { color: colors.primary, fontSize: fontSize.body, fontWeight: "700", flexShrink: 1 },
  noticeArea: { gap: spacing.md, marginTop: spacing.xl },
});
