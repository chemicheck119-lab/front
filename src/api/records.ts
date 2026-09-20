import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { RecordDetailResponse, RecordListResponse, RecordSaveRequest, RecordSaveResponse, RecordSummary } from "./contracts";
import { makeDemoRecord, makeDemoRecordDetail, makeDemoRecordList, resetDemoSession } from "../fixtures/demo";

export async function saveIncidentRecord(incidentId: string, payload: RecordSaveRequest, signal?: AbortSignal): Promise<RecordSaveResponse> {
  if (apiConfig.demoEnabled) {
    const response = makeDemoRecord();
    resetDemoSession();
    return response;
  }
  return apiRequest<RecordSaveResponse>(`/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/record`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export function shouldResetAfterSave(response: Pick<RecordSaveResponse, "resetAllowed">): boolean {
  return response.resetAllowed === true;
}

export async function listIncidentRecords(signal?: AbortSignal): Promise<RecordSummary[]> {
  if (apiConfig.demoEnabled) return makeDemoRecordList();
  const response = await apiRequest<RecordListResponse>("/api/c2guard/v1/records", { method: "GET", signal });
  return response.records;
}

export async function getIncidentRecord(recordId: string, signal?: AbortSignal): Promise<RecordDetailResponse> {
  if (apiConfig.demoEnabled) return makeDemoRecordDetail(recordId);
  return apiRequest<RecordDetailResponse>(`/api/c2guard/v1/records/${encodeURIComponent(recordId)}`, { method: "GET", signal });
}
