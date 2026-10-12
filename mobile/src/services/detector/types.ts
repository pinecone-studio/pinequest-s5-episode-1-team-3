import type { DetectionResult, DetectRequest } from "@/lib/types";

// Дэлгэцүүд зөвхөн энэ интерфэйсийг мэднэ. Дараа нь утсан дээрх YAMNet-ийг энд холбоно.
export interface Detector {
  detect(request: DetectRequest): Promise<DetectionResult>;
}

export type DetectorErrorCode = "NO_SERVER_URL" | "NETWORK" | "TIMEOUT" | "BAD_RESPONSE";

export class DetectorError extends Error {
  constructor(
    public readonly code: DetectorErrorCode,
    message: string,
  ) {
    super(message);
  }
}
