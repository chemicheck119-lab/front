import { ArrowRight, ExternalLink, SearchX } from "lucide-react";
import type { MaterialCandidate, MaterialDiscoveryResponse } from "../../api/contracts";
import { SourceBadges, type SourceBadgeKind } from "../evidence/SourceBadges";

interface SubstanceResultsProps {
  result: MaterialDiscoveryResponse | null;
  incidentAvailable: boolean;
  onUseCandidate: (candidate: MaterialCandidate) => void;
}

const statusPresentation: Record<MaterialDiscoveryResponse["status"], { title: string; detail: string }> = {
  CANDIDATES_FOUND: {
    title: "관찰 정보와 일치하는 후보",
    detail: "후보를 자동 확정하지 않습니다. 현장에서 라벨·MSDS로 확인해주세요.",
  },
  NO_RELIABLE_CANDIDATE: {
    title: "신뢰할 후보를 찾지 못했습니다",
    detail: "관찰 정보를 보강하거나 공식 MSDS를 확인하세요. 후보 없음은 물질이 없거나 안전하다는 뜻이 아닙니다.",
  },
  PROFILE_INDEX_NOT_AVAILABLE: {
    title: "물질 탐색 자료 준비 중",
    detail: "현재 관찰 프로필 자료를 사용할 수 없습니다. 공식 MSDS 검색을 이용하세요.",
  },
};

const matchBasisLabel: Record<MaterialCandidate["matchBasis"], string> = {
  IDENTITY_EXPRESSION: "이름·CAS 표현 일치",
  PUBLIC_PROPERTY_PROFILE: "공개 성상 관찰 일치",
  IDENTITY_AND_PUBLIC_PROPERTY_PROFILE: "이름·CAS와 공개 성상 일치",
};

function candidateSourceBadges(candidate: MaterialCandidate): SourceBadgeKind[] {
  const kinds: SourceBadgeKind[] = ["FIRE_DATA"];
  if (candidate.evidenceCards.some((evidence) => evidence.source === "KOSHA")) kinds.push("KOSHA");
  kinds.push("FIELD_CONFIRMATION");
  return kinds;
}

export function SubstanceResults({ result, incidentAvailable, onUseCandidate }: SubstanceResultsProps) {
  if (!result) return <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">물질명·CAS·화학식 또는 색·냄새·상태·용도를 입력해주세요.</div>;
  const presentation = statusPresentation[result.status];

  if (result.status !== "CANDIDATES_FOUND" || result.candidates.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-secondary p-4 text-center">
        <SearchX className="mx-auto text-muted-foreground" size={22} />
        <p className="mt-2 text-xs font-semibold">{presentation.title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{presentation.detail}</p>
        {result.notice && <p className="mt-2 rounded-lg bg-card p-2 text-[10px] leading-relaxed text-muted-foreground">{result.notice}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">{presentation.title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{presentation.detail}</p>
      </div>
      {result.candidates.map((candidate) => (
        <article key={candidate.casNumber} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="mb-2"><SourceBadges label={`${candidate.displayName} 후보 출처`} kinds={candidateSourceBadges(candidate)} /></div>
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-[10px] text-muted-foreground">후보 순위 {candidate.rank} · {matchBasisLabel[candidate.matchBasis]}</p><h3 className="mt-0.5 text-sm font-bold">{candidate.displayName}</h3><p className="font-mono text-[11px] text-muted-foreground">CAS {candidate.casNumber}</p></div>
            <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">AI 확정 아님</span>
          </div>
          {candidate.matchedExpression && <p className="mt-2 rounded-lg bg-card p-2 text-[10px] text-muted-foreground">일치 표현: {candidate.matchedExpression}</p>}
          {candidate.matchedProperties.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{candidate.matchedProperties.map((property) => <span key={`${property.field}-${property.value}`} className="rounded-md border border-border bg-card px-2 py-1 text-[10px]">{property.label}: {property.value}</span>)}</div>}
          {candidate.propertySource && <a href={candidate.propertySource.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[10px] font-semibold text-blue-600 hover:bg-muted">{candidate.propertySource.label}<ExternalLink size={10} /></a>}
          {[candidate.evidenceWarning, candidate.evidenceNotice, candidate.casLinkWarning].filter(Boolean).map((warning) => <p key={warning} className="mt-2 rounded-lg bg-accent/10 p-2 text-[10px] leading-relaxed text-accent">{warning}</p>)}
          {candidate.evidenceCards.map((evidence) => <div key={evidence.evidenceId} className="mt-2 rounded-lg border border-border bg-card p-2"><p className="text-[10px] font-semibold">{evidence.title}</p><p className="mt-1 line-clamp-3 text-[10px] text-muted-foreground">{evidence.bodyPreview}</p><a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-blue-600">원문 보기<ExternalLink size={9} /></a></div>)}
          <button
            type="button"
            disabled={!incidentAvailable}
            onClick={() => onUseCandidate(candidate)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 text-[11px] font-bold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {incidentAvailable ? <>사고물질 확인 창으로 가져오기<ArrowRight size={13} /></> : "사고 신고 접수 후 확인 가능"}
          </button>
          <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">가져온 뒤에도 확인 근거를 선택하고 저장해야 현장 확인으로 기록됩니다.</p>
        </article>
      ))}
      <p className="rounded-lg bg-muted p-2 text-[10px] leading-relaxed text-muted-foreground">{result.notice}</p>
      <p className="rounded-lg border border-border p-2 text-[10px] leading-relaxed text-muted-foreground">{result.safetyNotice}</p>
    </div>
  );
}
