import { useEffect, useState } from "react";
import { resolveOfficialSourceUrl } from "../evidence/sourceLinks";

export type Guidance = {
  status: "AVAILABLE" | "NO_EVIDENCE" | "PENDING_HUMAN_REVIEW";
  cas: string | null; name: string | null; version: string | null;
  collected_at: string | null; source_url: string;
  document_versions?: string[];
  sections: Array<{ number: number; label: string; status: string;
    items: Array<{ evidence_id: string; title: string; text: string }> }>;
};

export function MaterialGuidance({ query, incidentType = "", enabled, searched = false }: {
  query: string; incidentType?: string; enabled: boolean; searched?: boolean;
}) {
  const [result, setResult] = useState<Guidance | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(5);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(null); setError(false);
    if (!enabled || !query) { setBusy(false); return; }
    const abort = new AbortController();
    const timeout = window.setTimeout(() => {
      abort.abort(); setError(true); setBusy(false);
    }, 15000);
    setBusy(true);
    setSelected(incidentType === "누출" ? 6 : incidentType === "구조" ? 4 : 5);
    void (async () => {
      try {
        const response = await fetch(`/local-reference/guidance?query=${encodeURIComponent(query)}`, { signal: abort.signal });
        if (!response.ok) throw new Error("unavailable");
        const value = await response.json() as Guidance;
        if (!["AVAILABLE", "NO_EVIDENCE", "PENDING_HUMAN_REVIEW"].includes(value.status) || !Array.isArray(value.sections)
          || (value.status === "AVAILABLE" && (!value.version || !value.cas))) throw new Error("invalid");
        if (!abort.signal.aborted) setResult({ ...value, sections: value.status === "AVAILABLE" ? value.sections : [] });
      } catch { if (!abort.signal.aborted) setError(true); }
      finally { window.clearTimeout(timeout); if (!abort.signal.aborted) setBusy(false); }
    })();
    return () => { window.clearTimeout(timeout); abort.abort(); };
  }, [query, incidentType, enabled, attempt]);
  if (!enabled) return null;
  const section = result?.sections.find((item) => item.number === selected);
  const sourceUrl = result ? resolveOfficialSourceUrl(result.source_url, "KOSHA") : null;
  return <section className="material-guidance" aria-label="물질별 대응 참고자료">
    <h3>{result?.name ? `${result.name} · CAS ${result.cas}` : "물질별 대응 참고자료"}</h3>
    {query && <p>{searched ? "검색한 물질의 참고자료 · 사고물질 확인으로 기록되지 않습니다." : "현장 확인한 사고물질의 참고자료"}</p>}
    {!query && <p>물질명·CAS로 검색하면 대응 참고자료가 여기에 표시됩니다. 사고 접수는 필요하지 않습니다.</p>}
    {busy && <p role="status">공식 자료를 확인하고 있습니다…</p>}
    {error && <div role="alert"><p>자료 연결을 확인할 수 없습니다. 대응 내용을 제공하지 않습니다.</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>다시 조회</button></div>}
    {result?.status === "PENDING_HUMAN_REVIEW" && <p role="status">현재 조회 가능한 승인 자료가 없습니다. 검토 중인 자료는 대응 정보로 제공하지 않습니다.</p>}
    {result?.status === "NO_EVIDENCE" && <p role="status">해당 물질의 승인 자료를 찾지 못했습니다. 물질명·CAS와 현장 MSDS를 확인하세요.</p>}
    {result?.status === "AVAILABLE" && <>
      <p className="guidance-notice">KOSHA 원문 참고 · 현장 물질 확인 및 지휘관 판단을 대체하지 않습니다.</p>
      <div className="guidance-tabs" role="group" aria-label="필요한 대응 정보">
        {result.sections.map((item) => <button type="button" key={item.number} aria-pressed={selected === item.number} onClick={() => setSelected(item.number)}>{item.label}</button>)}
      </div>
      {section && <div aria-live="polite">
        {section.items.length === 0 ? <p role="status">이 항목에 제공된 정보가 없습니다. 안전하다는 뜻이 아닙니다.</p>
          : section.items.map((item) => <article key={item.evidence_id}><h4>{item.title}</h4><p>{item.text}</p></article>)}
      </div>}
      <details className="guidance-source"><summary>출처·자료 시점 확인</summary><p>원천 개정일: {result.document_versions?.join(", ") || "미확인"}</p><p>수집: {result.collected_at}</p><p>자료 버전: {result.version}</p>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">KOSHA 제공 안내</a>}</details>
    </>}
  </section>;
}
