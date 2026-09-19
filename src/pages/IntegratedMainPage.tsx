import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LoaderCircle, MapPinned } from "lucide-react";
import { analyzeIncident } from "../api/incidents";
import { confirmSubstance, cancelConfirmation } from "../api/confirmations";
import { discoverSubstances } from "../api/substances";
import { saveIncidentRecord } from "../api/records";
import { apiConfig, runtimeDataMode } from "../api/config";
import type { IncidentAnalysisResponse, MaterialCandidate, SessionContextResponse } from "../api/contracts";
import { getDemoAnalysis } from "../fixtures/demo";
import { useResponderLocation } from "../hooks/useResponderLocation";
import { IncidentAnalysisCard } from "../features/incident/IncidentAnalysisCard";
import { AgentPanel } from "../features/operations-agent/AgentPanel";
import { FieldToolsPanel, type FieldRecordMessage } from "../features/field-tools/FieldToolsPanel";
import { IncidentMap } from "../features/map/IncidentMap";
import { getLocationPresentation } from "../features/map/mapState";
import { MessageComposer } from "../features/composer/MessageComposer";
import { SubstanceResults } from "../features/substance-search/SubstanceResults";
import { StructuredOutcomeForm, emptyStructuredOutcomeDraft, toStructuredOutcomeReport, type StructuredOutcomeDraft } from "../features/records/StructuredOutcomeForm";
import "../styles/integrated-main.css";

function makeIncidentId() {
  return `INC-${Date.now()}`;
}

