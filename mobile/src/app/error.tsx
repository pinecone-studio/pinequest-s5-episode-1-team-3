import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Vibration } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { type ErrorKind, isErrorKind, isErrorSource } from "@/lib/errors";
import { checkHealth } from "@/services/detector/health";
import { strings } from "@/strings";

const t = strings.error;
const RETRY_FAILED_VIBRATION_MS = 200;

export default function ErrorScreen() {
  const params = useLocalSearchParams<{ from?: string; kind?: string }>();
  const router = useRouter();
  const source = isErrorSource(params.from) ? params.from : null;
  const [kind, setKind] = useState<ErrorKind>(isErrorKind(params.kind) ? params.kind : "network");
  const [checking, setChecking] = useState(false);

  // Opened without history (deep link): fall back to the screen that failed.
  const leave = () => {
    if (router.canGoBack()) { router.back(); return; }
    router.replace(source ? `/${source}` : "/");
  };
  const retry = async () => {
    setChecking(true);
    const result = await checkHealth();
    setChecking(false);
    if (result === "ok") { leave(); return; }
    setKind(result);
    // A deaf user gets no "still failing" sound, so the phone buzzes instead.
    Vibration.vibrate(RETRY_FAILED_VIBRATION_MS);
  };
  const goHome = () => (router.canDismiss() ? router.dismissAll() : router.replace("/"));

  return (
    <ScreenContainer>
      <ScreenHeader
        title={source ? strings[source].title : t.title}
        backLabel={t.back}
        onBack={leave}
      />
      <ErrorBanner message={t.messages[kind]} />
      <ActionButton
        label={checking ? t.checking : t.retry}
        icon="repeat"
        disabled={checking}
        onPress={() => void retry()}
      />
      <ActionButton label={t.home} icon="home-outline" variant="soft" onPress={goHome} />
    </ScreenContainer>
  );
}
