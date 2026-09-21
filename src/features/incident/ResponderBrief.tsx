import { useState } from "react";
import { AlertTriangle, Check, ChevronRight, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import type { IncidentAnalysisResponse } from "../../api/contracts";
import { resolveOfficialSourceUrl } from "../evidence/sourceLinks";
import { canShowRisk } from "./analysisState";
import { GroundedEvidenceAccordion } from "./GroundedEvidenceAccordion";

type Role = "INCIDENT" | "FACILITY";
export type ConfirmedMaterials = Partial<Record<Role, { casNumber: string; displayName: string }>>;

interface Props {
  panel?: "combined" | "materials" | "response";
  analysis: IncidentAnalysisResponse | null;
  busy: boolean;
  synthetic: boolean;
  confirmedMaterials: ConfirmedMaterials;
  confirmationIds: Partial<Record<Role, string>>;
  onConfirm: (role: Role, cas: string, name: string) => void;
  onCancel: (role: Role, id: string) => void;
}

function MaterialCheck({ role, analysis, busy, synthetic, confirmedMaterial, confirmationId, onConfirm, onCancel }: {
  role: Role;
  analysis: IncidentAnalysisResponse;
  busy: boolean;
  synthetic: boolean;
  confirmedMaterial?: ConfirmedMaterials[Role];
  confirmationId?: string;
  onConfirm: Props["onConfirm"];
  onCancel: Props["onCancel"];
}) {
  const label = role === "INCIDENT" ? "사고물질" : "시설물질";
  const confirmed = role === "INCIDENT" ? analysis.confirmationGate.incidentConfirmed : analysis.confirmationGate.facilityConfirmed;
  const options = analysis.substanceCandidates.filter((item) => item.role === role).flatMap((item) => item.candidates.map((candidate) => ({
    casNumber: candidate.casNumber,
    displayName: item.surfaceText,
    historical: false,
  })));
  if (role === "FACILITY") {
    for (const candidate of analysis.facilityHistory.candidates) {
      if (!options.some((option) => option.casNumber === candidate.casNumber)) {
        options.push({ casNumber: candidate.casNumber, displayName: candidate.chemicalNames || "과거 취급 물질", historical: true });
      }
    }
  }
  const [selectedCas, setSelectedCas] = useState("");
  const selected = options.length === 1 ? options[0] : options.find((option) => option.casNumber === selectedCas);
  // A candidate ranking is not the identity recorded by the confirmation API.
  const displayed = confirmed ? confirmedMaterial : selected;
  const evidence = analysis.evidenceCards.filter((item) => item.casNumber === displayed?.casNumber);

  return (
    <section className={`focus-material ${confirmed ? "is-confirmed" : ""}`} aria-label={`${label} 확인`}>
      <div className="focus-material-top"><h3>{label}</h3><span className={`focus-badge ${confirmed ? "is-done" : "is-pending"}`}>{confirmed ? <><Check size={16} />{synthetic ? "합성 확인 완료" : "확인 완료"}</> : "미확인"}</span></div>
      {!confirmed && options.length > 1 && <label className="focus-candidate-select">라벨과 일치하는 물질 선택<select aria-label={`${label} CAS 선택`} value={selectedCas} onChange={(event) => setSelectedCas(event.target.value)} disabled={busy}><option value="">후보 {options.length}개 중 선택</option>{options.map((option, index) => <option key={`${option.casNumber}-${index}`} value={option.casNumber}>{option.displayName} · {option.casNumber}{option.historical ? " · 과거 이력" : ""}</option>)}</select></label>}
      <div className="focus-material-identity">
        <p className="focus-material-name">{displayed?.displayName ?? (confirmed ? "확인 기록 있음" : options.length ? "물질을 선택하세요" : "확인 가능한 후보 없음")}</p>
        <p className="focus-cas">{displayed?.casNumber ? `CAS ${displayed.casNumber}` : confirmed ? "확인한 물질명·CAS 조회 필요" : "용기 라벨·현장 MSDS 확인 필요"}</p>
      </div>
      {!confirmed && selected?.historical && <p className="focus-history-warning">과거 취급 이력입니다. 현재 보관 여부를 확인하세요.</p>}
      {!confirmed && <button className="focus-primary focus-confirm" disabled={!selected || busy} onClick={() => selected && onConfirm(role, selected.casNumber, selected.displayName)} aria-label={`${label} ${synthetic ? "합성 확인" : "현장 확인"}`}><ShieldCheck size={19} />{synthetic ? "합성 확인" : "라벨·CAS 일치 확인"}</button>}
      {confirmed && !synthetic && confirmationId && <button className="focus-text-button" disabled={busy} onClick={() => onCancel(role, confirmationId)}>확인 취소·다시 확인</button>}
      <details className="focus-material-evidence"><summary>물질 자료 보기</summary><div>{evidence.length ? evidence.map((item) => {
        const url = resolveOfficialSourceUrl(item.sourceUrl, item.source);
        return <article key={item.evidenceId}><strong>{item.title}</strong><p>{item.bodyPreview}</p>{url && <a href={url} target="_blank" rel="noreferrer">공식 원문 <ExternalLink size={14} /></a>}</article>;
      }) : <p>연결된 공식 자료가 없습니다. 현장 제품의 원문 MSDS를 확인하세요.</p>}</div></details>
    </section>
  );
}

export function ResponderBrief({ panel = "combined", analysis, busy, synthetic, confirmedMaterials, confirmationIds, onConfirm, onCancel }: Props) {
  if (!analysis) return <div className="focus-empty" role="status">{busy ? "확인 정보를 갱신하고 있습니다." : "신고 내용을 분석하면 확인할 물질이 표시됩니다."}</div>;
  const complete = canShowRisk(analysis) && analysis.conflictReview.executed && analysis.conflictReview.status === "SCREENING_COMPLETED" ? analysis.conflictReview.result : null;
  const count = Number(analysis.confirmationGate.incidentConfirmed) + Number(analysis.confirmationGate.facilityConfirmed);
  const substanceUnknown = count === 0 && !analysis.substanceCandidates.some((group) => group.candidates.length > 0)
    && analysis.facilityHistory.candidates.length === 0;
  const materials = <div className="focus-material-grid">{(["INCIDENT", "FACILITY"] as const).map((role) => <MaterialCheck key={`${analysis.incidentId}-${role}`} role={role} analysis={analysis} busy={busy} synthetic={synthetic} confirmedMaterial={confirmedMaterials[role]} confirmationId={confirmationIds[role]} onConfirm={onConfirm} onCancel={onCancel} />)}</div>;
  const heading = count === 0 ? "물질 2개를 확인하세요" : count === 1 ? `${analysis.confirmationGate.incidentConfirmed ? "시설물질" : "사고물질"}을 확인하세요` : "추가 확인이 필요합니다";
  const unavailable = <section className="focus-unavailable" role="status"><h2>안전하다는 뜻이 아닙니다</h2><p>{analysis.conflictReview.executed && analysis.conflictReview.status !== "SCREENING_COMPLETED" ? analysis.conflictReview.result.reason : "공식 원문과 현장 조건을 추가로 확인하세요."}</p>{analysis.requiredNextSteps.length > 0 && <ul>{analysis.requiredNextSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ul>}</section>;

  if (panel === "materials") return <div className="focus-field-content">
    <header className="focus-section-heading"><h3>{count === 2 ? "확인한 물질" : heading}</h3><span className="focus-count" role="status">{synthetic ? "합성 확인" : "물질 확인"} <b>{count}/2</b></span></header>
    {count < 2 && <p className="focus-instruction">용기 라벨·현장 MSDS와 후보 CAS를 대조하세요.</p>}
    {materials}
  </div>;

  if (panel === "response" && !complete) return count === 2 ? unavailable : <div className="classic-response-waiting"><LockKeyhole size={28} /><h3>{substanceUnknown ? "물질 미상 · 추가 확인 필요" : "물질 확인 후 제공됩니다"}</h3><p>{substanceUnknown ? "용기 라벨·현장 MSDS에서 물질명과 CAS를 확인하세요." : "사고물질과 시설물질을 각각 확인해주세요."}</p><p>확인 전에는 반응 위험을 판단하지 않습니다.</p></div>;

  return (
    <div className="focus-field-content">
      {panel === "combined" && <header className="focus-section-heading"><div><p className="focus-eyebrow">현장 대응</p><h1>{complete ? "지금 확인할 대응 정보" : heading}</h1></div><span className="focus-count" role="status">{synthetic ? "합성 확인" : "물질 확인"} <b>{count}/2</b></span></header>}
      {complete ? <>
        <section className={`focus-risk-panel risk-${complete.riskLevel.toLowerCase()}`} aria-label="충돌 검토 결과">
          <div className="focus-risk-level"><span>물질 간 반응 위험</span><strong><AlertTriangle size={30} />{complete.riskLevelKo}</strong><small>CAMEO 규칙 기준 · 확률 아님</small></div>
          <div className="focus-risk-description"><div className="focus-material-pair" aria-label="반응 검토 물질">{confirmedMaterials.INCIDENT?.displayName ?? "사고물질 조회 필요"} <span>×</span> {confirmedMaterials.FACILITY?.displayName ?? "시설물질 조회 필요"}</div><p>{complete.briefText}</p><span>참고 결과이며 안전을 보장하지 않습니다.</span></div>
        </section>
        <section className="focus-next-actions" aria-label="다음 현장 확인">
          <h2>다음 현장 확인</h2>
          {complete.requiredChecks.length ? <ol>{complete.requiredChecks.slice(0, 3).map((check, index) => <li key={`${index}-${check}`}><span>{index + 1}</span><p>{check}</p></li>)}</ol> : <p className="focus-notice">추가 확인 항목이 제공되지 않았습니다. 원문 MSDS와 현장 지휘관 판단이 필요합니다.</p>}
          {complete.requiredChecks.length > 3 && <details className="focus-disclosure"><summary>추가 확인 {complete.requiredChecks.length - 3}건</summary><ul>{complete.requiredChecks.slice(3).map((check, index) => <li key={`${index}-${check}`}>{check}</li>)}</ul></details>}
          <p className="focus-authority">최종 판단은 현장 지휘관이 합니다.</p>
        </section>
        <details className="focus-disclosure focus-evidence" aria-label="근거와 제한사항"><summary>공식 근거·제한사항 보기 <ChevronRight size={18} /></summary><div className="focus-detail-content">
          {complete.limitations.map((item, index) => <p className="focus-notice" key={`${index}-${item}`}>{item}</p>)}
          <div className="focus-source-links">{complete.evidenceUrls.map((url, index) => { const safe = resolveOfficialSourceUrl(url); return safe ? <a key={`${index}-${safe}`} href={safe} target="_blank" rel="noreferrer">공식 근거 {index + 1} <ExternalLink size={15} /></a> : null; })}</div>
          <GroundedEvidenceAccordion rag={analysis.groundedRag} />
        </div></details>
        {panel === "combined" && <details className="focus-disclosure" aria-label="확인한 물질"><summary>확인한 물질 보기·수정 <ChevronRight size={18} /></summary><div className="focus-detail-content">{materials}</div></details>}
      </> : <>
        <p className="focus-instruction">아래는 물질 후보입니다. 용기 라벨·현장 MSDS와 대조하세요.</p>
        {materials}
        <div className="focus-gate-notice" role="note"><LockKeyhole size={21} /><p>{count < 2 ? "두 물질을 모두 확인하기 전에는 위험을 판단하지 않습니다." : "물질은 확인했지만, 대응 참고 결과를 제공할 근거가 부족합니다."}</p></div>
        {count === 2 && unavailable}
      </>}
    </div>
  );
}
