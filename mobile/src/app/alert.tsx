import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Vibration } from "react-native";

import { AlertOverlay } from "../components/AlertOverlay";
import { ALERTS, formatTime, isAlertKind, parseWindowNumber } from "../lib/alerts";

export default function AlertScreen() {
  const params = useLocalSearchParams<{ kind?: string; ticket?: string; window?: string }>();
  const router = useRouter();
  const [time] = useState(() => formatTime(new Date()));
  const kind = isAlertKind(params.kind) ? params.kind : null;

  // Хэрэглэгч «Ойлголоо» дарах хүртэл давтан чичирнэ
  useEffect(() => {
    if (!kind) return;
    Vibration.vibrate([...ALERTS[kind].vibration], true);
    return () => Vibration.cancel();
  }, [kind]);

  if (!kind) return <Redirect href="/" />;

  // Буцах түүх байхгүй үед (жишээ нь мэдэгдлээс шууд нээгдсэн) нүүр рүү явна
  const dismiss = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <AlertOverlay
      kind={kind}
      time={time}
      ticket={params.ticket ?? null}
      windowNumber={parseWindowNumber(params.window)}
      onDismiss={dismiss}
    />
  );
}