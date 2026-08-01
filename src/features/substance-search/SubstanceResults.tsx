import { ExternalLink, SearchX } from "lucide-react";
import type { MaterialDiscoveryResponse } from "../../api/contracts";

export function SubstanceResults({ result }: { result: MaterialDiscoveryResponse | null }) {
  if (!result) return <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">물질명·CAS·화학식 또는 색·냄새·상태를 입력해주세요.</div>;
  if (result.status !== "CANDIDATES_FOUND" || result.candidates.length === 0) {
    return <div className="rounded-xl border border-border bg-secondary p-4 text-center"><SearchX className="mx-auto text-muted-foreground" size={22} /><p className="mt-2 text-xs font-semibold">신뢰할 수 있는 후보 없음</p><p className="mt-1 text-[10px] text-muted-foreground">{result.notice}</p></div>;
  }

  return (
    <div className="space-y-2">
      {result.candidates.map((candidate) => (
        <article key={candidate.casNumber} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-[10px] text-muted-foreground">후보 순위 {candidate.rank} · {candidate.matchBasis === "IDENTITY_EXPRESSION" ? "이름·CAS 일치" : "관찰 특징 일치"}</p><h3 className="mt-0.5 text-sm font-bold">{candidate.displayName}</h3><p className="font-mono text-[11px] text-muted-foreground">CAS {candidate.casNumber}</p></div>
            <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">현장 확인 필요</span>
          </div>
          {candidate.matchedProperties.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{candidate.matchedProperties.map((property) => <span key={`${property.field}-${property.value}`} className="rounded-md border border-border bg-card px-2 py-1 text-[10px]">{property.label}: {property.value}</span>)}</div>}
          {candidate.propertySource && <a href={candidate.propertySource.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline">{candidate.propertySource.label}<ExternalLink size={10} /></a>}
          {(candidate.evidenceWarning || candidate.evidenceNotice) && <p className="mt-2 rounded-lg bg-accent/10 p-2 text-[10px] leading-relaxed text-accent">{candidate.evidenceWarning ?? candidate.evidenceNotice}</p>}
          {candidate.evidenceCards.map((evidence) => <div key={evidence.evidenceId} className="mt-2 rounded-lg border border-border bg-card p-2"><p className="text-[10px] font-semibold">{evidence.title}</p><p className="mt-1 line-clamp-3 text-[10px] text-muted-foreground">{evidence.bodyPreview}</p><a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600">원문 보기<ExternalLink size={9} /></a></div>)}
        </article>
      ))}
      <p className="rounded-lg bg-muted p-2 text-[10px] leading-relaxed text-muted-foreground">{result.notice}</p>
    </div>
  );
}
