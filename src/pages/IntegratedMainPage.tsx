import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Check, Info, LockKeyhole, Phone, Save } from "lucide-react";
import { analyzeIncident } from "../api/incidents";
import { confirmSubstance, cancelConfirmation } from "../api/confirmations";
import { discoverSubstances } from "../api/substances";
import { saveIncidentRecord } from "../api/records";
import { receiveContestIncident } from "../api/intake";
import { createPhoneSession, reviewPhoneTranscript, subscribeToPhoneTranscripts } from "../api/phone";
import { apiConfig, runtimeDataMode } from "../api/config";
import type { IncidentAnalysisResponse, MaterialCandidate, PhoneTranscriptEvent, SessionContextResponse } from "../api/contracts";
import { resetDemoSession } from "../fixtures/demo";
import { ResponderBrief, type ConfirmedMaterials } from "../features/incident/ResponderBrief";
import { FieldToolsPanel, type DispatchPreview, type DispatchStreamStatus, type FieldRecordMessage } from "../features/field-tools/FieldToolsPanel";
import { MessageComposer } from "../features/composer/MessageComposer";
import { SubstanceResults } from "../features/substance-search/SubstanceResults";
import { StructuredOutcomeForm, emptyStructuredOutcomeDraft, toStructuredOutcomeReport, type StructuredOutcomeDraft } from "../features/records/StructuredOutcomeForm";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../app/components/ui/dialog";
import { composeManualReport } from "../features/incident/reportInput";
import "../styles/main.css";
import "../styles/responder-workspace.css";
import "../styles/original-workspace.css";

function makeIncidentId() {
  return `INC-${Date.now()}`;
}

function phoneReviewStatusLabel(status: PhoneTranscriptEvent["reviewStatus"] | undefined) {
  switch (status) {
    case "INTERIM": return "통화 중";
    case "FINAL_PENDING_REVIEW": return "최종 전사 확인 필요";
    case "REVIEWED": return "담당자 승인 완료";
    case "ANALYZED": return "분석 완료";
    default: return "통화 대기";
  }
}

