import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useListener, type ListenerError } from "./useListener";
import type { DetectionResult } from "@/lib/types";

export function useMatchListener(mode: "queue" | "name", value: string) {
  const router = useRouter();
  const accepting = useRef(false);
  const attempt = useRef(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<ListenerError | null>(null);
  const onResult = (result: DetectionResult): void => {
    if (!accepting.current || result.match?.type !== mode) return;
    stop();
    const match = result.match;
    router.push({ pathname: "/alert", params: { kind: mode,
      ...(mode === "queue" ? { ticket: match.value, ...(match.window === null ? {} : { window: String(match.window) }) } : {}) } });
  };
  const listener = useListener({ mode, ...(mode === "queue" ? { ticket: value } : { name: value }), onResult });
  const stopListener = listener.stop;
  const stop = useCallback(() => {
    accepting.current = false;
    attempt.current += 1;
    setStarting(false);
    stopListener();
  }, [stopListener]);
  useFocusEffect(useCallback(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state !== "active") stop(); });
    return () => { stop(); subscription.remove(); };
  }, [stop]));
  useEffect(() => {
    if (!accepting.current || (listener.error !== "server" && listener.error !== "noServer")) return;
    stop();
    router.push({ pathname: "/error", params: { from: mode, kind: "server" } });
  }, [listener.error, mode, router, stop]);
  const start = () => {
    if (accepting.current && starting) return;
    const id = ++attempt.current;
    accepting.current = true; setStarting(true); setStartError(null);
    void listener.start().catch(() => { if (id === attempt.current) setStartError("recorder"); })
      .finally(() => { if (id === attempt.current) setStarting(false); });
  };
  return { listening: listener.listening || starting, error: startError ?? listener.error, start, stop };
}