export default function IntegratedMainPage({ session = null }: { session?: SessionContextResponse | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const region = location.state?.region ?? "지역 미선택";
  const station = session?.stationDisplayName ?? location.state?.station ?? "소방서 미선택";
  const incidentId = location.state?.incidentId ?? (apiConfig.demoEnabled ? "INC-PUBLIC-DEMO-001" : null);
  const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
  const [incidentText, setIncidentText] = useState("");
  const [substanceQuery, setSubstanceQuery] = useState("");
  const [substanceResult, setSubstanceResult] = useState<Awaited<ReturnType<typeof discoverSubstances>> | null>(null);
  const [busy, setBusy] = useState<"analysis" | "substance" | "confirmation" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<FieldRecordMessage[]>([]);
  const [confirmationIds, setConfirmationIds] = useState<string[]>([]);
  const [outcomeDraft, setOutcomeDraft] = useState<StructuredOutcomeDraft>(() => emptyStructuredOutcomeDraft());
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  const locationState = useResponderLocation(Boolean(analysis));
  const gps = getLocationPresentation(locationState.state, locationState.position?.observedAt, locationState.position?.accuracyM);
  const mapContext = analysis?.agent?.mapContext ?? null;
  const activeIncidentId = analysis?.incidentId ?? incidentId;
  const isSynthetic = apiConfig.demoEnabled;

  const dispatchContact = useMemo(() => ({
    name: "케미체크119 상황실",
    phone: apiConfig.dispatchCenterPhone || "070-5276-7681",
  }), []);

  async function runAnalysis(value = incidentText) {
    if (!value.trim() || busy) return;
    setBusy("analysis");
    setError(null);
    try {
      const result = await analyzeIncident({
        incidentId: activeIncidentId ?? makeIncidentId(),
        inputType: "MANUAL_TEXT",
        text: value.trim(),
      });
      setAnalysis(result);
      setMessages((current) => [...current, { messageId: `${Date.now()}`, role: "USER", text: value.trim(), createdAt: new Date().toISOString() }]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "사고 분석을 시작하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function runSubstanceSearch() {
    if (!substanceQuery.trim() || busy) return;
    setBusy("substance");
    setError(null);
    try {
      setSubstanceResult(await discoverSubstances(substanceQuery.trim()));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "물질 후보를 검색하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm(role: "INCIDENT" | "FACILITY", casNumber: string, displayName: string) {
    if (!activeIncidentId || busy) return;
    setBusy("confirmation");
    setError(null);
    try {
      const response = await confirmSubstance(activeIncidentId, {
        role,
        casNumber,
        displayName,
        confirmationBasis: "RESPONDER_OBSERVATION",
        observedAt: new Date().toISOString(),
      });
      setConfirmationIds((current) => [...current, response.confirmationId]);
      if (incidentText.trim()) {
        const refreshed = await analyzeIncident({ incidentId: activeIncidentId, inputType: "MANUAL_TEXT", text: incidentText.trim() });
        setAnalysis(refreshed);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "현장 확인을 기록하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel(role: "INCIDENT" | "FACILITY", confirmationId: string) {
    if (!activeIncidentId || busy) return;
    setBusy("confirmation");
    try {
      await cancelConfirmation(activeIncidentId, role, confirmationId);
      setConfirmationIds((current) => current.filter((id) => id !== confirmationId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "현장 확인을 취소하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveRecord() {
    if (!activeIncidentId || !analysis) {
      setError("사고 분석이 완료된 뒤 대응 기록을 저장할 수 있습니다.");
      return;
    }
    const outcomeReport = toStructuredOutcomeReport(outcomeDraft);
    if (!outcomeReport) {
      setError("시설명, 수행한 대응, 브리프 적용 여부, 최종 대응 결과를 입력해주세요.");
      return;
    }
    setBusy("confirmation");
    setError(null);
    try {
      const response = await saveIncidentRecord(activeIncidentId, {
        analysisIds: [analysis.analysisId],
        confirmationIds,
        conversationStartedAt: messages[0]?.createdAt ?? new Date().toISOString(),
        messages: messages.map((message, index) => ({ ...message, sequence: index + 1 })),
        outcomeReport,
      });
      setSavedRecordId(response.recordId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "대응 기록을 저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function useCandidate(candidate: MaterialCandidate) {
    setSubstanceQuery(`${candidate.displayName} CAS ${candidate.casNumber}`);
    setIncidentText((current) => current ? `${current}\n확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}` : `확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}`);
  }

  return (
    <main className="integrated-main">
      <header className="integrated-main-header">
        <div><button type="button" className="integrated-brand" onClick={() => navigate("/")}>케미체크119</button><span>{region} {station}</span></div>
        <div className="integrated-header-status"><span className={apiConfig.demoEnabled ? "status-demo" : "status-live"} />{apiConfig.demoEnabled ? "공개 합성 시연" : runtimeDataMode === "LIVE_API" ? "서버 연동" : "연결 설정 필요"}<strong>{dispatchContact.phone}</strong></div>
      </header>

      <section className="integrated-main-grid">
        <aside className="integrated-sidebar">
          <FieldToolsPanel
            station={`${region} ${station}`}
            dispatchContact={dispatchContact}
            dataMode={runtimeDataMode}
            gpsLabel={gps.label}
            gpsDetail={gps.detail}
            analysis={analysis}
            incidentId={activeIncidentId}
            messages={messages}
            analysisIds={analysis ? [analysis.analysisId] : []}
            confirmationIds={confirmationIds}
            canSave={Boolean(analysis)}
            recordAvailable={apiConfig.recordEnabled && Boolean(activeIncidentId)}
            dispatchStreamAvailable={false}
            dispatchStreamStatus="IDLE"
            dispatchPreview={null}
            dispatchAccepted={false}
            syntheticMode={isSynthetic}
            onRequestSave={() => void handleSaveRecord()}
            onContactAttempt={() => undefined}
            onConnectDispatch={() => undefined}
            onAcceptDispatch={() => undefined}
          />
        </aside>

        <section className="integrated-main-content">
          <div className="integrated-content-heading"><div><p className="integrated-kicker">FIELD RESPONSE WORKSPACE</p><h1>사고 맥락을 정리하고<br />확인할 다음 행동을 준비합니다.</h1></div><div className="integrated-incident-id">{activeIncidentId ?? "사고 접수 전"}</div></div>
          {error && <div className="integrated-error" role="alert"><AlertTriangle size={15} />{error}</div>}

          <section className="integrated-composer-panel" aria-label="사고 분석 입력">
            <div><h2>신고 내용과 현장 관찰</h2><p>후보는 자동 확정하지 않습니다. 신고문을 입력하면 공식 근거와 현장 확인 순서를 정리합니다.</p></div>
            <MessageComposer mode="collision" value={incidentText} loading={busy === "analysis"} unavailable={false} speechEnabled={apiConfig.speechEnabled} incidentId={activeIncidentId} onChange={setIncidentText} onSubmit={(value) => void runAnalysis(value)} />
          </section>

          <div className="integrated-columns">
            <section className="integrated-card"><div className="integrated-card-heading"><h2>초기 분석과 현장 확인</h2>{busy === "confirmation" && <LoaderCircle size={16} className="animate-spin" />}</div><IncidentAnalysisCard analysis={analysis} onConfirm={(role, cas, name) => void handleConfirm(role, cas, name)} confirmingRole={busy === "confirmation" ? "INCIDENT" : null} onCancel={(role, id) => void handleCancel(role, id)} confirmationMode={isSynthetic ? "PUBLIC_SYNTHETIC" : "FIELD"} /></section>
            <section className="integrated-card"><div className="integrated-card-heading"><h2>운영 에이전트</h2></div><AgentPanel agent={analysis?.agent} syntheticMode={isSynthetic} loading={busy === "analysis"} /></section>
          </div>

          {analysis && <section className="integrated-card"><div className="integrated-card-heading"><div><h2>구조화된 대응 기록</h2><p className="integrated-card-subtitle">실제 현장 결과를 입력한 뒤 저장합니다. 후보·분석 결과는 서버 기록과 연결됩니다.</p></div>{savedRecordId && <span className="integrated-saved">저장 완료 · {savedRecordId}</span>}</div><div className="integrated-outcome-form"><StructuredOutcomeForm value={outcomeDraft} onChange={setOutcomeDraft} /><button type="button" disabled={busy === "confirmation"} onClick={() => void handleSaveRecord()} className="integrated-save-button">{busy === "confirmation" ? "저장 중..." : "현재 대응 기록 저장"}</button></div></section>}

          <section className="integrated-card"><div className="integrated-card-heading"><h2>공공 데이터 기반 물질 후보 탐색</h2><div className="integrated-search"><input value={substanceQuery} onChange={(event) => setSubstanceQuery(event.target.value)} placeholder="물질명·CAS·색·냄새·상태" /><button type="button" disabled={busy === "substance"} onClick={() => void runSubstanceSearch()}>{busy === "substance" ? "검색 중" : "검색"}</button></div></div><SubstanceResults result={substanceResult} incidentAvailable={Boolean(activeIncidentId)} onUseCandidate={useCandidate} /></section>

          <section className="integrated-card integrated-map-card"><div className="integrated-card-heading"><h2>사고·출동 위치</h2><span>{gps.label}</span></div>{mapContext ? <IncidentMap context={mapContext} isDark={false} gps={gps} /> : <div className="integrated-map-empty"><MapPinned size={24} /><p>분석 결과에 위치 정보가 포함되면 지도와 경로를 표시합니다.</p></div>}</section>
        </section>
      </section>
    </main>
  );
}