export default function IntegratedMainPage({ session = null }: { session?: SessionContextResponse | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const region = location.state?.region ?? "지역 미선택";
  const station = session?.stationDisplayName ?? location.state?.station ?? "소방서 미선택";
  const requestedPhoneIncident = new URLSearchParams(location.search).get("phoneIncident");
  // This is only a recovery locator, never proof of access or reviewed content.
  // The authenticated backend authorizes and replays the persisted transcript.
  const recoveredPhoneIncident = requestedPhoneIncident && /^INC-PHONE-[A-Za-z0-9-]{1,100}$/.test(requestedPhoneIncident)
    ? requestedPhoneIncident : null;
  const incidentId = recoveredPhoneIncident ?? location.state?.incidentId ?? (apiConfig.demoEnabled ? "INC-PUBLIC-DEMO-001" : null);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(incidentId);
  const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
  const [incidentText, setIncidentText] = useState("");
  const [substanceQuery, setSubstanceQuery] = useState("");
  const [substanceResult, setSubstanceResult] = useState<Awaited<ReturnType<typeof discoverSubstances>> | null>(null);
  const [busy, setBusy] = useState<"analysis" | "substance" | "confirmation" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<FieldRecordMessage[]>([]);
  const [confirmationIds, setConfirmationIds] = useState<Partial<Record<"INCIDENT" | "FACILITY", string>>>({});
  const [outcomeDraft, setOutcomeDraft] = useState<StructuredOutcomeDraft>(() => emptyStructuredOutcomeDraft());
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState("");
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [confirmedMaterials, setConfirmedMaterials] = useState<ConfirmedMaterials>({});
  const analyzedTextRef = useRef("");
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStreamStatus>("IDLE");
  const [dispatchPreview, setDispatchPreview] = useState<DispatchPreview | null>(null);
  const [dispatchAccepted, setDispatchAccepted] = useState(false);
  const [phoneTranscript, setPhoneTranscript] = useState<PhoneTranscriptEvent | null>(null);
  const [phoneReviewText, setPhoneReviewText] = useState("");
  const [phoneStreamError, setPhoneStreamError] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const activeIncidentId = analysis?.incidentId ?? currentIncidentId;
  const isSynthetic = apiConfig.demoEnabled;
  const phoneReviewReady = phoneTranscript?.reviewStatus === "FINAL_PENDING_REVIEW";
  const phoneAnalysisReady = phoneTranscript?.reviewStatus === "REVIEWED" || phoneTranscript?.reviewStatus === "ANALYZED";
  const phoneDisplayStatus = analysis && phoneAnalysisReady ? "ANALYZED" : phoneTranscript?.reviewStatus;

  useEffect(() => {
    if (!currentIncidentId || !session) return undefined;
    let subscription: { close: () => void } | undefined;
    try {
      subscription = subscribeToPhoneTranscripts(
        currentIncidentId,
        (event) => {
          setPhoneTranscript(event);
          setPhoneStreamError(false);
          if (event.reviewStatus !== "INTERIM") {
            setPhoneReviewText(event.text);
            setIncidentText(event.text);
          }
        },
        () => setPhoneStreamError(true),
        () => setPhoneStreamError(false),
      );
    } catch {
      setPhoneStreamError(true);
    }
    return () => subscription?.close();
  }, [currentIncidentId, session]);

  const dispatchContact = useMemo(() => ({
    name: "케미체크119 상황실",
    phone: apiConfig.dispatchCenterPhone || (apiConfig.demoEnabled ? "070-5276-7681" : ""),
  }), []);

  async function handleConnectDispatch() {
    if (!apiConfig.presentationScenarioEnabled || busy) return;
    setDispatchStatus("WAITING");
    setError(null);
    try {
      const envelope = await receiveContestIncident();
      setCurrentIncidentId(envelope.incidentId);
      setDispatchPreview({
        receivedAt: envelope.receivedAt,
        stationDisplayName: envelope.stationDisplayName,
        facilityName: envelope.facilityName,
        addressText: envelope.addressText,
        reportText: envelope.reportText,
        requestId: envelope.requestId,
        disclosure: envelope.disclosure,
      });
      setDispatchStatus("RECEIVED");
    } catch (nextError) {
      setDispatchStatus("ERROR");
      setError(nextError instanceof Error ? nextError.message : "지령을 수신하지 못했습니다.");
    }
  }

  async function handlePreparePhoneSession() {
    if ((!session && !isSynthetic) || phoneBusy || busy) return;
    setPhoneBusy(true);
    setError(null);
    // Do not erase the current report unless preparation actually succeeds.
    let created: Awaited<ReturnType<typeof createPhoneSession>> | undefined;
    if (!isSynthetic) {
      try {
        created = await createPhoneSession();
        if (created.incidentId === currentIncidentId) return;
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "전화 접수 세션을 만들지 못했습니다.");
        return;
      } finally {
        setPhoneBusy(false);
      }
    }
    setCurrentIncidentId(null);
    setShowRecordForm(false);
    setSelectedIncident("");
    setSelectedObservations([]);
    analyzedTextRef.current = "";
    setConfirmedMaterials({});
    setPhoneTranscript(null);
    setPhoneReviewText("");
    setIncidentText("");
    setAnalysis(null);
    setConfirmationIds({});
    setMessages([]);
    setOutcomeDraft(emptyStructuredOutcomeDraft());
    setSavedRecordId(null);
    setSubstanceQuery("");
    setSubstanceResult(null);
    setDispatchPreview(null);
    setDispatchAccepted(false);
    setDispatchStatus("IDLE");
    try {
      if (isSynthetic) {
        resetDemoSession();
        const syntheticIncidentId = `INC-PUBLIC-PHONE-${Date.now()}`;
        setCurrentIncidentId(syntheticIncidentId);
        setPhoneTranscript({
          eventId: "TRX-PUBLIC-SYNTHETIC:r0",
          incidentId: syntheticIncidentId,
          transcriptId: "TRX-PUBLIC-SYNTHETIC",
          callId: "CALL-PUBLIC-SYNTHETIC",
          text: "탱크 주변에서 자극적인 냄새가 나고 흰 연기가 보입니다.",
          language: "ko",
          isFinal: false,
          reviewStatus: "INTERIM",
          revision: 0,
          segmentIndex: 1,
          reviewedBy: null,
          reviewedAt: null,
          receivedAt: new Date().toISOString(),
        });
        setPhoneStreamError(false);
        return;
      }
      if (!created) return;
      setCurrentIncidentId(created.incidentId);
      // Store only an opaque incident locator, not caller data or transcript.
      const search = new URLSearchParams(location.search);
      search.set("phoneIncident", created.incidentId);
      navigate({ pathname: location.pathname, search: search.toString() }, { replace: true, state: location.state });
      setPhoneStreamError(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "전화 접수 세션을 만들지 못했습니다.");
    } finally {
      setPhoneBusy(false);
    }
  }

  function handleSyntheticCallEnd() {
    if (!isSynthetic || !currentIncidentId || phoneTranscript?.reviewStatus !== "INTERIM") return;
    const finalEvent: PhoneTranscriptEvent = {
      ...phoneTranscript,
      eventId: "TRX-PUBLIC-SYNTHETIC-FINAL:r0",
      transcriptId: "TRX-PUBLIC-SYNTHETIC-FINAL",
      text: "탱크 주변에서 자극적인 냄새와 흰 연기가 보이며 작업자 한 명이 어지러움을 호소합니다.",
      isFinal: true,
      reviewStatus: "FINAL_PENDING_REVIEW",
      segmentIndex: 2,
      receivedAt: new Date().toISOString(),
    };
    setPhoneTranscript(finalEvent);
    setPhoneReviewText(finalEvent.text);
    setIncidentText(finalEvent.text);
  }

  async function handleReviewPhoneTranscript() {
    if (!currentIncidentId || !phoneTranscript || !phoneReviewReady || phoneBusy) return;
    setPhoneBusy(true);
    setError(null);
    try {
      if (isSynthetic) {
        const reviewed: PhoneTranscriptEvent = {
          ...phoneTranscript,
          eventId: `${phoneTranscript.transcriptId}:r1`,
          text: phoneReviewText.trim(),
          reviewStatus: "REVIEWED",
          revision: 1,
          reviewedBy: "PUBLIC_SYNTHETIC_OPERATOR",
          reviewedAt: new Date().toISOString(),
        };
        setPhoneTranscript(reviewed);
        setIncidentText(reviewed.text);
        return;
      }
      const reviewed = await reviewPhoneTranscript(currentIncidentId, phoneTranscript.transcriptId, {
        text: phoneReviewText.trim(),
        expectedRevision: phoneTranscript.revision,
      });
      setPhoneTranscript(reviewed);
      setIncidentText(reviewed.text);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "최종 전사를 승인하지 못했습니다.");
    } finally {
      setPhoneBusy(false);
    }
  }

  function handleAcceptDispatch() {
    if (!dispatchPreview) return;
    setIncidentText(dispatchPreview.reportText);
    setDispatchAccepted(true);
  }

  async function runAnalysis(value = incidentText) {
    if (!value.trim() || busy || phoneBusy) return;
    if (phoneTranscript && !phoneAnalysisReady) {
      setError("최종 전화 전사를 수정·승인한 뒤 분석할 수 있습니다.");
      return;
    }
    if (phoneTranscript && value.trim() !== phoneTranscript.text.trim()) {
      setError("승인 후 변경된 전사는 분석할 수 없습니다. 새 전화 접수 세션에서 다시 검토하세요.");
      return;
    }
    const submittedText = phoneTranscript ? value.trim() : composeManualReport(value, {
      incidentType: selectedIncident,
      facilityName: outcomeDraft.facilityName,
      facilityAddress: outcomeDraft.facilityAddress,
      observations: selectedObservations,
    });
    setBusy("analysis");
    setError(null);
    try {
      const result = await analyzeIncident(phoneTranscript ? {
        incidentId: activeIncidentId ?? makeIncidentId(),
        inputType: "PHONE_TRANSCRIPT",
        text: submittedText,
        phoneTranscriptId: phoneTranscript.transcriptId,
        phoneTranscriptRevision: phoneTranscript.revision,
      } : {
        incidentId: activeIncidentId ?? makeIncidentId(),
        inputType: "MANUAL_TEXT",
        text: submittedText,
      });
      setAnalysis(result);
      analyzedTextRef.current = submittedText;
      setSavedRecordId(null);
      setMessages((current) => [...current, { messageId: `${Date.now()}`, role: "USER", text: submittedText, createdAt: new Date().toISOString() }]);
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
      setConfirmationIds((current) => ({ ...current, [role]: response.confirmationId }));
      setConfirmedMaterials((current) => ({ ...current, [role]: { casNumber, displayName } }));
      setSavedRecordId(null);
      if (incidentText.trim()) {
        const refreshed = await analyzeIncident(phoneTranscript ? {
          incidentId: activeIncidentId,
          inputType: "PHONE_TRANSCRIPT",
          text: phoneTranscript.text,
          phoneTranscriptId: phoneTranscript.transcriptId,
          phoneTranscriptRevision: phoneTranscript.revision,
        } : { incidentId: activeIncidentId, inputType: "MANUAL_TEXT", text: analyzedTextRef.current || incidentText.trim() });
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
    setAnalysis(null);
    setSavedRecordId(null);
    try {
      await cancelConfirmation(activeIncidentId, role, confirmationId);
      setConfirmationIds((current) => ({ ...current, [role]: undefined }));
      setConfirmedMaterials((current) => ({ ...current, [role]: undefined }));
      if (incidentText.trim()) {
        const refreshed = await analyzeIncident(phoneTranscript ? {
          incidentId: activeIncidentId,
          inputType: "PHONE_TRANSCRIPT",
          text: phoneTranscript.text,
          phoneTranscriptId: phoneTranscript.transcriptId,
          phoneTranscriptRevision: phoneTranscript.revision,
        } : { incidentId: activeIncidentId, inputType: "MANUAL_TEXT", text: analyzedTextRef.current || incidentText.trim() });
        setAnalysis(refreshed);
      }
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
        confirmationIds: Object.values(confirmationIds).filter((value): value is string => Boolean(value)),
        conversationStartedAt: messages[0]?.createdAt ?? new Date().toISOString(),
        messages: messages.map((message, index) => ({ ...message, sequence: index + 1 })),
        outcomeReport,
      });
      setSavedRecordId(response.recordId);
      sessionStorage.setItem("chemicheck119:last-record", JSON.stringify({
        recordId: response.recordId,
        incidentId: response.incidentId,
        savedAt: response.savedAt,
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "대응 기록을 저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function useCandidate(candidate: MaterialCandidate) {
    if (phoneTranscript) return;
    setSubstanceQuery(`${candidate.displayName} CAS ${candidate.casNumber}`);
    setIncidentText((current) => current ? `${current}\n확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}` : `확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}`);
  }


  const briefProps = {
    analysis, busy: Boolean(busy), synthetic: isSynthetic, confirmedMaterials, confirmationIds,
    onConfirm: (role: "INCIDENT" | "FACILITY", cas: string, name: string) => void handleConfirm(role, cas, name),
    onCancel: (role: "INCIDENT" | "FACILITY", id: string) => void handleCancel(role, id),
  };
  const formBusy = Boolean(busy) || phoneBusy;
  const updateOutcome = (next: StructuredOutcomeDraft) => { setOutcomeDraft(next); setSavedRecordId(null); };

  return (
    <div className="main-page classic-workspace">
      <header className="main-header">
        <div className="main-header-left">
          <button type="button" className="main-logo classic-home" onClick={() => navigate("/")}><img src="/images/logonavy.jpg" alt="케미체크119 화학재난대응지원시스템" /></button>
          <div className="header-divider" />
          <div className="station-badge">{region} {station}</div>
          <span className="classic-environment">{isSynthetic ? "공개 합성 시연 · 실운영 아님" : runtimeDataMode === "LIVE_API" ? "서버 연동" : "연결 설정 필요"}</span>
        </div>
        <div className="main-header-right">
          <div className={`header-phone-status ${phoneStreamError ? "is-error" : phoneAnalysisReady ? "is-received" : ""}`} aria-label="전화 연결 상태">
            <span className="header-phone-indicator" aria-hidden="true" />
            <div><strong>{isSynthetic ? "합성 전화 시연" : dispatchContact.phone ? `전화 ${dispatchContact.phone}` : "전화 접수"}</strong><em>{phoneStreamError ? "전사 재연결 중" : !currentIncidentId ? "접수 준비 필요" : phoneReviewStatusLabel(phoneDisplayStatus)}</em></div>
          </div>
          <div className="record-actions">
            <Dialog open={showRecordForm} onOpenChange={setShowRecordForm}>
              <DialogTrigger asChild><button className="save-button" type="button" disabled={!analysis}><Save className="save-icon" />기록 저장</button></DialogTrigger>
              <DialogContent className="classic-record-dialog">
                <DialogTitle>대응 기록 입력</DialogTitle>
                <DialogDescription>{isSynthetic ? "합성 시연 기록 · 운영 기록 저장소에는 반영되지 않습니다." : "현장에서 수행한 조치와 관찰한 결과만 기록하세요."}</DialogDescription>
                {error && <p className="classic-error" role="alert">{error}</p>}
                {savedRecordId && <p className="classic-saved" role="status"><Check size={18} />{isSynthetic ? "시연 저장 완료" : "저장 완료"}</p>}
                <div className="classic-record-scroll"><StructuredOutcomeForm value={outcomeDraft} onChange={updateOutcome} /></div>
                <button className="analyze-button" disabled={Boolean(busy)} onClick={() => void handleSaveRecord()}>{busy ? "저장 중…" : "현재 대응 기록 저장"}</button>
              </DialogContent>
            </Dialog>
            <button className="records-link-button" type="button" onClick={() => navigate("/records")}>대응 기록 조회</button>
          </div>
        </div>
      </header>
      {error && !showRecordForm && <div className="classic-error" role="alert"><AlertTriangle size={18} />{error}</div>}
      <main className="main-workspace" aria-label="현장 대응 작업공간">
        <section className="main-panel incident-panel" aria-labelledby="classic-incident-title">
          <div className="panel-title"><h2 id="classic-incident-title">현재 사고정보</h2></div>
          <div className="incident-form classic-panel-scroll" aria-label="사고정보 입력 영역" tabIndex={0}>
            <div className="classic-phone-row">
              <span className="classic-phone-label"><Phone size={17} />{phoneStreamError ? "전사 재연결 중" : !currentIncidentId ? "접수 준비 필요" : phoneReviewStatusLabel(phoneDisplayStatus)}</span>
              <button className="chemical-add-button" disabled={(!session && !isSynthetic) || formBusy} onClick={() => void handlePreparePhoneSession()}>{phoneBusy ? "준비 중…" : isSynthetic ? "합성 통화 시작" : phoneTranscript ? "새 전화 접수" : "전화 접수 준비"}</button>
            </div>
            <div className="form-group">
              <label>사고 유형</label>
              <div className="incident-type-list">{["화재", "누출", "폭발", "구조", "기타"].map((type) => <button key={type} type="button" className={`incident-type-button ${selectedIncident === type ? "selected" : ""}`} aria-pressed={selectedIncident === type} disabled={formBusy || Boolean(phoneTranscript)} onClick={() => setSelectedIncident(selectedIncident === type ? "" : type)}>{type}</button>)}</div>
            </div>
            <div className="form-group"><label htmlFor="classic-facility">시설명</label><input id="classic-facility" value={outcomeDraft.facilityName} disabled={formBusy} onChange={(event) => updateOutcome({ ...outcomeDraft, facilityName: event.target.value })} placeholder="확인된 시설명 입력" /></div>
            <div className="form-group"><label htmlFor="classic-address">사고 위치</label><input id="classic-address" value={outcomeDraft.facilityAddress} disabled={formBusy} onChange={(event) => updateOutcome({ ...outcomeDraft, facilityAddress: event.target.value })} placeholder="확인된 주소 입력" /></div>
            <section className="form-group classic-report" aria-label="신고 내용">
              {phoneTranscript?.reviewStatus === "INTERIM" ? <>
                <label>실시간 전사 · 검토 전</label><div className="classic-transcript-draft">{phoneTranscript.text}</div>
                <p className="classic-helper">통화 중 내용은 아직 분석하지 않습니다.</p>
                {isSynthetic && <button className="analyze-button" onClick={handleSyntheticCallEnd}>합성 통화 종료</button>}
              </> : phoneTranscript ? <>
                <label htmlFor="phone-review-text">{phoneAnalysisReady ? "승인된 신고 내용" : "최종 전사 확인"}</label>
                <textarea id="phone-review-text" value={phoneReviewText} readOnly={!phoneReviewReady} disabled={phoneBusy} onChange={(event) => setPhoneReviewText(event.target.value)} />
                <p className="classic-helper">{phoneAnalysisReady ? "전화 분석에는 승인된 전사만 사용합니다." : "잘못 들린 내용을 수정한 뒤 승인하세요."}</p>
                {phoneAnalysisReady ? <button className="analyze-button" aria-label="사고 분석" disabled={formBusy} onClick={() => void runAnalysis(phoneTranscript.text)}>{busy === "analysis" ? "분석 중…" : "초기 대응 분석 시작"}</button> : <button className="analyze-button" disabled={!phoneReviewReady || !phoneReviewText.trim() || phoneBusy} onClick={() => void handleReviewPhoneTranscript()}>{phoneBusy ? "승인 중…" : "이 내용으로 승인"}</button>}
              </> : <>
                <label>신고 내용</label>
                <MessageComposer mode="collision" value={incidentText} loading={busy === "analysis"} unavailable={phoneBusy} speechEnabled={apiConfig.speechEnabled} incidentId={activeIncidentId} onChange={setIncidentText} onSubmit={(value) => void runAnalysis(value)} />
              </>}
            </section>
            {!phoneTranscript && <div className="form-group"><label>현장 관찰정보</label><div className="observation-list">{["연기", "화염", "액체 누출", "냄새", "색상"].map((item) => <button type="button" key={item} className={`observation-button ${selectedObservations.includes(item) ? "selected" : ""}`} aria-pressed={selectedObservations.includes(item)} disabled={formBusy} onClick={() => setSelectedObservations((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}>{item}</button>)}</div></div>}
            <details className="classic-secondary"><summary>화학물질 검색</summary><div className="chemical-input-row"><input aria-label="물질명 또는 CAS" value={substanceQuery} onChange={(event) => setSubstanceQuery(event.target.value)} placeholder="물질명 또는 CAS" /><button className="chemical-add-button" disabled={Boolean(busy) || !substanceQuery.trim()} onClick={() => void runSubstanceSearch()}>{busy === "substance" ? "검색 중…" : "검색"}</button></div><SubstanceResults result={substanceResult} incidentAvailable={Boolean(activeIncidentId) && !phoneTranscript} onUseCandidate={useCandidate} /></details>
            <details className="classic-secondary"><summary>지원 도구</summary><FieldToolsPanel station={`${region} ${station}`} dispatchContact={dispatchContact} dataMode={runtimeDataMode} analysis={analysis} incidentId={activeIncidentId} messages={messages} analysisIds={analysis ? [analysis.analysisId] : []} confirmationIds={Object.values(confirmationIds).filter((value): value is string => Boolean(value))} canSave={Boolean(analysis)} recordAvailable={apiConfig.recordEnabled && Boolean(activeIncidentId)} recordSaved={Boolean(savedRecordId)} dispatchStreamAvailable={apiConfig.presentationScenarioEnabled} dispatchStreamStatus={dispatchStatus} dispatchPreview={dispatchPreview} dispatchAccepted={dispatchAccepted} syntheticMode={isSynthetic} onRequestSave={() => setShowRecordForm(true)} onContactAttempt={() => undefined} onConnectDispatch={() => void handleConnectDispatch()} onAcceptDispatch={handleAcceptDispatch} /></details>
          </div>
        </section>
        <section className="main-panel analysis-panel" aria-labelledby="classic-analysis-title">
          <div className="panel-title"><h2 id="classic-analysis-title">초기 대응 분석</h2></div>
          <div className="analysis-result classic-panel-scroll" aria-label="물질 확인 영역" tabIndex={0}>
            {analysis ? <ResponderBrief {...briefProps} panel="materials" /> : <div className="analysis-empty"><Info size={36} /><p>{busy === "analysis" ? "신고 내용을 분석하고 있습니다." : <>신고 내용을 확인한 뒤<br />초기 대응 분석을 시작하세요.</>}</p></div>}
          </div>
        </section>
        <section className="main-panel ai-panel" aria-labelledby="classic-response-title">
          <div className="panel-title"><h2 id="classic-response-title">AI 현장 대응 지원</h2></div>
          <div className="chat-message-list classic-panel-scroll" aria-label="현장 대응 지원 영역" tabIndex={0}>
            {analysis ? <ResponderBrief {...briefProps} panel="response" /> : <div className="classic-response-waiting"><LockKeyhole size={32} /><h3>물질 확인 후 제공됩니다</h3><p>사고물질과 시설물질을 각각 확인하면<br />대응 참고사항을 표시합니다.</p></div>}
          </div>
          <div className="classic-authority">참고 정보입니다. 최종 판단은 현장 지휘관이 합니다.</div>
        </section>
      </main>
    </div>
  );
}
