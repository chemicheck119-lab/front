import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { RecordSaveRequest, RecordSaveResponse } from "./contracts";
import { makeDemoRecord, resetDemoSession } from "../fixtures/demo";

export async function saveIncidentRecord(incidentId: string, payload: RecordSaveRequest): Promise<RecordSaveResponse> {
  if (apiConfig.demoEnabled) {
    const response = makeDemoRecord();
    resetDemoSession();
    return response;
  }
  return apiRequest<RecordSaveResponse>(`/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/record`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function shouldResetAfterSave(response: Pick<RecordSaveResponse, "resetAllowed">): boolean {
  return response.resetAllowed === true;
}
