import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";

import { AlertOverlay } from "../components/AlertOverlay";
import { AlertTorch } from "../components/AlertTorch";
import { ALERTS, formatTime, isAlertKind, parseWindowNumber } from "../lib/alerts";
import { addHistory } from "../lib/history";

export default function AlertScreen() {
  const params = useLocalSearchParams<{ kind?: string; ticket?: string; window?: string }>();
  const router = useRouter();
  const [time] = useState(() => formatTime(new Date()));
  const kind = isAlertKind(params.kind) ? params.kind : null;
  const recorded = useRef(false);

  // Нэг мэдэгдэл = түүхэд нэг мөр (dev-ийн StrictMode effect-ийг 2 удаа ажиллуулдаг)
  useEffect(() => {
    if (!kind || recorded.current) return;
    recorded.current = true;
    addHistory({ kind, at: new Date(), ticket: params.ticket ?? null, window: parseWindowNumber(params.window) });
  }, [kind, params.ticket, params.window]);

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
    <>
      <AlertTorch />
      <AlertOverlay
        kind={kind}
        time={time}
        ticket={params.ticket ?? null}
        windowNumber={parseWindowNumber(params.window)}
        onDismiss={dismiss}
      />
    </>
  );
}