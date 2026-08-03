import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { ConfirmationRequest, ConfirmationResponse } from "./contracts";
import { makeDemoConfirmation } from "../fixtures/demo";

export async function confirmSubstance(incidentId: string, payload: ConfirmationRequest, signal?: AbortSignal): Promise<ConfirmationResponse> {
  if (apiConfig.demoEnabled) return makeDemoConfirmation(payload.role, payload.casNumber);
  return apiRequest<ConfirmationResponse>(`/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/confirmations`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}
