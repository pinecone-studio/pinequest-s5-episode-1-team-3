import { RecordingPresets, useAudioRecorder } from "expo-audio";
import { useEffect, useRef, useState } from "react";

import { RECORDING_SECONDS } from "@/lib/talkTranscript";
import { MicrophonePermissionError, MicrophoneSetupError, startTalkRecording, stopTalkRecording } from "@/services/audio/talkRecording";
import { TranscriptionAccessError, transcribeTalk } from "@/services/detector/talkTranscript";
import { SpeechRequestError, type SpeechErrorCode } from "@/services/detector/talkSpeech";

type Phase = "idle" | "preparing" | "recording" | "processing";

export function useIncomingTalk() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<SpeechErrorCode | "permission" | "access" | "recording" | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), finishing = useRef(false);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const cancel = async () => {
    clearTimer(); const controller = active.current; controller?.abort(); setPhase("processing");
    await stopTalkRecording(recorder).catch(() => {});
    if (active.current === controller) { active.current = null; setPhase("idle"); }
  };
  useEffect(() => () => { clearTimer(); active.current?.abort(); void stopTalkRecording(recorder).catch(() => {}); }, [recorder]);
  const fail = (cause: unknown) => { setErrorDetails(cause instanceof MicrophoneSetupError ? cause.message : null); setError(cause instanceof MicrophonePermissionError ? "permission" : cause instanceof MicrophoneSetupError ? "recording" : cause instanceof TranscriptionAccessError ? "access" : cause instanceof SpeechRequestError ? cause.code : "recording"); };
  const finish = async () => {
    const controller = active.current;
    if (!controller || controller.signal.aborted || finishing.current) return;
    finishing.current = true; clearTimer(); setPhase("processing");
    try {
      await stopTalkRecording(recorder);
      if (!recorder.uri || controller.signal.aborted) return;
      setRecordingUri(recorder.uri);
      const text = await transcribeTalk(recorder.uri, controller.signal);
      if (!controller.signal.aborted) setTranscript(text);
    } catch (cause) { if (!controller.signal.aborted) fail(cause); }
    finally { finishing.current = false; if (active.current === controller) { active.current = null; setPhase("idle"); } }
  };
  const start = async () => {
    if (active.current) return;
    const controller = new AbortController(); active.current = controller;
    setError(null); setErrorDetails(null); setTranscript(null); setRecordingUri(null); setPhase("preparing");
    try {
      await startTalkRecording(recorder, controller.signal);
      if (controller.signal.aborted) return;
      setPhase("recording"); timer.current = setTimeout(() => void finish(), RECORDING_SECONDS * 1_000);
    } catch (cause) { if (!controller.signal.aborted) { fail(cause); await cancel(); } }
  };
  return { phase, transcript, recordingUri, error, errorDetails, start, finish, cancel, busy: phase !== "idle" };
}
