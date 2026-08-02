import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { SessionContextResponse } from "./contracts";

export async function getAuthenticatedSession(signal?: AbortSignal): Promise<SessionContextResponse> {
  return apiRequest<SessionContextResponse>("/api/c2guard/v1/session", {
    method: "GET",
    signal,
  });
}

export async function endAuthenticatedSession(signal?: AbortSignal): Promise<void> {
  if (!apiConfig.authEnabled) return;

  await apiRequest<Record<string, never>>("/api/c2guard/v1/logout", {
    method: "POST",
    signal,
  });
}
