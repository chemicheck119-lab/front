import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { IncidentAnalyzeInput, IncidentAnalyzeRequest, IncidentAnalysisResponse } from "./contracts";
import { getDemoAnalysis } from "../fixtures/demo";

export function normalizeIncidentAnalyzeRequest(payload: IncidentAnalyzeInput): IncidentAnalyzeRequest {
  return { inputType: "MANUAL_TEXT", evidenceTopK: 5, ...payload };
}

export async function analyzeIncident(payload: IncidentAnalyzeInput): Promise<IncidentAnalysisResponse> {
  if (apiConfig.demoEnabled) return getDemoAnalysis(payload.incidentId ?? undefined);
  const request = normalizeIncidentAnalyzeRequest(payload);
  return apiRequest<IncidentAnalysisResponse>("/api/c2guard/v1/incidents/analyze", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
