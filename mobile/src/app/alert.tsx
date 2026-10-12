import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";

import { AlertOverlay } from "../components/AlertOverlay";
import { ALERTS, formatTime, isAlertKind, parseWindowNumber } from "../lib/alerts";
import { addHistory } from "../services/storage/history";

export default function AlertScreen() {
  const params = useLocalSearchParams<{ kind?: string; ticket?: string; window?: string }>();
  const router = useRouter();
  const [time] = useState(() => formatTime(new Date()));
  const kind = isAlertKind(params.kind) ? params.kind : null;
  const windowNumber = parseWindowNumber(params.window);
  const ticket = params.ticket ?? null;

  const saved = useRef(false);

  // Нэг мэдэгдэл = түүхэнд нэг мөр (StrictMode-д effect хоёр удаа ажилладаг тул ref).
  // Хадгалж чадаагүй ч мэдэгдлийг заавал харуулна.
  useEffect(() => {
    if (!kind || saved.current) return;
    saved.current = true;
    addHistory({ kind, ticket, window: windowNumber, createdAt: Date.now() }).catch(() => undefined);
  }, [kind, ticket, windowNumber]);

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
      ticket={ticket}
      windowNumber={windowNumber}
      onDismiss={dismiss}
    />
  );
}