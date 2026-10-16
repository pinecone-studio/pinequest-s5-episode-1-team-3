import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
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
const KEEP_AWAKE_TAG = "listener";

// Апп даяар ганц сонсогч (AGENTS.md). config.recordChunkMs тутам бичлэгээ
// сервер рүү илгээж, хариуг хүлээлгүй дараагийн бичлэгээ эхэлнэ.
export function useListener({ mode, ticket, name, onResult }: Options) {
  const recorder = useAudioRecorder(DETECT_RECORDING);
  const active = useRef(false);
  const running = useRef(false);
  const starting = useRef(false);
  const cancelWait = useRef<() => void>(() => undefined);
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
      session.current += 1;
      cancelWait.current();
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
        const id = session.current;
        await recorder.prepareToRecordAsync();
        if (active.current && id === session.current) {
          recorder.record();
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, config.recordChunkMs);
            cancelWait.current = () => { clearTimeout(timer); resolve(); };
          });
        }
        await recorder.stop();
        if (recorder.uri && active.current && id === session.current) void send(recorder.uri);
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
    if (active.current || starting.current) return;
    starting.current = true;
    const id = ++session.current;
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (id !== session.current) return;
      if (!permission.granted) {
        setError("permission");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (id !== session.current) return;
      active.current = true;
      setListening(true);
      // Өмнөх давталт бичлэгээ дуусгаж байвал түүнийг үргэлжлүүлнэ
      if (!running.current) void loop();
    } finally {
      if (id === session.current) starting.current = false;
    }
  }, [loop]);

  const stop = useCallback(() => {
    active.current = false;
    starting.current = false;
    session.current += 1;
    cancelWait.current();
    setListening(false);
  }, []);

  // Сонсож байх үед дэлгэц унтрахгүй: утас түгжигдвэл апп ард шилжиж сонсох зогсоно.
  useEffect(() => {
    if (!listening) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => { void deactivateKeepAwake(KEEP_AWAKE_TAG); };
  }, [listening]);

  return { listening, error, start, stop };
}
