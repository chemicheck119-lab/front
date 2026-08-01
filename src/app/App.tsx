import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Moon,
  Save,
  Search,
  Send,
  Sun,
  User,
  X,
} from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import lightLogo from "@/imports/logo-light.jpg";
import darkLogo from "@/imports/logo-dark.jpg";
import { apiConfig, runtimeDataMode } from "../api/config";
import { analyzeIncident } from "../api/incidents";
import { updateMovement } from "../api/movement";
import { discoverSubstances } from "../api/substances";
import { confirmSubstance } from "../api/confirmations";
import { saveIncidentRecord, shouldResetAfterSave } from "../api/records";
import { toUserFacingError, userFacingError, type UserFacingErrorInfo } from "../api/client";
import type {
  ConfirmationRequest,
  IncidentAnalysisResponse,
  JourneyState,
  MapContext,
  MaterialDiscoveryResponse,
  RecordSaveRequest,
} from "../api/contracts";
import { useResponderLocation } from "../hooks/useResponderLocation";
import { formatDistance, formatEta, getLocationPresentation } from "../features/map/mapState";
import { PHASE_LABELS, AgentPanel } from "../features/operations-agent/AgentPanel";
import { IncidentAnalysisCard } from "../features/incident/IncidentAnalysisCard";
import { analysisStateLabel } from "../features/incident/analysisState";
import { confirmationDateTimeToIso, defaultConfirmationBasis, toConfirmationDateTimeInput } from "../features/incident/confirmationForm";
import { SubstanceResults } from "../features/substance-search/SubstanceResults";
import { FieldToolsPanel } from "../features/field-tools/FieldToolsPanel";
import { LoginScreen } from "../features/auth/LoginScreen";
import { SessionExpiredBanner } from "../features/auth/SessionExpiredBanner";
import { adaptDirectEntryIssue, resolveInitialStation } from "../features/auth/accessMode";

type Mode = "collision" | "substance";
type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

interface Message {
  messageId: string;
  role: MessageRole;
  text: string;
  createdAt: string;
  analysisId?: string | null;
}

interface ConfirmationTarget {
  role: "INCIDENT" | "FACILITY";
  casNumber: string;
  displayName: string;
}

const CONFIRMATION_OPTIONS: Array<{ value: ConfirmationRequest["confirmationBasis"]; label: string }> = [
  { value: "CONTAINER_LABEL", label: "용기 라벨" },
  { value: "SITE_MSDS", label: "현장 MSDS" },
  { value: "SHIPPING_DOCUMENT", label: "운송 문서" },
  { value: "INSTRUMENT_READING", label: "계측기 결과" },
  { value: "RESPONDER_OBSERVATION", label: "대원 관찰" },
  { value: "OTHER_VERIFIED_SOURCE", label: "기타 검증된 출처" },
];

const phaseFallback = "신고 접수";
const IncidentMap = lazy(() => import("../features/map/IncidentMap").then((module) => ({ default: module.IncidentMap })));

function nowIso() {
  return new Date().toISOString();
}

function makeMessage(role: MessageRole, text: string, analysisId?: string | null): Message {
  return { messageId: `MSG-${crypto.randomUUID()}`, role, text, createdAt: nowIso(), analysisId };
}

function modeLabel(mode: typeof runtimeDataMode) {
  const labels = { LIVE_API: "실제 API", CACHED_API: "캐시 API", DEMO_SIMULATION: "시연 데이터", UNAVAILABLE: "연결 설정 필요" };
  return labels[mode];
}

function journeyLabel(state: JourneyState) {
  return { DISPATCHED: "출동 지령", EN_ROUTE: "현장 이동 중", ARRIVED: "현장 도착", ON_SCENE: "현장 대응 중" }[state];
}

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <section className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-bold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" aria-label="닫기"><X size={16} /></button></header>
        {children}
      </section>
    </div>
  );
}

function mergeResponderPosition(context: MapContext | null, position: ReturnType<typeof useResponderLocation>["position"]): MapContext | null {
  if (!context && !position) return null;
  const base: MapContext = context ?? {
    coverageScope: "NATIONWIDE_KOREA",
    route: { status: "INCIDENT_LOCATION_REQUIRED", progressRatioIsProbability: false, message: "사고 좌표를 먼저 확인해주세요." },
    hazardOverlayStatus: "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL",
  };
  if (!position) return base;
  return {
    ...base,
    responderPosition: {
      ...position,
      label: position.source === "DEMO_SIMULATION" ? "시연용 출동 차량" : "대원·차량 현재 위치",
      isSimulation: position.source === "DEMO_SIMULATION",
    },
  };
}

