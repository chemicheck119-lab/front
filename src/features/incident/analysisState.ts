import type { IncidentAnalysisResponse } from "../../api/contracts";

export type ConfirmationWorkflowStatus = "COMPLETED" | "CURRENT" | "LOCKED";

export interface ConfirmationWorkflowStep {
  id: "INCIDENT" | "FACILITY" | "REVIEW";
  label: string;
  status: ConfirmationWorkflowStatus;
  detail: string;
}

export function canShowRisk(analysis: IncidentAnalysisResponse | null): boolean {
  return Boolean(
    analysis
    && analysis.state === "SCREENING_COMPLETED"
    && analysis.riskDisplayAllowed === true
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

export function getConfirmationWorkflow(
  analysis: IncidentAnalysisResponse,
  confirmationMode: "FIELD" | "PUBLIC_SYNTHETIC" = "FIELD",
): ConfirmationWorkflowStep[] {
  const incidentConfirmed = analysis.confirmationGate.incidentConfirmed;
  const facilityConfirmed = analysis.confirmationGate.facilityConfirmed;
  const reviewCompleted = analysis.conflictReview.executed && analysis.conflictReview.status === "SCREENING_COMPLETED";
  const completedDetail = confirmationMode === "PUBLIC_SYNTHETIC" ? "합성 확인 완료" : "현장 확인됨";

  return [
    {
      id: "INCIDENT",
      label: "사고물질",
      status: incidentConfirmed ? "COMPLETED" : "CURRENT",
      detail: incidentConfirmed ? completedDetail : confirmationMode === "PUBLIC_SYNTHETIC" ? "합성 확인 대기" : "라벨·MSDS 확인",
    },
    {
      id: "FACILITY",
      label: "시설물질",
      status: facilityConfirmed ? "COMPLETED" : "CURRENT",
      detail: facilityConfirmed ? completedDetail : confirmationMode === "PUBLIC_SYNTHETIC" ? "합성 확인 대기" : "현재 존재 확인",
    },
    {
      id: "REVIEW",
      label: "충돌검토",
      status: reviewCompleted ? "COMPLETED" : incidentConfirmed && facilityConfirmed ? "CURRENT" : "LOCKED",
      detail: reviewCompleted ? "공개 규칙 완료" : incidentConfirmed && facilityConfirmed ? "재분석 중" : "두 CAS 확인 후",
    },
  ];
}
