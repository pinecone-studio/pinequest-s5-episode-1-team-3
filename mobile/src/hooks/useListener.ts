import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import { config } from "@/config";
import type { DetectionResult, DetectMode } from "@/lib/types";
import { detector, DetectorError } from "@/services/detector";

export type ListenerError = "permission" | "noServer" | "server" | "recorder";

type Options = {
  mode: DetectMode;
  ticket?: string;
  name?: string;
  onResult: (result: DetectionResult) => void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Апп даяар ганц сонсогч (AGENTS.md). config.recordChunkMs тутам бичлэгээ
// сервер рүү илгээж, хариуг хүлээлгүй дараагийн бичлэгээ эхэлнэ.
export function useListener({ mode, ticket, name, onResult }: Options) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const active = useRef(false);
  const running = useRef(false);
  const restart = useRef<() => Promise<void>>(async () => undefined);
  const latest = useRef({ mode, ticket, name, onResult });
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<ListenerError | null>(null);

  useEffect(() => {
    latest.current = { mode, ticket, name, onResult };
  });
  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );

  const send = useCallback(async (audioUri: string) => {
    const { onResult: handle, ...request } = latest.current;
    try {
      const result = await detector.detect({ audioUri, ...request });
      if (!active.current) return;
      setError(null);
      handle(result);
    } catch (cause) {
      if (!active.current) return;
      const noServer = cause instanceof DetectorError && cause.code === "NO_SERVER_URL";
      setError(noServer ? "noServer" : "server");
    }
  }, []);

  const loop = useCallback(async () => {
    running.current = true;
    try {
      while (active.current) {
        await recorder.prepareToRecordAsync();
        recorder.record();
        await wait(config.recordChunkMs);
        await recorder.stop();
        if (recorder.uri && active.current) void send(recorder.uri);
      }
    } catch {
      active.current = false;
      setError("recorder");
    } finally {
      running.current = false;
      // Давталт дуусах агшинд дахин асаасан бол шинээр эхлүүлнэ
      if (active.current) void restart.current();
      else setListening(false);
    }
  }, [recorder, send]);
  useEffect(() => {
    restart.current = loop;
  }, [loop]);

  const start = useCallback(async () => {
    if (active.current) return;
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError("permission");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    active.current = true;
    setListening(true);
    // Өмнөх давталт бичлэгээ дуусгаж байвал түүнийг үргэлжлүүлнэ
    if (!running.current) void loop();
  }, [loop]);

  const stop = useCallback(() => {
    active.current = false;
    setListening(false);
  }, []);

  return { listening, error, start, stop };
}
