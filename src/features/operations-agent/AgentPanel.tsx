import { ChevronDown, CircleCheck, CircleDashed, Hammer, ListChecks, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import type { OperationsAgentSnapshot } from "../../api/contracts";

export const PHASE_LABELS: Record<OperationsAgentSnapshot["phase"], string> = {
  INCIDENT_INTAKE: "신고 접수",
  EN_ROUTE_TRIAGE: "출동 중 사전 분석",
  ON_SCENE_CONFIRMATION: "현장 물질 확인",
  CONFLICT_SCREENING_COMPLETE: "충돌 검토 완료",
  EVIDENCE_REVIEW_REQUIRED: "근거 추가 검토",
};

const statusText: Record<string, string> = {
  COMPLETED: "완료",
  IN_PROGRESS: "수행 중",
  WAITING: "대기",
  BLOCKED: "확인 필요",
  NOT_APPLICABLE: "해당 없음",
  FALLBACK: "대체 절차",
  NOT_RUN: "실행 안 됨",
  UNAVAILABLE: "사용 불가",
};

type MilestoneStatus = "COMPLETED" | "IN_PROGRESS" | "BLOCKED" | "WAITING";

const LOADING_WORKFLOW: OperationsAgentSnapshot["workflow"] = [
  { stepId: "CLIENT_REQUEST", label: "신고 내용 접수", status: "COMPLETED", detail: "입력한 신고문과 현장 정보를 분석 요청에 포함했습니다." },
  { stepId: "ANALYSIS_REQUEST", label: "사고 유형·물질 후보 분석", status: "IN_PROGRESS", detail: "BFF와 AI 분석 서버의 응답을 기다리고 있습니다." },
  { stepId: "FACILITY_HISTORY", label: "시설 과거 취급 이력 확인", status: "WAITING", detail: "응답에 포함된 공식 데이터 근거를 확인할 예정입니다." },
  { stepId: "CONFIRMATION_GATE", label: "현장 확인 게이트 점검", status: "WAITING", detail: "확인되지 않은 후보로 충돌 규칙을 실행하지 않는지 점검합니다." },
  { stepId: "RESPONSE_GROUNDING", label: "충돌 규칙·대응 근거 정리", status: "WAITING", detail: "검증된 결과가 도착하면 대응 카드로 정리합니다." },
];

export function getAgentMilestones(agent: OperationsAgentSnapshot, syntheticMode = false) {
  const definitions = [
    { id: "INCIDENT_PARSING", fallbackId: "INCIDENT_INGESTION", label: "신고 분석" },
    { id: "SUBSTANCE_RESOLUTION", label: "후보 탐색" },
    { id: "ON_SITE_CONFIRMATION", label: syntheticMode ? "합성 확인" : "현장 확인" },
    { id: "CONFLICT_SCREENING", label: "충돌 검토" },
  ];

  return definitions.map((definition) => {
    const step = agent.workflow.find((item) => item.stepId === definition.id)
      ?? agent.workflow.find((item) => item.stepId === definition.fallbackId);
    const status: MilestoneStatus = step?.status === "COMPLETED"
      ? "COMPLETED"
      : step?.status === "IN_PROGRESS"
        ? "IN_PROGRESS"
        : step?.status === "BLOCKED"
          ? "BLOCKED"
          : "WAITING";
    return { ...definition, status };
  });
}

function progressTone(status: OperationsAgentSnapshot["workflow"][number]["status"]) {
  if (status === "COMPLETED") return "text-emerald-700 dark:text-emerald-300";
  if (status === "IN_PROGRESS") return "text-blue-700 dark:text-blue-300";
  if (status === "BLOCKED") return "text-amber-700 dark:text-amber-300";
  return "text-muted-foreground";
}

function ProgressIcon({ status }: { status: OperationsAgentSnapshot["workflow"][number]["status"] }) {
  if (status === "COMPLETED") return <CircleCheck size={20} />;
  if (status === "IN_PROGRESS") return <LoaderCircle size={20} className="animate-spin" />;
  if (status === "BLOCKED") return <ShieldAlert size={20} />;
  return <CircleDashed size={20} />;
}

export function AgentPanel({ agent, syntheticMode = false, loading = false }: { agent: OperationsAgentSnapshot | null | undefined; syntheticMode?: boolean; loading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!agent && !loading) {
    return <div className="rounded-xl border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground">에이전트 상태를 기다리고 있습니다.</div>;
  }

  const progressSteps = (loading ? LOADING_WORKFLOW : agent!.workflow).map((step) => (
    syntheticMode && step.stepId === "ON_SITE_CONFIRMATION"
      ? { ...step, label: "공개 합성 확인", detail: "QA용 공개 합성 확인 상태를 점검합니다. 실제 대원 확인 기록이 아닙니다." }
      : step
  ));
  const title = loading ? "현장대응 분석 중" : PHASE_LABELS[agent!.phase];
  const objective = loading
    ? "신고문과 현장 정보를 바탕으로 후보·확인 게이트·공식 근거를 순서대로 점검합니다."
    : agent!.currentObjective;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-live={loading ? "polite" : undefined}>
      <header className="border-b border-border bg-secondary/35 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm"><Sparkles size={19} /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{syntheticMode ? "통합 데모 에이전트" : "현장대응 에이전트"}</p>
              <h3 className="mt-1 text-base font-black">{title}</h3>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${loading ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>{loading ? "응답 대기" : "상태 확인"}</span>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{objective}</p>
      </header>

      <div className="p-4">
        <p className="text-xs font-bold text-muted-foreground">작업 진행</p>
        <ol className="mt-3" aria-label="에이전트 작업 진행">
          {progressSteps.map((step, index) => (
            <li key={step.stepId} className="relative flex gap-3 pb-4 last:pb-0">
              {index < progressSteps.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px ${step.status === "COMPLETED" ? "bg-emerald-400" : "bg-border"}`} aria-hidden="true" />}
              <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center bg-card ${progressTone(step.status)}`} aria-hidden="true"><ProgressIcon status={step.status} /></span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-[13px] font-bold ${progressTone(step.status)}`}>{step.label}</p>
                  <span className={`shrink-0 text-[11px] font-bold ${progressTone(step.status)}`}>{statusText[step.status]}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        {loading && <p className="mt-4 rounded-xl bg-blue-500/8 px-3 py-2.5 text-[11px] leading-5 text-blue-700 dark:text-blue-300">표시된 진행 순서는 요청 처리 단계이며 내부 추론 내용이 아닙니다. 서버 응답 후 실제 완료·대기·확인 필요 상태로 갱신됩니다.</p>}
      </div>

      {agent && !loading && <div className="border-t border-border p-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><ListChecks size={12} /> 다음 확인 행동</p>
          <ol className="mt-2 space-y-2">{agent.nextActions.map((action, index) => <li key={action} className="flex gap-2 text-[13px] leading-relaxed"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><span>{action}</span></li>)}</ol>
        </div>
      </div>}

      {agent && !loading && <button type="button" onClick={() => setExpanded((value) => !value)} className="flex min-h-11 w-full items-center justify-between border-t border-border px-4 text-[13px] font-semibold hover:bg-muted" aria-expanded={expanded}>
        <span className="flex items-center gap-1.5"><Hammer size={12} /> 도구 실행·근거 기록</span><ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>}
      {agent && !loading && expanded && (
        <div className="space-y-2 border-t border-border bg-secondary/40 p-3">
          {agent.toolExecutions.map((tool) => (
            <div key={`${tool.toolId}-${tool.outputReference}`} className="rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 font-mono text-xs"><CircleDashed size={10} />{tool.toolId}</span><span className="text-xs font-semibold text-muted-foreground">{statusText[tool.status]}</span></div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.summary}</p>
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-xs leading-relaxed text-accent"><ShieldAlert size={12} className="mt-0.5 shrink-0" /> 도구 기록은 실행 결과 요약이며 내부 추론 과정이 아닙니다. 에이전트는 자율 위험 결정을 하지 않고 최종 판단은 {agent.finalDecisionAuthority}이 수행합니다.</div>
        </div>
      )}
    </section>
  );
}
