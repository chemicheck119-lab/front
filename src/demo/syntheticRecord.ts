import type { IncidentReplayEnvelope } from "../api/intake";
import type { FieldRecordMessage } from "../features/field-tools/FieldToolsPanel";

export interface PublicSyntheticRecordExport {
  schemaVersion: "chemicheck119-public-synthetic-record-v1";
  dataClassification: "PUBLIC_SYNTHETIC";
  operationalRecord: false;
  disclosure: string;
  generatedAt: string;
  incident: Pick<IncidentReplayEnvelope,
    "incidentId" | "sourceEventId" | "facilityName" | "addressText" | "reportText" | "receivedAt">;
  messages: FieldRecordMessage[];
  analysisIds: string[];
  confirmationIds: string[];
}

export function buildPublicSyntheticRecord(
  replay: IncidentReplayEnvelope,
  messages: FieldRecordMessage[],
  analysisIds: string[],
  confirmationIds: string[],
  generatedAt = new Date().toISOString(),
): PublicSyntheticRecordExport {
  return {
    schemaVersion: "chemicheck119-public-synthetic-record-v1",
    dataClassification: "PUBLIC_SYNTHETIC",
    operationalRecord: false,
    disclosure: "공개 합성 시연 기록입니다. 실제 119 신고·대원 확인·운영 기록이 아니며 서버에 저장되지 않습니다.",
    generatedAt,
    incident: {
      incidentId: replay.incidentId,
      sourceEventId: replay.sourceEventId,
      facilityName: replay.facilityName,
      addressText: replay.addressText,
      reportText: replay.reportText,
      receivedAt: replay.receivedAt,
    },
    messages,
    analysisIds: [...analysisIds],
    confirmationIds: [...confirmationIds],
  };
}

export function publicSyntheticRecordFileName(incidentId: string) {
  const safeIncidentId = incidentId.replace(/[^A-Za-z0-9_-]/g, "-");
  return `chemicheck119-${safeIncidentId}-public-synthetic.json`;
}
