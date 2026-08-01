import type { IncidentAnalysisResponse } from "../../api/contracts";

export function canShowRisk(analysis: IncidentAnalysisResponse | null): boolean {
  return Boolean(
    analysis
    && analysis.state === "SCREENING_COMPLETED"
    && analysis.confirmationGate.allRequiredConfirmed
    && analysis.confirmationGate.ruleExecutionAllowed
    && analysis.conflictReview.executed
    && analysis.conflictReview.status === "SCREENING_COMPLETED"
    && analysis.conflictReview.riskDisplayAllowed,
  );
}

export function analysisStateLabel(state?: IncidentAnalysisResponse["state"]): string {
  const labels: Record<IncidentAnalysisResponse["state"], string> = {
    AWAITING_SUBSTANCE_CONFIRMATION: "물질 확인 대기",
    AWAITING_INCIDENT_CONFIRMATION: "사고물질 확인 대기",
    AWAITING_FACILITY_CONFIRMATION: "시설물질 확인 대기",
    SCREENING_COMPLETED: "충돌 검토 완료",
    VERIFY_REQUIRED: "추가 검증 필요",
    UNCLASSIFIED: "공개 근거 부족",
    CAMEO_GROUP_SCREENING_ONLY: "그룹 검토만 가능",
  };
  return state ? labels[state] : "신고 접수 대기";
}
