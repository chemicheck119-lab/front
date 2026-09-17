const BASE_URL = (import.meta.env.VITE_BFF_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export type RecordSummary = {
  recordId: string;
  incidentId: string;
  facilityName: string;
  incidentSubstanceName: string;
  briefApplicationStatus: string;
  finalResponseOutcome: string;
  savedAt: string;
};

export type RecordConflictRisk = {
  analysisId: string;
  incidentCas: string;
  facilitySubstanceName: string;
  facilitySubstanceCas: string;
  ruleId: string;
  ruleVersion: string;
  severity: string;
  riskLevel: string;
  riskLevelKo: string;
  briefText: string;
  expertReviewed: boolean;
  humanConfirmationRequired: boolean;
  hazardCodes: string[];
  gasProducts: string[];
};

export type RecordMessage = {
  messageId: string;
  sequence: number;
  role: string;
  text: string;
  createdAt: string;
  analysisId: string | null;
};

export type RecordDetail = {
  recordId: string;
  incidentId: string;
  conversationStartedAt: string;
  savedAt: string;
  facilityName: string;
  facilityAddress: string;
  incidentSubstanceName: string;
  incidentSubstanceCas: string;
  briefApplicationStatus: string;
  performedActions: string[];
  additionalFactors: string[];
  finalResponseOutcome: string;
  conflictRisk: RecordConflictRisk | null;
  messages: RecordMessage[];
};

type RecordListResponse = {
  schemaVersion: string;
  requestId: string;
  records: RecordSummary[];
};

export class RecordApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RecordApiError";
  }
}

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  } catch {
    throw new RecordApiError("BFF 서버에 연결할 수 없습니다.");
  }
  if (!response.ok) {
    if (response.status === 401) {
      throw new RecordApiError("로그인 세션이 만료되었거나 인증이 필요합니다.", 401);
    }
    throw new RecordApiError(`기록을 불러오지 못했습니다. (HTTP ${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

export async function fetchRecords(): Promise<RecordSummary[]> {
  const body = await getJson<RecordListResponse>("/api/c2guard/v1/records");
  return body.records;
}

export function fetchRecordDetail(recordId: string): Promise<RecordDetail> {
  return getJson<RecordDetail>(`/api/c2guard/v1/records/${encodeURIComponent(recordId)}`);
}
