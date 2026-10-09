import { serverDetector } from "./serverDetector";
import type { Detector } from "./types";

// Дэлгэцүүд detector-ыг зөвхөн эндээс авна.
export const detector: Detector = serverDetector;

export { DetectorError } from "./types";
export type { Detector } from "./types";
