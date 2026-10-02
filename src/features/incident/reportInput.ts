export interface ManualIncidentContext {
  incidentType: string;
  facilityName: string;
  facilityAddress: string;
  observations: string[];
}

// Used only for manual reports. Approved phone transcripts must be sent verbatim.
export function composeManualReport(text: string, context: ManualIncidentContext): string {
  return [
    text.trim(),
    context.incidentType && `사고 유형: ${context.incidentType}`,
    context.facilityName.trim() && `시설명: ${context.facilityName.trim()}`,
    context.facilityAddress.trim() && `사고 위치: ${context.facilityAddress.trim()}`,
    context.observations.length > 0 && `현장 관찰: ${context.observations.join(", ")}`,
  ].filter(Boolean).join("\n");
}
