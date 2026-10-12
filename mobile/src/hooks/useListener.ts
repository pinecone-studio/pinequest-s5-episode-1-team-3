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

// API гэрээ: AAC, mono, 16kHz. Илүү өндөр чанар зөвхөн upload-ыг удаашруулна.
const DETECT_RECORDING = { ...RecordingPresets.HIGH_QUALITY, sampleRate: 16_000, numberOfChannels: 1, bitRate: 32_000 };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Апп даяар ганц сонсогч (AGENTS.md). config.recordChunkMs тутам бичлэгээ
// сервер рүү илгээж, хариуг хүлээлгүй дараагийн бичлэгээ эхэлнэ.
export function useListener({ mode, ticket, name, onResult }: Options) {
  const recorder = useAudioRecorder(DETECT_RECORDING);
  const active = useRef(false);
  const running = useRef(false);
  // Зогсоогоод дахин асаахад өмнөх хүсэлтийн хариу шинэ мэдэгдэл үүсгэхгүй.
  const session = useRef(0);
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
    const id = session.current;
    const current = () => active.current && id === session.current;
    try {
      const result = await detector.detect({ audioUri, ...request });
      if (!current()) return;
      setError(null);
      handle(result);
    } catch (cause) {
      if (!current()) return;
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
    session.current += 1;
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
