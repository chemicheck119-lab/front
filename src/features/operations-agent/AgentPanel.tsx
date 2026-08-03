import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Hammer,
  ListChecks,
  LoaderCircle,
  MinusCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
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
  IN_PROGRESS: "진행 중",
  WAITING: "대기",
  BLOCKED: "확인 필요",
  NOT_APPLICABLE: "해당 없음",
  FALLBACK: "대체 절차",
  NOT_RUN: "실행 안 됨",
  UNAVAILABLE: "사용 불가",
};

type MilestoneStatus = "COMPLETED" | "IN_PROGRESS" | "BLOCKED" | "WAITING";
type WorkflowStep = OperationsAgentSnapshot["workflow"][number];

const loadingWorkflow: WorkflowStep[] = [
  {
    stepId: "CLIENT_REQUEST",
    label: "신고 내용 접수",
    status: "COMPLETED",
    detail: "입력한 신고문·시설·현장 컨텍스트를 BFF 요청에 포함했습니다.",
  },
  {
    stepId: "ANALYSIS_REQUEST",
    label: "사고 유형·물질 후보 분석",
    status: "IN_PROGRESS",
    detail: "BFF와 AI 분석 서버의 검증된 응답을 기다리고 있습니다.",
  },
  {
    stepId: "FACILITY_HISTORY",
    label: "시설 과거 이력 조회",
    status: "WAITING",
    detail: "시설의 공개 취급물질 이력을 확인합니다.",
  },
  {
    stepId: "SUBSTANCE_RESOLUTION",
    label: "물질 후보·공식 근거 탐색",
    status: "WAITING",
    detail: "CAS 후보와 KOSHA·CAMEO 근거를 조회합니다.",
  },
  {
    stepId: "CONFIRMATION_GATE",
    label: "현장 확인 게이트 점검",
    status: "WAITING",
    detail: "확인된 사고물질·시설물질만 규칙 입력으로 사용합니다.",
  },
  {
    stepId: "CONFLICT_SCREENING",
    label: "RuleEngine 실행 조건 검사",
    status: "WAITING",
    detail: "두 CAS 확인 전에는 충돌 등급을 실행하지 않습니다.",
  },
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

function visibleWorkflow(
  agent: OperationsAgentSnapshot | null | undefined,
  loading: boolean,
  syntheticMode: boolean,
) {
  if (!agent) return loading ? loadingWorkflow : [];
  return agent.workflow.map((step) => step.stepId === "ON_SITE_CONFIRMATION" && syntheticMode
    ? { ...step, label: "합성 확인 게이트", detail: "공개 합성 시나리오의 2단계 확인 상태입니다." }
    : step);
}

function statusTone(status: WorkflowStep["status"]) {
  if (status === "COMPLETED") return "text-emerald-700 dark:text-emerald-300";
  if (status === "IN_PROGRESS") return "text-blue-700 dark:text-blue-300";
  if (status === "BLOCKED") return "text-amber-700 dark:text-amber-300";
  return "text-muted-foreground";
}

function connectorTone(status: WorkflowStep["status"]) {
  return status === "COMPLETED" ? "bg-emerald-400/70" : "bg-border";
}

function StepIcon({ status }: { status: WorkflowStep["status"] }) {
  if (status === "COMPLETED") {
    return <CircleCheck size={19} className="text-emerald-600 dark:text-emerald-400" />;
  }
  if (status === "IN_PROGRESS") {
    return <LoaderCircle size={18} className="animate-spin text-blue-600 dark:text-blue-400" />;
  }
  if (status === "BLOCKED") {
    return <CircleAlert size={18} className="text-amber-600 dark:text-amber-400" />;
  }
  if (status === "NOT_APPLICABLE") {
    return <MinusCircle size={18} className="text-muted-foreground" />;
  }
  return <CircleDashed size={18} className="text-muted-foreground" />;
}

export function AgentPanel({
  agent,
  syntheticMode = false,
  loading = false,
}: {
  agent: OperationsAgentSnapshot | null | undefined;
  syntheticMode?: boolean;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!agent && !loading) {
    return <div className="rounded-xl border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground">에이전트 상태를 기다리고 있습니다.</div>;
  }

  const workflow = visibleWorkflow(agent, loading, syntheticMode);
  const objective = agent?.currentObjective
    ?? "신고·시설 정보를 받아 안전 게이트와 공식 근거를 순서대로 점검합니다.";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/80" aria-label="에이전트 진행 현황">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm" aria-hidden="true"><Sparkles size={16} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{syntheticMode ? "통합 데모 에이전트" : "현장대응 에이전트"}</p>
              <h3 className="mt-1 text-sm font-black">{agent ? PHASE_LABELS[agent.phase] : "분석 요청 처리"}</h3>
            </div>
          </div>
          <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${loading ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`} role="status" aria-live="polite">
            {loading ? <LoaderCircle size={12} className="animate-spin" /> : <CircleCheck size={12} />}
            {loading ? "서버 검증 중" : "최신 단계 반영"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{objective}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">내부 추론 원문이 아니라 서버가 실제로 완료·대기·차단한 업무 단계만 표시합니다.</p>
      </div>

      <ol className="px-4 py-3" aria-label="에이전트 작업 진행">
        {workflow.map((step, index) => (
          <li key={step.stepId} className="relative flex gap-3 pb-3 last:pb-0">
            {index < workflow.length - 1 && <span className={`absolute left-[9px] top-5 h-[calc(100%-0.25rem)] w-px ${connectorTone(step.status)}`} aria-hidden="true" />}
            <span className="relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-50 dark:bg-slate-900" aria-hidden="true"><StepIcon status={step.status} /></span>
            <div className="min-w-0 flex-1 pt-px">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs font-bold ${statusTone(step.status)}`}>{step.label}</p>
                <span className={`shrink-0 text-[10px] font-bold ${statusTone(step.status)}`}>{statusText[step.status]}</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      {agent && (
        <>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="flex min-h-10 w-full items-center justify-between border-t border-slate-200 bg-white/55 px-4 text-xs font-semibold hover:bg-white dark:border-slate-700 dark:bg-slate-950/30 dark:hover:bg-slate-950/60" aria-expanded={expanded}>
            <span className="flex items-center gap-1.5"><Hammer size={12} /> 다음 행동·도구 실행 기록</span><ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <div className="space-y-3 border-t border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-950/35">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><ListChecks size={12} /> 다음 확인 행동</p>
                <ol className="mt-2 space-y-2">{agent.nextActions.map((action, index) => <li key={action} className="flex gap-2 text-xs leading-relaxed"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</span><span>{action}</span></li>)}</ol>
              </div>
              <div className="space-y-1.5">
                {agent.toolExecutions.map((tool) => (
                  <div key={`${tool.toolId}-${tool.outputReference}`} className="rounded-lg border border-border bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 font-mono text-[10px]"><CircleDashed size={10} />{tool.toolId}</span><span className="text-[10px] font-semibold text-muted-foreground">{statusText[tool.status]}</span></div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{tool.summary}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-[10px] leading-relaxed text-accent"><ShieldAlert size={12} className="mt-0.5 shrink-0" /> 도구 기록은 실행 결과 요약이며 내부 추론 과정이 아닙니다. 에이전트는 자율 위험 결정을 하지 않고 최종 판단은 {agent.finalDecisionAuthority}이 수행합니다.</div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
