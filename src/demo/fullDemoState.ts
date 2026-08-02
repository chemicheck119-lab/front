export type FullDemoStatus =
  | "IDLE"
  | "RECEIVING"
  | "INITIAL_ANALYSIS"
  | "INCIDENT_CONFIRMATION"
  | "INCIDENT_REANALYSIS"
  | "FACILITY_CONFIRMATION"
  | "FINAL_ANALYSIS"
  | "COMPLETED"
  | "ERROR";

export type FullDemoStepState = "PENDING" | "ACTIVE" | "COMPLETED" | "ERROR";

export interface FullDemoStep {
  id: "REPLAY" | "AI_CANDIDATES" | "INCIDENT_CONFIRM" | "FACILITY_CONFIRM" | "CAMEO";
  label: string;
  detail: string;
  state: FullDemoStepState;
}

const STEP_ORDER: FullDemoStep["id"][] = [
  "REPLAY",
  "AI_CANDIDATES",
  "INCIDENT_CONFIRM",
  "FACILITY_CONFIRM",
  "CAMEO",
];

const ACTIVE_STEP: Partial<Record<FullDemoStatus, FullDemoStep["id"]>> = {
  RECEIVING: "REPLAY",
  INITIAL_ANALYSIS: "AI_CANDIDATES",
  INCIDENT_CONFIRMATION: "INCIDENT_CONFIRM",
  INCIDENT_REANALYSIS: "INCIDENT_CONFIRM",
  FACILITY_CONFIRMATION: "FACILITY_CONFIRM",
  FINAL_ANALYSIS: "CAMEO",
};

const COPY: Record<FullDemoStep["id"], Pick<FullDemoStep, "label" | "detail">> = {
  REPLAY: { label: "합성 지령", detail: "BE SSE" },
  AI_CANDIDATES: { label: "AI 후보", detail: "필수 CAS 0/2" },
  INCIDENT_CONFIRM: { label: "사고물질", detail: "합성 확인 1/2" },
  FACILITY_CONFIRM: { label: "시설물질", detail: "합성 확인 2/2" },
  CAMEO: { label: "CAMEO", detail: "실제 규칙 실행" },
};

export function isFullDemoRunning(status: FullDemoStatus) {
  return !["IDLE", "COMPLETED", "ERROR"].includes(status);
}

export function fullDemoStatusLabel(status: FullDemoStatus) {
  return {
    IDLE: "시연 대기",
    RECEIVING: "공개 합성 지령 수신 중",
    INITIAL_ANALYSIS: "실제 AI 후보 분석 중",
    INCIDENT_CONFIRMATION: "합성 사고물질 확인 중",
    INCIDENT_REANALYSIS: "확인 1/2 재분석 중",
    FACILITY_CONFIRMATION: "합성 시설물질 확인 중",
    FINAL_ANALYSIS: "확인 2/2 CAMEO 검토 중",
    COMPLETED: "완성형 시연 완료",
    ERROR: "시연 중단",
  }[status];
}

export function fullDemoSteps(
  status: FullDemoStatus,
  failedAt: FullDemoStatus = "RECEIVING",
): FullDemoStep[] {
  const active = ACTIVE_STEP[status === "ERROR" ? failedAt : status];
  const activeIndex = active ? STEP_ORDER.indexOf(active) : -1;
  return STEP_ORDER.map((id, index) => {
    let state: FullDemoStepState = "PENDING";
    if (status === "COMPLETED") state = "COMPLETED";
    else if (status === "ERROR" && index === Math.max(0, activeIndex)) state = "ERROR";
    else if (status === "ERROR" && index < activeIndex) state = "COMPLETED";
    else if (active && index < activeIndex) state = "COMPLETED";
    else if (id === active) state = "ACTIVE";
    return { id, ...COPY[id], state };
  });
}