export default function App() {
  const [station, setStation] = useState<string | null>(() => resolveInitialStation(
    runtimeDataMode,
    apiConfig.authEnabled,
    apiConfig.defaultStationName,
  ));
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<Mode>("collision");
  const [journeyState, setJourneyState] = useState<JourneyState>("EN_ROUTE");
  const [input, setInput] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState("");
  const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
  const [mapContext, setMapContext] = useState<MapContext | null>(null);
  const [materialResult, setMaterialResult] = useState<MaterialDiscoveryResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([makeMessage("SYSTEM", "신고 내용을 입력하면 현장대응 절차를 시작합니다.")]);
  const [analysisIds, setAnalysisIds] = useState<string[]>([]);
  const [confirmationIds, setConfirmationIds] = useState<string[]>([]);
  const [conversationStartedAt, setConversationStartedAt] = useState(nowIso());
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [lastIncidentText, setLastIncidentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserFacingErrorInfo | null>(null);
  const [sessionExpired, setSessionExpired] = useState<UserFacingErrorInfo | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordResetPending, setRecordResetPending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [confirmationTarget, setConfirmationTarget] = useState<ConfirmationTarget | null>(null);
  const [confirmationBasis, setConfirmationBasis] = useState<ConfirmationRequest["confirmationBasis"]>("CONTAINER_LABEL");
  const [confirmationObservedAt, setConfirmationObservedAt] = useState(() => toConfirmationDateTimeInput());
  const [confirmingRole, setConfirmingRole] = useState<"INCIDENT" | "FACILITY" | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const movementSequence = useRef(0);
  const lastMovementSentAt = useRef(0);
  const recordResetTimer = useRef<number | null>(null);
  const responderLocation = useResponderLocation(Boolean(station));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const gpsPresentation = useMemo(() => getLocationPresentation(
    responderLocation.state,
    responderLocation.position?.observedAt,
    responderLocation.position?.accuracyM,
    nowMs,
  ), [responderLocation, nowMs]);

  const effectiveMapContext = useMemo(() => mergeResponderPosition(
    mapContext ?? analysis?.agent?.mapContext ?? null,
    responderLocation.position,
  ), [mapContext, analysis, responderLocation.position]);

  useEffect(() => {
    if (!apiConfig.movementEnabled || !incidentId || !responderLocation.position || runtimeDataMode !== "LIVE_API") return;
    const elapsed = Date.now() - lastMovementSentAt.current;
    if (elapsed < apiConfig.locationUpdateIntervalMs) return;
    lastMovementSentAt.current = Date.now();
    movementSequence.current += 1;
    updateMovement(incidentId, {
      responderPosition: responderLocation.position,
      journeyState,
      clientSequence: movementSequence.current,
    }).then((response) => {
      setSessionExpired(null);
      setMapContext(response.mapContext);
      setMovementError(null);
      if (response.mapContext.route.status === "ARRIVED") setJourneyState("ARRIVED");
    }).catch((caught) => {
      const issue = captureRequestIssue(caught);
      setMovementError(issue.kind === "SESSION_EXPIRED" ? null : userFacingError(caught));
    });
  }, [incidentId, responderLocation.position, journeyState]);

  useEffect(() => {
    if (!savedRecordId) return;
    const timer = window.setTimeout(() => setSavedRecordId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [savedRecordId]);

  useEffect(() => () => {
    if (recordResetTimer.current !== null) window.clearTimeout(recordResetTimer.current);
  }, []);

  if (!station) return <LoginScreen isDark={isDark} dataMode={runtimeDataMode} authLoginUrl={apiConfig.authLoginUrl} onDemoLogin={setStation} />;

  const route = effectiveMapContext?.route;
  const agentPhase = analysis?.agent?.phase;
  const dispatchContact = {
    name: apiConfig.dispatchCenterName || `${station} 상황실`,
    phone: apiConfig.dispatchCenterPhone,
  };

  function captureRequestIssue(caught: unknown) {
    const issue = adaptDirectEntryIssue(toUserFacingError(caught), apiConfig.authEnabled);
    if (apiConfig.authEnabled && issue.kind === "SESSION_EXPIRED") setSessionExpired(issue);
    return issue;
  }

  async function runAnalysis(text: string, appendUserMessage: boolean) {
    setLoading(true);
    setError(null);
    if (appendUserMessage) setMessages((previous) => [...previous, makeMessage("USER", text)]);
    try {
      const response = await analyzeIncident({
        incidentId,
        text,
        inputType: "DISPATCH_TEXT",
        occurredAt: nowIso(),
        location: {
          facilityName: facilityName || null,
          address: address || null,
          coordinateSource: runtimeDataMode === "DEMO_SIMULATION" ? "DEMO_FIXTURE" : null,
        },
        operationsContext: {
          dispatchStationName: station,
          journeyState,
          responderPosition: responderLocation.position,
        },
        evidenceTopK: 5,
      });
      setSessionExpired(null);
      setAnalysis(response);
      setIncidentId(response.incidentId);
      setLastIncidentText(text);
      setAnalysisIds((previous) => previous.includes(response.analysisId) ? previous : [...previous, response.analysisId]);
      if (response.agent?.mapContext) setMapContext(response.agent.mapContext);
      setMessages((previous) => [...previous, makeMessage("ASSISTANT", response.agent?.currentObjective ?? response.requiredNextSteps[0] ?? analysisStateLabel(response.state), response.analysisId)]);
    } catch (caught) {
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
      if (appendUserMessage) setInput(text);
      setMessages((previous) => [...previous, makeMessage("SYSTEM", `${issue.message}${issue.requestId ? ` (요청 ID: ${issue.requestId})` : ""}`)]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const query = input.trim();
    if (!query || loading) return;
    setInput("");
    if (mode === "collision") {
      await runAnalysis(query, true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await discoverSubstances(query);
      setSessionExpired(null);
      setMaterialResult(response);
    } catch (caught) {
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
      setInput(query);
      setMaterialResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!confirmationTarget || !incidentId || confirmingRole) return;
    const observedAt = confirmationDateTimeToIso(confirmationObservedAt);
    if (!observedAt) return;
    setConfirmingRole(confirmationTarget.role);
    setError(null);
    try {
      const response = await confirmSubstance(incidentId, {
        role: confirmationTarget.role,
        casNumber: confirmationTarget.casNumber,
        displayName: confirmationTarget.displayName,
        confirmationBasis,
        observedAt,
      });
      setSessionExpired(null);
      setConfirmationIds((previous) => previous.includes(response.confirmationId) ? previous : [...previous, response.confirmationId]);
      setMessages((previous) => [...previous, makeMessage("SYSTEM", `${confirmationTarget.displayName}(${confirmationTarget.casNumber}) 현장 확인 기록이 저장됐습니다.`)]);
      setConfirmationTarget(null);
      if (response.reanalyzeRequired && lastIncidentText) await runAnalysis(lastIncidentText, false);
      setMode("collision");
    } catch (caught) {
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
    } finally {
      setConfirmingRole(null);
    }
  }

  function openConfirmation(target: ConfirmationTarget) {
    setError(null);
    setConfirmationBasis(defaultConfirmationBasis(target.role));
    setConfirmationObservedAt(toConfirmationDateTimeInput());
    setConfirmationTarget(target);
  }

  function resetSession() {
    setAnalysis(null);
    setMapContext(null);
    setMaterialResult(null);
    setMessages([makeMessage("SYSTEM", "새 사고 신고 내용을 입력해주세요.")]);
    setAnalysisIds([]);
    setConfirmationIds([]);
    setConversationStartedAt(nowIso());
    setIncidentId(null);
    setLastIncidentText("");
    setInput("");
    setFacilityName("");
    setAddress("");
    setJourneyState("EN_ROUTE");
    movementSequence.current = 0;
  }

  async function handleSave() {
    if (!apiConfig.recordEnabled || !incidentId || analysisIds.length === 0 || saving || recordResetPending) return;
    setSaving(true);
    setSaveError(null);
    const payload: RecordSaveRequest = {
      conversationStartedAt,
      messages: messages.map((message, index) => ({ ...message, sequence: index + 1 })),
      analysisIds,
      confirmationIds,
    };
    try {
      const response = await saveIncidentRecord(incidentId, payload);
      setSessionExpired(null);
      if (shouldResetAfterSave(response)) {
        setSavedRecordId(response.recordId);
        setShowSaveDialog(false);
        setRecordResetPending(true);
        recordResetTimer.current = window.setTimeout(() => {
          resetSession();
          setRecordResetPending(false);
          recordResetTimer.current = null;
        }, 2200);
      }
    } catch (caught) {
      const issue = captureRequestIssue(caught);
      setSaveError(issue.kind === "SESSION_EXPIRED" ? null : userFacingError(caught));
    } finally {
      setSaving(false);
    }
  }

  function loadDemoIncident() {
    setFacilityName("시연 사업장");
    setAddress("경기 화성시 팔탄면");
    setInput("차아염소산나트륨 저장탱크 누출 의심, 인접 저장고에 염산 표기");
    setMode("collision");
  }

  return (
    <div className="flex h-[100dvh] min-w-[1024px] flex-col overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3"><ImageWithFallback src={isDark ? darkLogo : lightLogo} alt="케미체크119" className="h-9 w-auto object-contain" /><span className="hidden rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary lg:inline">전국 현장대응</span></div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${runtimeDataMode === "DEMO_SIMULATION" ? "border-accent/40 bg-accent/10 text-accent" : runtimeDataMode === "LIVE_API" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border bg-muted text-muted-foreground"}`}>{modeLabel(runtimeDataMode)}</span>
          {runtimeDataMode === "LIVE_API" && !apiConfig.authEnabled && <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">인증 미사용</span>}
          <div className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-xs font-semibold"><User size={13} />{station}</div>
          <button onClick={() => setIsDark((value) => !value)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" aria-label={isDark ? "라이트 모드" : "다크 모드"}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button>
        </div>
      </header>

      {apiConfig.authEnabled && sessionExpired && <SessionExpiredBanner authLoginUrl={apiConfig.authLoginUrl} hasIncident={Boolean(incidentId || analysisIds.length || messages.length > 1)} requestId={sessionExpired.requestId} />}

      <div className="flex min-h-0 flex-1">
        <FieldToolsPanel
          station={station}
          dispatchContact={dispatchContact}
          dataMode={runtimeDataMode}
          gpsLabel={gpsPresentation.label}
          gpsDetail={gpsPresentation.detail}
          analysis={analysis}
          incidentId={incidentId}
          messages={messages}
          analysisIds={analysisIds}
          confirmationIds={confirmationIds}
          canSave={Boolean(apiConfig.recordEnabled && !recordResetPending && incidentId && analysisIds.length)}
          recordAvailable={apiConfig.recordEnabled}
          onRequestSave={() => setShowSaveDialog(true)}
          onContactAttempt={() => setMessages((previous) => [...previous, makeMessage("SYSTEM", `${dispatchContact.name} 전화 연결을 시도했습니다.`)])}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-2 p-2">
          <section className="grid h-[72px] shrink-0 grid-cols-4 gap-2" aria-label="현장대응 요약">
            <StatusCard label="현재 단계" value={agentPhase ? PHASE_LABELS[agentPhase] : phaseFallback} detail={analysisStateLabel(analysis?.state)} tone="primary" />
            <StatusCard label="출동 상태" value={journeyLabel(journeyState)} detail={!apiConfig.movementEnabled ? "이동 API 준비 중" : journeyState === "ARRIVED" || journeyState === "ON_SCENE" ? "현장 도착 확인" : "위치 갱신 대기"} tone="blue" />
            <StatusCard label="ETA · 남은 거리" value={`${formatEta(route?.etaSeconds)} · ${formatDistance(route?.remainingDistanceM)}`} detail={route?.providerMode === "DEMO_SIMULATION" ? "시연 경로" : route?.provider ?? "도로 경로 없음"} tone="neutral" />
            <StatusCard label="GPS 상태" value={gpsPresentation.label} detail={gpsPresentation.detail} tone={gpsPresentation.tone === "bad" ? "danger" : gpsPresentation.tone === "good" ? "green" : "neutral"} />
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-[minmax(420px,1.12fr)_minmax(390px,0.88fr)] gap-2">
            <Suspense fallback={<div className="grid min-h-[460px] place-items-center rounded-2xl border border-border bg-card text-xs text-muted-foreground">지도 모듈을 준비하고 있습니다…</div>}>
              <IncidentMap context={effectiveMapContext} isDark={isDark} gps={gpsPresentation} />
            </Suspense>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="shrink-0 border-b border-border p-3">
                <div className="flex items-center gap-2">
                  <div className="grid flex-1 grid-cols-2 rounded-xl border border-border bg-muted p-1">
                    <button onClick={() => setMode("collision")} className={`min-h-9 rounded-lg text-xs font-bold transition ${mode === "collision" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>대응충돌검토</button>
                    <button onClick={() => setMode("substance")} className={`min-h-9 rounded-lg text-xs font-bold transition ${mode === "substance" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>물질검색</button>
                  </div>
                  <button disabled={!apiConfig.recordEnabled || recordResetPending || !incidentId || analysisIds.length === 0} onClick={() => setShowSaveDialog(true)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 text-[11px] font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Save size={13} />{!apiConfig.recordEnabled ? "기록 저장 준비 중" : recordResetPending ? "저장 완료" : "기록 저장"}</button>
                </div>
                {mode === "collision" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={facilityName} onChange={(event) => setFacilityName(event.target.value)} className="min-h-9 rounded-lg border border-border bg-input-background px-3 text-[11px] outline-none focus:border-primary" placeholder="시설명(출동지령 기준)" />
                    <input value={address} onChange={(event) => setAddress(event.target.value)} className="min-h-9 rounded-lg border border-border bg-input-background px-3 text-[11px] outline-none focus:border-primary" placeholder="사고 주소(좌표는 BE 검증)" />
                  </div>
                )}
                {runtimeDataMode === "DEMO_SIMULATION" && mode === "collision" && <button onClick={loadDemoIncident} className="mt-2 text-[10px] font-semibold text-accent hover:underline">시연 신고 불러오기</button>}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {error && <ErrorNotice error={error} onRetry={error.retryable && (input.trim() || lastIncidentText) ? () => { if (input.trim()) void handleSubmit(); else if (lastIncidentText) void runAnalysis(lastIncidentText, false); } : undefined} />}
                {movementError && <div className="rounded-lg border border-accent/30 bg-accent/5 p-2 text-[10px] text-accent">경로 갱신: {movementError} 기존 화면은 유지됩니다.</div>}
                {mode === "collision" ? (
                  <>
                    <IncidentAnalysisCard analysis={analysis} onConfirm={(role, casNumber, displayName) => openConfirmation({ role, casNumber, displayName })} confirmingRole={confirmingRole} />
                    <AgentPanel agent={analysis?.agent} />
                    {messages.length > 1 && <details className="rounded-xl border border-border bg-secondary/30"><summary className="cursor-pointer px-3 py-2.5 text-[11px] font-semibold">대화·상태 기록 {messages.length}건</summary><div className="space-y-2 border-t border-border p-3">{messages.slice(-6).map((message) => <div key={message.messageId} className={`rounded-lg p-2 text-[10px] leading-relaxed ${message.role === "USER" ? "ml-8 bg-primary/10" : "mr-8 bg-card border border-border"}`}><p className="font-semibold text-muted-foreground">{message.role === "USER" ? "대원" : message.role === "ASSISTANT" ? "에이전트" : "시스템"}</p><p className="mt-0.5">{message.text}</p></div>)}</div></details>}
                  </>
                ) : <SubstanceResults result={materialResult} incidentAvailable={Boolean(incidentId)} onUseCandidate={(candidate) => openConfirmation({ role: "INCIDENT", casNumber: candidate.casNumber, displayName: candidate.displayName })} />}
              </div>

              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSubmit(); } }} rows={2} className="min-h-[52px] flex-1 resize-none rounded-xl border border-border bg-input-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary" placeholder={mode === "collision" ? "신고 내용과 확인된 상황을 입력하세요…" : "물질명·CAS·화학식 또는 색·냄새·상태 입력…"} />
                  <button onClick={() => void handleSubmit()} disabled={!input.trim() || loading || runtimeDataMode === "UNAVAILABLE"} className="grid h-[52px] w-[52px] place-items-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40" aria-label={mode === "collision" ? "사고 분석" : "물질 검색"}>{mode === "collision" ? <Send size={16} /> : <Search size={16} />}</button>
                </div>
                {loading && <p className="mt-1.5 text-[10px] text-muted-foreground">{mode === "collision" ? "신고·시설 이력·확인 게이트를 점검 중입니다…" : "물질 후보와 공식 근거를 검색 중입니다…"}</p>}
              </div>
            </div>
          </section>
        </main>
      </div>

      {confirmationTarget && (
        <DialogShell title="현장 물질 확인 기록" onClose={() => !confirmingRole && setConfirmationTarget(null)}>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-secondary p-3"><p className="text-[10px] text-muted-foreground">확인할 후보</p><p className="mt-1 text-sm font-bold">{confirmationTarget.displayName}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">CAS {confirmationTarget.casNumber}</p></div>
            <label className="block text-xs font-semibold">역할
              <select value={confirmationTarget.role} onChange={(event) => { const role = event.target.value as ConfirmationTarget["role"]; setConfirmationBasis(defaultConfirmationBasis(role)); setConfirmationTarget((current) => current ? { ...current, role } : current); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm outline-none focus:border-primary">
                <option value="INCIDENT">사고물질</option>
                <option value="FACILITY">시설물질</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">확인 근거
              <select value={confirmationBasis} onChange={(event) => setConfirmationBasis(event.target.value as ConfirmationRequest["confirmationBasis"])} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm outline-none focus:border-primary">
                {CONFIRMATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold">확인 시각
              <input type="datetime-local" step={60} max={toConfirmationDateTimeInput()} value={confirmationObservedAt} onChange={(event) => setConfirmationObservedAt(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm outline-none focus:border-primary" required />
              <span className="mt-1 block text-[10px] font-normal text-muted-foreground">현재 기기 시각을 기본값으로 사용합니다. 실제 확인 시각과 다르면 수정하세요.</span>
            </label>
            <p className="rounded-xl bg-accent/10 p-3 text-[11px] leading-relaxed text-accent">이 작업은 AI 후보 승인이 아니라 현장 확인 레코드 생성입니다. 직접 확인한 근거와 시각만 기록해주세요.</p>
            {error && <ErrorNotice error={error} />}
            <div className="flex gap-2"><button onClick={() => setConfirmationTarget(null)} disabled={Boolean(confirmingRole)} className="min-h-11 flex-1 rounded-xl border border-border font-semibold">취소</button><button onClick={() => void handleConfirm()} disabled={Boolean(confirmingRole) || !confirmationDateTimeToIso(confirmationObservedAt)} className="min-h-11 flex-1 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">{confirmingRole ? "저장 중…" : "현장 확인 기록 저장"}</button></div>
          </div>
        </DialogShell>
      )}

      {showSaveDialog && (
        <DialogShell title="대응 기록 저장" onClose={() => !saving && setShowSaveDialog(false)}>
          <div className="p-5">
            <p className="text-sm leading-relaxed">현재 대화와 현장 확인 내용을 대응 기록으로 저장합니다. 저장 후 새 사고 화면으로 초기화할까요?</p>
            <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground"><li>• 대화와 분석 결과</li><li>• 물질 확인·사고 위치·출동 상태</li><li>• 대응 근거와 모델·데이터·규칙 버전</li></ul>
            {saveError && <p className="mt-3 rounded-lg bg-primary/10 p-2 text-[11px] text-primary">{saveError} 현재 화면과 분석 결과는 유지됩니다.</p>}
            <div className="mt-5 flex gap-2"><button disabled={saving} onClick={() => setShowSaveDialog(false)} className="min-h-11 flex-1 rounded-xl border border-border font-semibold">취소</button><button disabled={saving} onClick={() => void handleSave()} className="min-h-11 flex-1 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">{saving ? "저장 중…" : "저장 후 초기화"}</button></div>
          </div>
        </DialogShell>
      )}

      {savedRecordId && <div className="fixed bottom-5 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl"><Check size={15} />저장된 기록은 화학사고 대응에 활용됩니다. <span className="font-mono text-[10px] text-white/70">{savedRecordId}</span></div>}
    </div>
  );
}

function ErrorNotice({ error, onRetry }: { error: UserFacingErrorInfo; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-[11px] text-primary" role="alert">
      <div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span className="flex-1 leading-relaxed">{error.message}</span></div>
      {(error.requestId || onRetry) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-5">
          {error.requestId && <button type="button" onClick={() => void navigator.clipboard.writeText(error.requestId ?? "").then(() => setCopied(true)).catch(() => setCopied(false))} className="min-h-8 rounded-lg border border-primary/25 px-2 text-[10px] font-semibold">{copied ? "요청 ID 복사됨" : `요청 ID ${error.requestId} 복사`}</button>}
          {onRetry && <button type="button" onClick={onRetry} className="min-h-8 rounded-lg bg-primary px-2 text-[10px] font-semibold text-white">다시 시도</button>}
        </div>
      )}
    </div>
  );
}

function StatusCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "primary" | "blue" | "green" | "danger" | "neutral" }) {
  const dot = { primary: "bg-primary", blue: "bg-blue-500", green: "bg-emerald-500", danger: "bg-primary", neutral: "bg-slate-400" }[tone];
  return <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"><p className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</p><p className="mt-1 truncate text-xs font-bold">{value}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{detail}</p></div>;
}
