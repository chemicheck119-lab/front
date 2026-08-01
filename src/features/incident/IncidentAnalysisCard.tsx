import { AlertTriangle, CheckCircle2, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import type { IncidentAnalysisResponse } from "../../api/contracts";
import { analysisStateLabel, canShowRisk } from "./analysisState";

interface IncidentAnalysisCardProps {
  analysis: IncidentAnalysisResponse | null;
  onConfirm: (role: "INCIDENT" | "FACILITY", casNumber: string, displayName: string) => void;
  confirmingRole: "INCIDENT" | "FACILITY" | null;
}

const roleLabel = (role: "INCIDENT" | "FACILITY" | "UNKNOWN") => role === "INCIDENT" ? "사고물질" : role === "FACILITY" ? "시설물질" : "물질 후보";

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

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-secondary/45">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          {riskVisible ? <CheckCircle2 size={15} className="text-emerald-600" /> : <LockKeyhole size={14} className="text-accent" />}
          <div><p className="text-xs font-semibold">{analysisStateLabel(analysis.state)}</p><p className="text-[10px] text-muted-foreground">분석 ID {analysis.analysisId}</p></div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${riskVisible ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-accent/10 text-accent"}`}>
          충돌 규칙 {analysis.conflictReview.executed ? "실행됨" : "실행 안 됨"}
        </span>
      </header>

      {!riskVisible && (
        <div className="border-b border-border bg-accent/5 px-3 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent"><AlertTriangle size={12} /> 현장 확인이 필요한 정상 업무 단계입니다.</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">후보 검색만으로 위험을 확정하지 않습니다. 두 CAS가 확인될 때까지 화학 충돌 등급을 표시하지 않습니다.</p>
        </div>
      )}

      <div className="space-y-2 p-3">
        {analysis.substanceCandidates.length === 0 && <p className="rounded-lg bg-card p-3 text-[11px] text-muted-foreground">식별 가능한 물질 후보가 없습니다. 라벨·MSDS·운송 문서를 확인해주세요.</p>}
        {analysis.substanceCandidates.map((item) => {
          const candidate = item.candidates[0];
          const confirmed = item.role === "INCIDENT" ? analysis.confirmationGate.incidentConfirmed : item.role === "FACILITY" ? analysis.confirmationGate.facilityConfirmed : false;
          return (
            <div key={`${item.role}-${item.surfaceText}`} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-[10px] text-muted-foreground">{roleLabel(item.role)}</p><p className="mt-0.5 text-xs font-semibold">{item.surfaceText}</p><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">CAS {candidate?.casNumber ?? "확인 필요"}</p></div>
                {confirmed ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={10} /> 확인됨</span>
                ) : item.role !== "UNKNOWN" && candidate ? (
                  <button
                    data-testid={`confirm-${item.role}`}
                    className="min-h-9 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-50"
                    disabled={confirmingRole !== null}
                    onClick={() => item.role !== "UNKNOWN" && onConfirm(item.role, candidate.casNumber, item.surfaceText)}
                  >
                    {confirmingRole === item.role ? "확인 기록 중…" : "현장 물질 확인"}
                  </button>
                ) : null}
              </div>
              {!confirmed && <p className="mt-2 text-[10px] text-muted-foreground">정확 일치 후보도 확정값이 아닙니다. 검증된 현장 근거를 선택해야 합니다.</p>}
            </div>
          );
        })}
      </div>

      {completed ? (
        <div className="border-t border-border bg-card p-3">
          <div className="flex items-end justify-between gap-2"><div><p className="text-[10px] text-muted-foreground">공개 규칙 기준 위험등급</p><p className={`mt-1 text-lg font-bold ${completed.riskLevel === "HIGH" ? "text-primary" : completed.riskLevel === "MEDIUM" ? "text-accent" : "text-foreground"}`}>{completed.riskLevelKo}</p></div><span className="text-[10px] text-muted-foreground">확률 아님</span></div>
          <p className="mt-2 text-[11px] leading-relaxed">{completed.briefText}</p>
          <ul className="mt-2 space-y-1 text-[10px] text-muted-foreground">{completed.requiredChecks.map((check) => <li key={check}>• {check}</li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-2">{completed.evidenceUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline">공식 근거 {index + 1}<ExternalLink size={10} /></a>)}</div>
        </div>
      ) : (
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">필요 행동: {analysis.requiredNextSteps[0] ?? "현장 근거를 확인해주세요."}</div>
      )}

      <footer className="border-t border-border bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
        모델 {analysis.provenance.modelVersion} · 데이터 {analysis.provenance.dataVersion} · 규칙 {analysis.provenance.rulePolicy} · 최종 판단 {analysis.provenance.finalDecisionAuthority}
      </footer>
    </article>
  );
}
