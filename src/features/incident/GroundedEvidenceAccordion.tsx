import { BookOpenCheck, ExternalLink, FileWarning } from "lucide-react";
import type { GroundedRagResult, GroundedRagStatus } from "../../api/contracts";

const RAG_PRESENTATION: Record<GroundedRagStatus, { title: string; detail: string }> = {
  COMPLETED: {
    title: "근거 제한형 요약",
    detail: "공식 근거와 연결된 문장만 표시합니다.",
  },
  FALLBACK_EXTRACTIVE: {
    title: "공식 근거 발췌 요약",
    detail: "생성 요약 대신 공식 문서 발췌를 표시합니다.",
  },
  NOT_RUN_REQUIRES_CONFIRMED_PAIR: {
    title: "대응 근거 잠김",
    detail: "사고물질과 시설물질을 모두 현장에서 확인하면 제공됩니다.",
  },
  NOT_RUN_RULE_NOT_COMPLETED: {
    title: "충돌 규칙 근거 부족",
    detail: "충돌 규칙 검토가 완료되지 않아 대응 근거를 만들지 않았습니다.",
  },
  NO_GROUNDED_EVIDENCE: {
    title: "연결된 공식 근거 없음",
    detail: "현장 제품의 원문 MSDS와 공식 자료를 직접 확인해주세요.",
  },
  DISABLED: {
    title: "대응 근거 기능 비활성",
    detail: "현재 환경에서는 근거 요약 기능을 사용할 수 없습니다.",
  },
};

export function getRagPresentation(status: GroundedRagStatus) {
  return RAG_PRESENTATION[status];
}

function StatementSources({ sourceIds, rag }: { sourceIds: string[]; rag: GroundedRagResult }) {
  const citations = sourceIds.flatMap((sourceId) => {
    const citation = rag.citations.find((item) => item.sourceId === sourceId);
    return citation ? citation.sourceUrls.map((url) => ({ sourceId, title: citation.title, url })) : [];
  });

  if (citations.length === 0) {
    return <p className="mt-2 text-xs text-accent">이 문장에 연결된 원문 링크가 없습니다.</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {citations.map((citation, index) => (
        <a
          key={`${citation.sourceId}-${citation.url}`}
          href={citation.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-blue-600 hover:bg-muted"
        >
          {citation.title || `출처 ${index + 1}`}<ExternalLink size={9} />
        </a>
      ))}
    </div>
  );
}

export function GroundedEvidenceAccordion({ rag }: { rag: GroundedRagResult | null | undefined }) {
  if (!rag) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-secondary/30 p-3">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold"><FileWarning size={13} /> 대응 근거 응답 없음</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">현재 분석 응답에 groundedRag가 없습니다. 원문 MSDS를 직접 확인해주세요.</p>
      </section>
    );
  }

  const presentation = getRagPresentation(rag.status);
  const hasStatements = (rag.status === "COMPLETED" || rag.status === "FALLBACK_EXTRACTIVE") && rag.statements.length > 0;

  return (
    <details className="overflow-hidden rounded-xl border border-border bg-secondary/30" open={hasStatements}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <BookOpenCheck size={14} className="text-blue-600" />
          <span><span className="block text-[13px] font-bold">대응 근거</span><span className="block text-xs text-muted-foreground">{presentation.title}</span></span>
        </span>
        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{rag.status}</span>
      </summary>
      <div className="space-y-2 border-t border-border p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">{presentation.detail}</p>
        {hasStatements ? rag.statements.map((statement, index) => (
          <article key={`${index}-${statement.text}`} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[13px] leading-relaxed">{statement.text}</p>
            <StatementSources sourceIds={statement.sourceIds} rag={rag} />
          </article>
        )) : (
          <div className="rounded-lg bg-card p-3 text-xs leading-relaxed text-muted-foreground">{presentation.detail}</div>
        )}
        <div className="rounded-lg bg-muted/70 p-2 text-xs leading-relaxed text-muted-foreground">
          위험등급은 대응 근거 요약이 아니라 결정 규칙 결과에서만 표시합니다.
          {rag.usedLlm === false ? " 이 내용은 공식 근거 발췌 요약입니다." : ""}
        </div>
      </div>
    </details>
  );
}
