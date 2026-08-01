import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { IncidentAnalyzeRequest, IncidentAnalysisResponse } from "./contracts";
import { getDemoAnalysis } from "../fixtures/demo";

export async function analyzeIncident(payload: IncidentAnalyzeRequest): Promise<IncidentAnalysisResponse> {
  if (apiConfig.demoEnabled) return getDemoAnalysis(payload.incidentId ?? undefined);
  return apiRequest<IncidentAnalysisResponse>("/api/c2guard/v1/incidents/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
