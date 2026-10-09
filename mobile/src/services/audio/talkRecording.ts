import { requestRecordingPermissionsAsync, setAudioModeAsync, type AudioRecorder } from "expo-audio";

export class MicrophonePermissionError extends Error {}
export class MicrophoneSetupError extends Error {}

export async function startTalkRecording(recorder: AudioRecorder, signal: AbortSignal): Promise<void> {
  let stage = "permission";
  try {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) throw new MicrophonePermissionError();
    if (signal.aborted) return;
    stage = "audioSession";
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    stage = "prepare";
    await recorder.prepareToRecordAsync();
    if (signal.aborted) { await stopTalkRecording(recorder); return; }
    stage = "record";
    // The hook owns the eight-second stop timer; use the basic Expo Go recording API.
    recorder.record();
  } catch (cause) {
    if (cause instanceof MicrophonePermissionError) throw cause;
    throw new MicrophoneSetupError(`${stage}: ${cause instanceof Error ? cause.message : "unknown"}`);
  }
}

export async function stopTalkRecording(recorder: AudioRecorder): Promise<void> {
  try { await recorder.stop(); }
  finally { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); }
}
