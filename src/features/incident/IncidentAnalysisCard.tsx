import { AlertTriangle, CheckCircle2, ExternalLink, History, LockKeyhole, ShieldCheck } from "lucide-react";
import type { EvidenceCard, IncidentAnalysisResponse } from "../../api/contracts";
import { GroundedEvidenceAccordion } from "./GroundedEvidenceAccordion";
import { analysisStateLabel, canShowRisk, getConfirmationWorkflow, type ConfirmationWorkflowStatus } from "./analysisState";

interface IncidentAnalysisCardProps {
  analysis: IncidentAnalysisResponse | null;
  onConfirm: (role: "INCIDENT" | "FACILITY", casNumber: string, displayName: string) => void;
  confirmingRole: "INCIDENT" | "FACILITY" | null;
}

const roleLabel = (role: "INCIDENT" | "FACILITY" | "UNKNOWN") => role === "INCIDENT" ? "사고물질" : role === "FACILITY" ? "시설물질" : "물질 후보";

const resolverLabel = (status: string) => ({
  EXACT_ALIAS_CANDIDATE: "이름·별칭 일치",
  CAS_EXACT_CANDIDATE: "CAS 일치",
  MULTIPLE_CANDIDATES: "복수 후보",
}[status] ?? "신고 표현 기반 후보");

const stateGuidance: Partial<Record<IncidentAnalysisResponse["state"], string>> = {
  VERIFY_REQUIRED: "확인된 CAS의 공개 매핑을 원문에서 추가 검증해야 합니다. 임의 위험등급을 표시하지 않습니다.",
  UNCLASSIFIED: "현재 공개 규칙에 결과가 없습니다. 이는 안전하다는 뜻이 아니며 현장 MSDS와 지휘관 판단이 필요합니다.",
  CAMEO_GROUP_SCREENING_ONLY: "반응성 그룹 수준의 보조 결과입니다. 개별 물질의 확정 판정으로 사용하지 마세요.",
};

