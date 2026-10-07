import { useState } from "react";

type Evidence = { evidence_id: string; cas_number: string; title: string; body: string };
type Result = {
  status: "PENDING_HUMAN_REVIEW" | "AVAILABLE" | "NO_EVIDENCE";
  collected_at: string; version: string | null; rows: Evidence[];
  candidate_counts: { input: number; normal: number; excluded: number };
};

/** Explicit local development view; never feeds generated accident advice. */
export function LocalSourceReference() {
  const [cas, setCas] = useState("67-56-1");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function search() {
    setBusy(true); setResult(null); setError("");
    try {
      const response = await fetch(`/local-reference/evidence?cas=${encodeURIComponent(cas.trim())}`);
      if (!response.ok) throw new Error("unavailable");
      const value = await response.json() as Result;
      if (!["AVAILABLE", "NO_EVIDENCE", "PENDING_HUMAN_REVIEW"].includes(value.status) || !Array.isArray(value.rows)) throw new Error("invalid");
      // Never display a body returned alongside an unapproved status.
      setResult({ ...value, rows: value.status === "AVAILABLE" ? value.rows : [] });
    } catch { setError("자료 조회 연결을 확인할 수 없습니다. 기존 사고 분석 결과와 구분해 확인하세요."); }
    finally { setBusy(false); }
  }
  return <section aria-label="실제 원천 기준자료 조회" className="classic-secondary">
    <h3>KOSHA 기준자료 · 로컬 확인</h3>
    <p>보관된 실제 XML을 조회합니다. 사고 분석 답변과 별도이며, 새 수집·현장 적용 검증은 아닙니다.</p>
    <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="chemical-input-row">
      <input aria-label="기준자료 CAS" value={cas} onChange={(event) => { setCas(event.target.value); setResult(null); }} />
      <button type="submit" disabled={busy || !cas.trim()} className="chemical-add-button">{busy ? "조회 중…" : "기준자료 조회"}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <>
      <p>원천 수집 시각: {result.collected_at}</p>
      <p>원천 {result.candidate_counts.input}건 · 정상 {result.candidate_counts.normal}건 · 제외 {result.candidate_counts.excluded}건</p>
      {result.status === "PENDING_HUMAN_REVIEW" ? <p role="status">검토·승인 대기 중입니다. 원천 자료 본문은 표시하지 않습니다.</p>
        : result.status === "NO_EVIDENCE" ? <p role="status">승인된 버전에 해당 CAS 자료가 없습니다.</p>
        : <><p>승인 버전: {result.version} · 조회 {result.rows.length}건</p>
          {result.rows.map((row) => <details key={row.evidence_id}><summary>{row.title}</summary><p style={{ whiteSpace: "pre-wrap" }}>{row.body}</p><small>출처: KOSHA · CAS {row.cas_number} · {row.evidence_id}</small></details>)}</>}
    </>}
  </section>;
}
