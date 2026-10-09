import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ListenButton } from "@/components/ListenButton";
import { PillButton } from "@/components/PillButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToggleRow } from "@/components/ToggleRow";
import { fontSize, colors, spacing } from "@/components/theme";
import { useLayout } from "@/hooks/useLayout";
import { useListener } from "@/hooks/useListener";
import type { AlertKind } from "@/lib/alerts";
import type { DetectionResult } from "@/lib/types";
import { scaleFont } from "@/lib/responsive";
import { strings } from "@/strings";

const t = strings.home;

type SoundKey = keyof typeof t.sounds;

const INITIAL_ENABLED: Record<SoundKey, boolean> = {
  knock: true,
  bell: true,
  alarm: false,
};

export default function HomeModeScreen() {
  const router = useRouter();
  const { scale, isWide } = useLayout();
  const [enabled, setEnabled] = useState(INITIAL_ENABLED);
  // Хэрэглэгч сонсохыг хүссэн эсэх. Мэдэгдлийн дэлгэц нээгдэхэд түр зогсоод, буцахад үргэлжилнэ.
  const wanted = useRef(false);

  const onResult = (result: DetectionResult) => {
    const kind = alertKindFor(result, enabled);
    if (!kind) return;
    listener.stop();
    router.push({ pathname: "/alert", params: { kind } });
  };
  const listener = useListener({ mode: "home", onResult });
  const { start, stop } = listener;
  const listening = listener.listening;

  useFocusEffect(
    useCallback(() => {
      if (wanted.current) void start();
      return stop;
    }, [start, stop]),
  );

  const toggleListening = () => {
    wanted.current = !listening;
    if (listening) stop();
    else void start();
  };

  const setSound = (key: SoundKey) => (value: boolean) =>
    setEnabled((prev) => ({ ...prev, [key]: value }));

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t.title}
        backLabel={t.back}
        onBack={() => router.back()}
      />
      {/* Wide screens and landscape phones: button on the left, toggles on the right. */}
      <View style={[styles.body, isWide && styles.bodyWide]}>
        <View style={[styles.center, isWide && styles.half]}>
          <ListenButton
            listening={listening}
            idleLabel={t.listen}
            activeLabel={t.listening}
            onPress={toggleListening}
          />
          {listening && (
            <Text style={[styles.hint, { fontSize: scaleFont(fontSize.body, scale) }]}>
              {t.tapToStop}
            </Text>
          )}
          {listener.error && (
            <Text accessibilityRole="alert" style={[styles.error, { fontSize: scaleFont(fontSize.body, scale) }]}>
              {t.errors[listener.error]}
            </Text>
          )}
        </View>
        <View style={[styles.toggles, isWide && styles.half]}>
          <ToggleRow label={t.sounds.knock} icon="hand-right-outline" value={enabled.knock} onValueChange={setSound("knock")} />
          <ToggleRow label={t.sounds.bell} icon="notifications-outline" value={enabled.bell} onValueChange={setSound("bell")} />
          <ToggleRow label={t.sounds.alarm} icon="alarm-outline" value={enabled.alarm} onValueChange={setSound("alarm")} />
        </View>
      </View>
      {listening && <HomeAlertPreview enabled={enabled} />}
    </ScreenContainer>
  );
}

// Сервер «хаалга», «хонх» гэж таньсан ба хэрэглэгч тэр дууг асаасан бол мэдэгдэнэ.
function alertKindFor(result: DetectionResult, enabled: Record<SoundKey, boolean>): AlertKind | null {
  const label = result.sound?.label;
  if (label === "knock" && enabled.knock) return "knock";
  if (label === "doorbell" && enabled.bell) return "doorbell";
  return null;
}

function HomeAlertPreview({ enabled }: { enabled: Record<SoundKey, boolean> }) {
  const router = useRouter();

  return (
    <View style={styles.toggles}>
      {enabled.knock && <PillButton label={t.testKnock} icon="hand-right-outline" onPress={() => router.push({ pathname: "/alert", params: { kind: "knock" } })} />}
      {enabled.bell && <PillButton label={t.testDoorbell} icon="notifications-outline" onPress={() => router.push({ pathname: "/alert", params: { kind: "doorbell" } })} />}
      <Text style={[styles.hint, { fontSize: fontSize.body }]}>{t.preview}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  bodyWide: { flexDirection: "row", alignItems: "center" },
  half: { flex: 1 },
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  toggles: { gap: spacing.lg },
  hint: { color: colors.text },
  error: { color: colors.danger, textAlign: "center" },
});
