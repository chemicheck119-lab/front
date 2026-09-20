import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardList, Phone, Wrench } from "lucide-react";
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
import "../styles/responder-workspace.css";

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
  const incidentId = location.state?.incidentId ?? (apiConfig.demoEnabled ? "INC-PUBLIC-DEMO-001" : null);
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
  const [view, setView] = useState<"intake" | "field" | "record" | "tools">("intake");
  const [inputMode, setInputMode] = useState<"PHONE" | "MANUAL">("PHONE");
  const [confirmedMaterials, setConfirmedMaterials] = useState<ConfirmedMaterials>({});
  const paneRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (paneRef.current) {
      paneRef.current.scrollTop = 0;
      paneRef.current.focus();
    }
  }, [view]);

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
    setCurrentIncidentId(null);
    setView("intake");
    setInputMode("PHONE");
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
      const created = await createPhoneSession();
      setCurrentIncidentId(created.incidentId);
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
    setInputMode("MANUAL");
    setView("intake");
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
    setBusy("analysis");
    setError(null);
    try {
      const result = await analyzeIncident(phoneTranscript ? {
        incidentId: activeIncidentId ?? makeIncidentId(),
        inputType: "PHONE_TRANSCRIPT",
        text: value.trim(),
        phoneTranscriptId: phoneTranscript.transcriptId,
        phoneTranscriptRevision: phoneTranscript.revision,
      } : {
        incidentId: activeIncidentId ?? makeIncidentId(),
        inputType: "MANUAL_TEXT",
        text: value.trim(),
      });
      setAnalysis(result);
      setView("field");
      setSavedRecordId(null);
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
        } : { incidentId: activeIncidentId, inputType: "MANUAL_TEXT", text: incidentText.trim() });
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
        } : { incidentId: activeIncidentId, inputType: "MANUAL_TEXT", text: incidentText.trim() });
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
    setSubstanceQuery(`${candidate.displayName} CAS ${candidate.casNumber}`);
    setIncidentText((current) => current ? `${current}\n확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}` : `확인 후보: ${candidate.displayName} CAS ${candidate.casNumber}`);
    setView("intake");
    setInputMode("MANUAL");
  }

  return (
    <main className="responder-workspace">
      <header className="focus-app-header">
        <div><button type="button" className="focus-brand" onClick={() => navigate("/")}>케미체크119</button><span>{region} {station}</span></div>
        <span className="focus-environment">{isSynthetic ? "공개 합성 시연 · 실운영 아님" : runtimeDataMode === "LIVE_API" ? "서버 연동" : "연결 설정 필요"}</span>
      </header>
      <nav className="focus-navigation" aria-label="업무 화면">
        <div className="focus-role-tabs">
          <button type="button" aria-pressed={view === "intake"} onClick={() => setView("intake")}>상황실 · 신고 접수</button>
          <button type="button" aria-pressed={view === "field"} disabled={!analysis && view !== "field"} onClick={() => setView("field")}>현장 · 확인·대응</button>
        </div>
        <div className="focus-utility-tabs">
          <button type="button" aria-pressed={view === "record"} disabled={!analysis} onClick={() => setView("record")}><ClipboardList size={18} />대응 기록</button>
          <button type="button" aria-pressed={view === "tools"} onClick={() => setView("tools")}><Wrench size={18} />지원 도구</button>
        </div>
      </nav>
      {error && <div className="focus-error" role="alert"><AlertTriangle size={20} />{error}</div>}
      <div className="focus-pane" ref={paneRef} tabIndex={-1} aria-label="현재 업무 내용">
        <div className={`focus-view ${view === "intake" ? "focus-intake-view" : ""}`}>
          {view === "intake" && <>
            <header className="focus-section-heading"><div><p className="focus-eyebrow">상황실</p><h1>신고 내용을 확인하세요</h1></div>{analysis && <button className="focus-text-button" onClick={() => setView("field")}>현장 화면으로 <ArrowRight size={18} /></button>}</header>
            {!phoneTranscript && <div className="focus-input-tabs"><button aria-pressed={inputMode === "PHONE"} onClick={() => setInputMode("PHONE")}>전화 전사</button><button aria-pressed={inputMode === "MANUAL"} onClick={() => setInputMode("MANUAL")}>직접 입력</button></div>}
            {inputMode === "PHONE" || phoneTranscript ? <section className="focus-intake-card" aria-label="전화 신고">
              <div className="focus-intake-status"><span className={`focus-badge ${phoneAnalysisReady ? "is-done" : "is-pending"}`} role="status">{phoneAnalysisReady && <Check size={16} />}{phoneStreamError ? "전사 연결 확인 필요" : phoneReviewStatusLabel(phoneTranscript?.reviewStatus)}</span>{phoneTranscript && <button className="focus-text-button" disabled={phoneBusy || Boolean(busy)} onClick={() => void handlePreparePhoneSession()}>{isSynthetic ? "합성 통화 시작" : "새 전화 접수"}</button>}</div>
              {!phoneTranscript && <div className="focus-phone-start"><Phone size={36} /><h2>전화 신고를 받을 준비가 됐습니다</h2><p>통화가 끝나면 담당자가 전사를 확인합니다.</p><button className="focus-primary" disabled={(!session && !isSynthetic) || phoneBusy || Boolean(busy)} onClick={() => void handlePreparePhoneSession()}>{phoneBusy ? "접수 준비 중…" : isSynthetic ? "합성 통화 시작" : "전화 접수 준비"}<ArrowRight size={20} /></button></div>}
              {phoneTranscript?.reviewStatus === "INTERIM" && <><div className="focus-transcript"><p>{phoneTranscript.text}</p></div><div className="focus-intake-action"><p>통화 중 내용은 아직 분석하지 않습니다.</p>{isSynthetic && <button className="focus-primary" onClick={handleSyntheticCallEnd}>합성 통화 종료</button>}</div></>}
              {phoneTranscript && phoneTranscript.reviewStatus !== "INTERIM" && <>
                <label className="focus-input-label" htmlFor="phone-review-text">{phoneAnalysisReady ? "승인된 신고 내용" : "최종 전사 확인"}</label>
                <textarea id="phone-review-text" className="focus-transcript-input" value={phoneReviewText} readOnly={!phoneReviewReady} onChange={(event) => setPhoneReviewText(event.target.value)} />
                <div className="focus-intake-action"><p>{phoneAnalysisReady ? "승인한 내용으로 물질 후보를 찾습니다." : "잘못 들린 내용을 수정한 뒤 승인하세요."}</p>{phoneAnalysisReady ? <button className="focus-primary" aria-label="사고 분석" disabled={Boolean(busy) || phoneBusy} onClick={() => void runAnalysis(phoneTranscript.text)}>{busy === "analysis" ? "물질 후보 찾는 중…" : "물질 후보 확인"}<ArrowRight size={20} /></button> : <button className="focus-primary" disabled={!phoneReviewReady || !phoneReviewText.trim() || phoneBusy} onClick={() => void handleReviewPhoneTranscript()}>{phoneBusy ? "승인 중…" : "이 내용으로 승인"}<Check size={20} /></button>}</div>
              </>}
            </section> : <section className="focus-intake-card focus-manual" aria-label="사고 분석 입력"><label className="focus-input-label">신고 내용</label><MessageComposer mode="collision" value={incidentText} loading={busy === "analysis"} unavailable={phoneBusy} speechEnabled={apiConfig.speechEnabled} incidentId={activeIncidentId} onChange={setIncidentText} onSubmit={(value) => void runAnalysis(value)} /><p className="focus-helper">확인되지 않은 내용은 추정하지 말고, 신고받은 그대로 입력하세요.</p></section>}
          </>}

          {view === "field" && <>
            {incidentText && <details className="focus-report-strip"><summary>신고 내용 <span>{incidentText.split("\n")[0]}</span></summary><p>{incidentText}</p></details>}
            <ResponderBrief analysis={analysis} busy={Boolean(busy)} synthetic={isSynthetic} confirmedMaterials={confirmedMaterials} confirmationIds={confirmationIds} onConfirm={(role, cas, name) => void handleConfirm(role, cas, name)} onCancel={(role, id) => void handleCancel(role, id)} />
          </>}

          {view === "record" && analysis && <>
            <header className="focus-section-heading"><div><p className="focus-eyebrow">대응 기록</p><h1>수행한 조치만 기록하세요</h1></div><button className="focus-text-button" onClick={() => setView("field")}><ArrowLeft size={18} />현장 화면</button></header>
            <section className="focus-record-card"><div className="focus-record-notice">{isSynthetic ? "합성 시연 기록 · 운영 기록 저장소에는 반영되지 않습니다." : "확인한 물질과 대응 참고 결과가 함께 저장됩니다."}{savedRecordId && <strong role="status"><Check size={18} />{isSynthetic ? "시연 저장 완료" : "저장 완료"}</strong>}</div><div className="integrated-outcome-form"><StructuredOutcomeForm value={outcomeDraft} onChange={(next) => { setOutcomeDraft(next); setSavedRecordId(null); }} /><button type="button" disabled={Boolean(busy)} onClick={() => void handleSaveRecord()} className="focus-primary focus-save">{busy ? "저장 중…" : "현재 대응 기록 저장"}</button></div></section>
          </>}

          {view === "tools" && <>
            <header className="focus-section-heading"><div><p className="focus-eyebrow">필요할 때 사용</p><h1>지원 도구</h1></div><button className="focus-text-button" onClick={() => setView(analysis ? "field" : "intake")}><ArrowLeft size={18} />업무 화면</button></header>
            <div className="focus-tools-layout"><FieldToolsPanel
            station={`${region} ${station}`}
            dispatchContact={dispatchContact}
            dataMode={runtimeDataMode}
            analysis={analysis}
            incidentId={activeIncidentId}
            messages={messages}
            analysisIds={analysis ? [analysis.analysisId] : []}
            confirmationIds={Object.values(confirmationIds).filter((value): value is string => Boolean(value))}
            canSave={Boolean(analysis)}
            recordAvailable={apiConfig.recordEnabled && Boolean(activeIncidentId)}
            recordSaved={Boolean(savedRecordId)}
            dispatchStreamAvailable={apiConfig.presentationScenarioEnabled}
            dispatchStreamStatus={dispatchStatus}
            dispatchPreview={dispatchPreview}
            dispatchAccepted={dispatchAccepted}
            syntheticMode={isSynthetic}
            onRequestSave={() => setView("record")}
            onContactAttempt={() => undefined}
            onConnectDispatch={() => void handleConnectDispatch()}
            onAcceptDispatch={handleAcceptDispatch}
          /><section className="focus-tool-search"><h2>추가 물질 검색</h2><div className="focus-search-row"><input aria-label="물질명 또는 CAS" value={substanceQuery} onChange={(event) => setSubstanceQuery(event.target.value)} placeholder="물질명 또는 CAS" /><button className="focus-primary" disabled={Boolean(busy)} onClick={() => void runSubstanceSearch()}>{busy === "substance" ? "검색 중…" : "검색"}</button></div><SubstanceResults result={substanceResult} incidentAvailable={Boolean(activeIncidentId)} onUseCandidate={useCandidate} /></section></div>
          </>}
        </div>
      </div>
    </main>
  );
}
