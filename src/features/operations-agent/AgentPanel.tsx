import { ChevronDown, CircleCheck, CircleDashed, Hammer, ListChecks, ShieldAlert } from "lucide-react";
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

export function AgentPanel({ agent }: { agent: OperationsAgentSnapshot | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!agent) {
    return <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">에이전트 상태를 기다리고 있습니다.</div>;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">현장대응 에이전트</p><h3 className="mt-1 text-sm font-bold">{PHASE_LABELS[agent.phase]}</h3></div>
          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">절차 조율</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{agent.currentObjective}</p>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><ListChecks size={12} /> 다음 확인 행동</p>
          <ol className="mt-2 space-y-2">{agent.nextActions.map((action, index) => <li key={action} className="flex gap-2 text-[11px] leading-relaxed"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</span><span>{action}</span></li>)}</ol>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><CircleCheck size={12} /> 업무 진행</p>
          <div className="mt-2 space-y-1.5">{agent.workflow.slice(0, 5).map((step) => <div key={step.stepId} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-2.5 py-2"><span className="truncate text-[10px] font-medium">{step.label}</span><span className={`shrink-0 text-[9px] font-semibold ${step.status === "COMPLETED" ? "text-emerald-600" : step.status === "IN_PROGRESS" ? "text-blue-600" : step.status === "BLOCKED" ? "text-accent" : "text-muted-foreground"}`}>{statusText[step.status]}</span></div>)}</div>
        </div>
      </div>

      <button onClick={() => setExpanded((value) => !value)} className="flex min-h-10 w-full items-center justify-between border-t border-border px-3 text-[11px] font-semibold hover:bg-muted" aria-expanded={expanded}>
        <span className="flex items-center gap-1.5"><Hammer size={12} /> 도구 실행·근거 기록</span><ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-border bg-secondary/40 p-3">
          {agent.toolExecutions.map((tool) => (
            <div key={`${tool.toolId}-${tool.outputReference}`} className="rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 font-mono text-[10px]"><CircleDashed size={10} />{tool.toolId}</span><span className="text-[9px] font-semibold text-muted-foreground">{statusText[tool.status]}</span></div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{tool.summary}</p>
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-[10px] leading-relaxed text-accent"><ShieldAlert size={12} className="mt-0.5 shrink-0" /> 도구 기록은 실행 결과 요약이며 내부 추론 과정이 아닙니다. 에이전트는 자율 위험 결정을 하지 않고 최종 판단은 {agent.finalDecisionAuthority}이 수행합니다.</div>
        </div>
      )}
    </section>
  );
}
