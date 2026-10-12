import { z } from "zod";

export const talkTranscriptSchema = z.object({ text: z.string().max(2_000) });
export const RECORDING_SECONDS = 8;
export const MAX_RECORDING_BYTES = 1_000_000;
