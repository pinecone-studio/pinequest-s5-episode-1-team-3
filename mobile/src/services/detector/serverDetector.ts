import { Platform } from "react-native";

import { config } from "@/config";
import { parseDetectionResult } from "@/lib/schemas";
import type { DetectionResult, DetectRequest } from "@/lib/types";

import { DetectorError, type Detector } from "./types";

async function buildForm(request: DetectRequest): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === "web") {
    // Web дээр бичлэг blob: URL байдаг. Файл болгож хавсаргана.
    const blob = await (await fetch(request.audioUri)).blob();
    form.append("audio", blob, "clip.webm");
  } else {
    // React Native-ийн FormData файлыг { uri, name, type } хэлбэрээр авдаг
    form.append("audio", { uri: request.audioUri, name: "clip.m4a", type: "audio/m4a" } as unknown as Blob);
  }
  form.append("mode", request.mode);
  if (request.ticket) form.append("ticket", request.ticket);
  if (request.name) form.append("name", request.name);
  return form;
}

async function postWithTimeout(url: string, body: FormData): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    return await fetch(url, { method: "POST", body, signal: controller.signal });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new DetectorError(aborted ? "TIMEOUT" : "NETWORK", String(error));
  } finally {
    clearTimeout(timer);
  }
}

export const serverDetector: Detector = {
  async detect(request) {
    if (!config.apiUrl) throw new DetectorError("NO_SERVER_URL", "EXPO_PUBLIC_API_URL is empty");
    const response = await postWithTimeout(`${config.apiUrl}/api/v1/detect`, await buildForm(request));
    if (!response.ok) throw new DetectorError("BAD_RESPONSE", `HTTP ${response.status}`);
    const result: DetectionResult | null = parseDetectionResult(await response.json());
    if (!result) throw new DetectorError("BAD_RESPONSE", "Response does not match the API contract");
    return result;
  },
};