function EvidenceLinks({ evidence }: { evidence: EvidenceCard[] }) {
  if (evidence.length === 0) {
    return <p className="mt-2 rounded-lg bg-accent/10 p-2 text-[10px] leading-relaxed text-accent">연결된 공식 근거가 없습니다. 현장 제품의 원문 MSDS를 직접 확인해주세요.</p>;
  }

  return (
    <div className="mt-2 space-y-1.5">
      {evidence.map((item) => (
        <a key={item.evidenceId} href={item.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-secondary/45 p-2 hover:bg-muted">
          <span className="flex items-center justify-between gap-2 text-[10px] font-semibold"><span className="truncate">{item.title}</span><ExternalLink size={10} className="shrink-0" /></span>
          <span className="mt-1 line-clamp-2 block text-[9px] leading-relaxed text-muted-foreground">{item.bodyPreview}</span>
        </a>
      ))}
    </div>
  );
}

function ConfirmationButton({ role, casNumber, displayName, confirmingRole, onConfirm, label }: {
  role: "INCIDENT" | "FACILITY";
  casNumber: string;
  displayName: string;
  confirmingRole: "INCIDENT" | "FACILITY" | null;
  onConfirm: IncidentAnalysisCardProps["onConfirm"];
  label?: string;
}) {
  return (
    <button
      data-testid={`confirm-${role}`}
      className="min-h-10 shrink-0 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-50"
      disabled={confirmingRole !== null}
      onClick={() => onConfirm(role, casNumber, displayName)}
    >
      {confirmingRole === role ? "확인 기록 중…" : label ?? `${roleLabel(role)} 현장 확인`}
    </button>
  );
}

const confirmationStepStyle: Record<ConfirmationWorkflowStatus, string> = {
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  CURRENT: "border-primary/35 bg-primary/5 text-primary",
  LOCKED: "border-border bg-muted/45 text-muted-foreground",
};

function ConfirmationWorkflow({ analysis }: { analysis: IncidentAnalysisResponse }) {
  const steps = getConfirmationWorkflow(analysis);
  const confirmedCount = Number(analysis.confirmationGate.incidentConfirmed) + Number(analysis.confirmationGate.facilityConfirmed);

  return (
    <section className="border-b border-border bg-card px-3 py-2.5" aria-label="현장 확인 3단계">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold">현장 확인 진행</p>
        <p className="text-[10px] font-semibold text-muted-foreground">필수 CAS {confirmedCount}/2 확인</p>
      </div>
      <ol className="grid grid-cols-3 gap-1.5">
        {steps.map((step, index) => (
          <li key={step.id} className={`min-w-0 rounded-lg border px-2 py-2 ${confirmationStepStyle[step.status]}`}>
            <div className="flex items-center gap-1.5">
              {step.status === "COMPLETED" ? <CheckCircle2 size={12} className="shrink-0" /> : step.status === "LOCKED" ? <LockKeyhole size={11} className="shrink-0" /> : <span className="grid h-3 w-3 shrink-0 place-items-center rounded-full bg-current text-[8px] font-bold text-white dark:text-slate-950">{index + 1}</span>}
              <span className="truncate text-[10px] font-bold">{step.label}</span>
            </div>
            <p className="mt-1 truncate text-[9px] opacity-80">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function IncidentAnalysisCard({ analysis, onConfirm, confirmingRole }: IncidentAnalysisCardProps) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center">
        <ShieldCheck className="mx-auto text-muted-foreground" size={24} />
        <p className="mt-2 text-xs font-semibold">대응충돌검토 대기</p>
        <p className="mt-1 text-[11px] text-muted-foreground">신고 내용을 입력하면 물질 후보와 필요한 확인 행동을 정리합니다.</p>
      </div>
    );
  }

  const riskVisible = canShowRisk(analysis);
  const completed = riskVisible && analysis.conflictReview.executed && analysis.conflictReview.status === "SCREENING_COMPLETED"
    ? analysis.conflictReview.result
    : null;
  const stateMessage = stateGuidance[analysis.state];

  return (
    <div className="space-y-3">
      <article className="overflow-hidden rounded-xl border border-border bg-secondary/45">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
          <div className="flex items-center gap-2">
            {riskVisible ? <CheckCircle2 size={15} className="text-emerald-600" /> : <LockKeyhole size={14} className="text-accent" />}
            <div><p className="text-xs font-semibold">{analysisStateLabel(analysis.state)}</p><p className="text-[10px] text-muted-foreground">분석 ID {analysis.analysisId}</p></div>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${riskVisible ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-accent/10 text-accent"}`}>
            충돌 규칙 {analysis.conflictReview.executed ? "실행됨" : "잠김"}
          </span>
        </header>

        <ConfirmationWorkflow analysis={analysis} />

        {!riskVisible && (
          <div className="border-b border-border bg-accent/5 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent"><AlertTriangle size={12} /> {stateMessage ? analysisStateLabel(analysis.state) : "현장 확인이 필요한 정상 업무 단계입니다."}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{stateMessage ?? "후보 검색만으로 위험을 확정하지 않습니다. 두 CAS가 확인될 때까지 화학 충돌 등급과 대응 권고를 표시하지 않습니다."}</p>
          </div>
        )}

        <section className="space-y-2 p-3" aria-label="신고 물질 후보">
          {analysis.substanceCandidates.length === 0 && <p className="rounded-lg bg-card p-3 text-[11px] text-muted-foreground">식별 가능한 물질 후보가 없습니다. 라벨·MSDS·운송 문서를 확인해주세요.</p>}
          {analysis.substanceCandidates.map((item) => {
            const confirmed = item.role === "INCIDENT" ? analysis.confirmationGate.incidentConfirmed : item.role === "FACILITY" ? analysis.confirmationGate.facilityConfirmed : false;
            return (
              <div key={`${item.role}-${item.surfaceText}`} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5"><p className="text-[10px] text-muted-foreground">{roleLabel(item.role)} · {resolverLabel(item.resolverStatus)}</p><span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">AI 확정 아님</span></div>
                    <p className="mt-1 text-xs font-semibold">{item.surfaceText}</p>
                  </div>
                  {confirmed && <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={10} /> 현장 확인됨</span>}
                </div>
                <div className="mt-2 space-y-2">
                  {item.candidates.map((candidate) => {
                    const evidence = analysis.evidenceCards.filter((card) => card.casNumber === candidate.casNumber);
                    return (
                      <div key={candidate.casNumber} className="rounded-lg border border-border bg-secondary/35 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div><p className="font-mono text-[11px] font-semibold">CAS {candidate.casNumber}</p><p className="mt-0.5 text-[9px] text-muted-foreground">후보 점수는 확률·신뢰도가 아닙니다.</p></div>
                          {!confirmed && item.role !== "UNKNOWN" && <ConfirmationButton role={item.role} casNumber={candidate.casNumber} displayName={item.surfaceText} confirmingRole={confirmingRole} onConfirm={onConfirm} />}
                        </div>
                        <EvidenceLinks evidence={evidence} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {analysis.facilityHistory.status !== "NOT_QUERIED" && (
          <section className="border-t border-border bg-card p-3" aria-label="시설 과거 이력 후보">
            <p className="flex items-center gap-1.5 text-[11px] font-bold"><History size={13} />{analysis.facilityHistory.label}</p>
            <p className="mt-1 rounded-lg bg-accent/10 p-2 text-[10px] leading-relaxed text-accent">{analysis.facilityHistory.warning || "과거 공개 이력 기반 후보 · 현재 재고 확인 필요"}</p>
            {analysis.facilityHistory.candidates.length > 0 ? (
              <div className="mt-2 space-y-2">
                {analysis.facilityHistory.candidates.map((candidate) => {
                  const displayName = candidate.chemicalNames || "시설 공개 이력 물질";
                  return (
                    <div key={`${candidate.facilityName}-${candidate.casNumber}`} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 p-2.5">
                      <div><p className="text-[10px] font-semibold">{displayName}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">CAS {candidate.casNumber} · {candidate.facilityName}</p>{candidate.sourceUrl && <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600">공개 이력 원문<ExternalLink size={9} /></a>}</div>
                      {!analysis.confirmationGate.facilityConfirmed && <ConfirmationButton role="FACILITY" casNumber={candidate.casNumber} displayName={displayName} confirmingRole={confirmingRole} onConfirm={onConfirm} label="시설 이력 현장 확인" />}
                    </div>
                  );
                })}
              </div>
            ) : <p className="mt-2 text-[10px] text-muted-foreground">현재 연결된 과거 공개 이력 후보가 없습니다.</p>}
          </section>
        )}

        {completed ? (
          <section className="border-t border-border bg-card p-3" aria-label="충돌 검토 결과">
            <div className="flex items-end justify-between gap-2"><div><p className="text-[10px] text-muted-foreground">공개 CAMEO 규칙 기준 서수 등급</p><p className={`mt-1 text-lg font-bold ${completed.riskLevel === "HIGH" ? "text-primary" : completed.riskLevel === "MEDIUM" ? "text-accent" : "text-foreground"}`}>{completed.riskLevelKo}</p></div><span className="text-[10px] text-muted-foreground">확률·백분율 아님</span></div>
            <p className="mt-2 text-[11px] leading-relaxed">{completed.briefText}</p>
            <p className="mt-3 text-[10px] font-bold">다음 현장 확인</p>
            <ul className="mt-1 space-y-1 text-[10px] text-muted-foreground">{completed.requiredChecks.map((check) => <li key={check}>• {check}</li>)}</ul>
            {completed.limitations.length > 0 && <div className="mt-3 rounded-lg bg-accent/10 p-2 text-[10px] leading-relaxed text-accent">{completed.limitations.join(" · ")}</div>}
            <div className="mt-3 flex flex-wrap gap-2">{completed.evidenceUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border px-2 text-[10px] font-semibold text-blue-600 hover:bg-muted">공식 근거 {index + 1}<ExternalLink size={10} /></a>)}</div>
            <p className="mt-3 text-[9px] text-muted-foreground">결정 규칙 {completed.ruleId} · {completed.ruleVersion} · {completed.finalDecision}</p>
          </section>
        ) : (
          <section className="border-t border-border px-3 py-2">
            <p className="text-[10px] font-semibold">대원이 해야 할 일</p>
            <ul className="mt-1 space-y-1 text-[10px] text-muted-foreground">{analysis.requiredNextSteps.map((step) => <li key={step}>• {step}</li>)}</ul>
          </section>
        )}

        <footer className="border-t border-border bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
          모델 {analysis.provenance.modelVersion} · 데이터 {analysis.provenance.dataVersion} · 규칙 {analysis.provenance.rulePolicy} · 최종 판단 {analysis.provenance.finalDecisionAuthority}
        </footer>
      </article>

      <GroundedEvidenceAccordion rag={analysis.groundedRag} />
    </div>
  );
}
