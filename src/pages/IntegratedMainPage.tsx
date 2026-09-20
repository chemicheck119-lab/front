import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { analyzeIncident } from "../api/incidents";
import { confirmSubstance, cancelConfirmation } from "../api/confirmations";
import { discoverSubstances } from "../api/substances";
import { saveIncidentRecord } from "../api/records";
import { receiveContestIncident } from "../api/intake";
import { createPhoneSession, reviewPhoneTranscript, subscribeToPhoneTranscripts } from "../api/phone";
import { apiConfig, runtimeDataMode } from "../api/config";
import type { IncidentAnalysisResponse, MaterialCandidate, PhoneTranscriptEvent, SessionContextResponse } from "../api/contracts";
import { resetDemoSession } from "../fixtures/demo";
import { IncidentAnalysisCard } from "../features/incident/IncidentAnalysisCard";
import { FieldToolsPanel, type DispatchPreview, type DispatchStreamStatus, type FieldRecordMessage } from "../features/field-tools/FieldToolsPanel";
import { MessageComposer } from "../features/composer/MessageComposer";
import { SubstanceResults } from "../features/substance-search/SubstanceResults";
import { StructuredOutcomeForm, emptyStructuredOutcomeDraft, toStructuredOutcomeReport, type StructuredOutcomeDraft } from "../features/records/StructuredOutcomeForm";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import "../styles/integrated-main.css";

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
  const [showOnboarding, setShowOnboarding] = useState(true);
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
  }

  return (
    <main className="integrated-main">
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
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
            onRequestSave={() => void handleSaveRecord()}
            onContactAttempt={() => undefined}
            onConnectDispatch={() => void handleConnectDispatch()}
            onAcceptDispatch={handleAcceptDispatch}
          />
        </aside>

        <section className="integrated-main-content">
          <div className="integrated-content-heading"><div><p className="integrated-kicker">상황실·현장 공동 대응</p><h1>확인할 정보와 다음 행동만 보여드립니다.</h1></div><div className="integrated-incident-id">{activeIncidentId ?? "사고 접수 전"}</div></div>
          {error && <div className="integrated-error" role="alert"><AlertTriangle size={15} />{error}</div>}

          <div className="integrated-operational-layout">
            <section className="integrated-workstream" aria-labelledby="dispatch-workstream-title">
              <header className="integrated-workstream-heading"><div><span>상황실</span><h2 id="dispatch-workstream-title">신고 접수·검토</h2></div><p>최종 전사를 확인한 뒤에만 분석합니다.</p></header>
              <div className="integrated-workstream-scroll">
                <section className="integrated-card phone-review-card" aria-labelledby="phone-review-title">
                  <div className="integrated-card-heading">
                    <div><h2 id="phone-review-title">전화 신고</h2><p className="integrated-card-subtitle">통화 중 내용은 임시로만 표시하고, 종료 후 담당자가 수정·승인합니다.</p></div>
                    <button type="button" disabled={(!session && !isSynthetic) || phoneBusy || Boolean(busy)} onClick={() => void handlePreparePhoneSession()}>{phoneBusy ? "준비 중" : isSynthetic ? "합성 통화 시작" : "전화 접수 준비"}</button>
                  </div>
                  <div className="phone-review-status" role="status">
                    <strong>{isSynthetic ? "합성 시연 · " : ""}{!currentIncidentId ? "접수 전" : phoneStreamError ? "연결 확인 필요" : phoneReviewStatusLabel(phoneTranscript?.reviewStatus)}</strong>
                    <span>{currentIncidentId ?? "전화 접수 준비를 눌러 시작하세요."}</span>
                  </div>
                  {phoneTranscript?.reviewStatus === "INTERIM" && <div className="phone-interim"><b>통화 중 내용 · 분석 불가</b><p>{phoneTranscript.text}</p><small>최종 전사가 아니므로 분석에 사용하지 않습니다.</small>{isSynthetic && <button type="button" onClick={handleSyntheticCallEnd}>합성 통화 종료</button>}</div>}
                  {phoneTranscript && phoneTranscript.reviewStatus !== "INTERIM" && (
                    <div className="phone-final-review">
                      <label htmlFor="phone-review-text">최종 전사 확인</label>
                      <textarea id="phone-review-text" value={phoneReviewText} readOnly={!phoneReviewReady} onChange={(event) => setPhoneReviewText(event.target.value)} />
                      <div><span>{phoneAnalysisReady ? "담당자 승인 완료" : "수정 후 승인 필요"}</span><button type="button" disabled={!phoneReviewReady || !phoneReviewText.trim() || phoneBusy} onClick={() => void handleReviewPhoneTranscript()}>{phoneAnalysisReady ? "승인 완료" : "이 내용으로 승인"}</button></div>
                    </div>
                  )}
                </section>

                <section className="integrated-composer-panel" aria-label="사고 분석 입력">
                  <div><h2>확인된 신고 내용</h2><p>승인된 내용만 분석하며, 물질 후보는 자동 확정하지 않습니다.</p></div>
                  <MessageComposer mode="collision" value={incidentText} loading={busy === "analysis"} unavailable={Boolean(phoneTranscript && !phoneAnalysisReady)} speechEnabled={apiConfig.speechEnabled} incidentId={activeIncidentId} onChange={setIncidentText} onSubmit={(value) => void runAnalysis(value)} />
                </section>
              </div>
            </section>

            <section className="integrated-workstream" aria-labelledby="field-workstream-title">
              <header className="integrated-workstream-heading"><div><span>현장 대응</span><h2 id="field-workstream-title">확인·대응 브리프</h2></div><p>확인된 사실, 미확인 정보, 다음 행동을 구분합니다.</p></header>
              <div className="integrated-workstream-scroll">
                <section className="integrated-card integrated-analysis-card"><div className="integrated-card-heading"><h2>현장 확인과 대응 참고</h2>{busy === "confirmation" && <LoaderCircle size={16} className="animate-spin" />}</div><IncidentAnalysisCard analysis={analysis} onConfirm={(role, cas, name) => void handleConfirm(role, cas, name)} confirmingRole={busy === "confirmation" ? "INCIDENT" : null} onCancel={(role, id) => void handleCancel(role, id)} activeConfirmationIds={confirmationIds} confirmationMode={isSynthetic ? "PUBLIC_SYNTHETIC" : "FIELD"} /></section>

                {analysis && <section className="integrated-card"><div className="integrated-card-heading"><div><h2>대응 결과 기록</h2><p className="integrated-card-subtitle">{isSynthetic ? "합성 시연 기록 · 운영 기록 저장소에는 반영되지 않습니다." : "현장에서 수행한 조치와 결과만 기록합니다."}</p></div>{savedRecordId && <span className="integrated-saved">{isSynthetic ? "시연 저장 완료" : "저장 완료"} · {savedRecordId}</span>}</div><div className="integrated-outcome-form"><StructuredOutcomeForm value={outcomeDraft} onChange={(next) => { setOutcomeDraft(next); setSavedRecordId(null); }} /><button type="button" disabled={busy === "confirmation"} onClick={() => void handleSaveRecord()} className="integrated-save-button">{busy === "confirmation" ? "저장 중..." : "현재 대응 기록 저장"}</button></div></section>}

                <details className="integrated-card integrated-secondary-search">
                  <summary>추가 물질 검색</summary>
                  <div className="integrated-secondary-search-body"><div className="integrated-search"><input value={substanceQuery} onChange={(event) => setSubstanceQuery(event.target.value)} placeholder="물질명 또는 CAS" /><button type="button" disabled={busy === "substance"} onClick={() => void runSubstanceSearch()}>{busy === "substance" ? "검색 중" : "검색"}</button></div><SubstanceResults result={substanceResult} incidentAvailable={Boolean(activeIncidentId)} onUseCandidate={useCandidate} /></div>
                </details>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
