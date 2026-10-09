import { config } from "@/config";
import type { ErrorKind } from "@/lib/errors";

const HEALTH_TIMEOUT_MS = 8_000; // API contract: every request gives up after 8 s

export type HealthResult = "ok" | ErrorKind;

export async function checkHealth(): Promise<HealthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.apiUrl}/api/v1/health`, {
      signal: controller.signal,
    });
    return response.ok ? "ok" : "server";
  } catch {
    // fetch only throws when no answer arrived at all: offline or timed out.
    return "network";
  } finally {
    clearTimeout(timer);
  }
}
