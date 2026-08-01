import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { MovementUpdateRequest, MovementUpdateResponse } from "./contracts";
import { makeDemoMovement } from "../fixtures/demo";

export async function updateMovement(incidentId: string, payload: MovementUpdateRequest): Promise<MovementUpdateResponse> {
  if (apiConfig.demoEnabled) return makeDemoMovement(payload.clientSequence);
  return apiRequest<MovementUpdateResponse>(`/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/movement`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
