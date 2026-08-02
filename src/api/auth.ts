import { apiConfig } from "./config";
import { apiRequest } from "./client";

export async function endAuthenticatedSession(): Promise<void> {
  if (!apiConfig.authEnabled) return;

  await apiRequest<Record<string, never>>("/api/c2guard/v1/logout", {
    method: "POST",
  });
}
