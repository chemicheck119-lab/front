import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  LogOut,
  Moon,
  Save,
  Sun,
  User,
  X,
} from "lucide-react";
import { BrandLogo } from "@/app/components/BrandLogo";
import { apiConfig, runtimeDataMode } from "../api/config";
import { endAuthenticatedSession, getAuthenticatedSession } from "../api/auth";
import { receiveContestIncident, type IncidentReplayEnvelope } from "../api/intake";
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
  SessionContextResponse,
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
import { resetDemoSession as resetDemoDataSession } from "../fixtures/demo";
import { contestLiveScenario } from "../demo/presentationScenario";
import { MessageComposer } from "../features/composer/MessageComposer";

type Mode = "collision" | "substance";
type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";
type SessionBootstrapStatus = "DISABLED" | "CHECKING" | "AUTHENTICATED" | "REQUIRED" | "ERROR";
type PresentationReplayStatus = "IDLE" | "WAITING" | "RECEIVED" | "ERROR";

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

function UseEndedScreen({ station, onRestart }: { station: string; onRestart: () => void }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background p-6" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <BrandLogo variant="login" className="mx-auto" />
        <div className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Check size={24} /></div>
        <h1 className="mt-4 text-lg font-black">사용이 종료되었습니다</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">사고·대화·분석 결과와 입력값을 지웠고 GPS 및 진행 중인 요청을 중단했습니다.</p>
        <p className="mt-4 rounded-xl bg-secondary px-3 py-2 text-[13px] font-semibold text-muted-foreground">{station}</p>
        <button type="button" onClick={onRestart} className="mt-5 min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-primary/90">새 대응 시작</button>
      </section>
    </main>
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
  const [sessionContext, setSessionContext] = useState<SessionContextResponse | null>(null);
  const [sessionBootstrapStatus, setSessionBootstrapStatus] = useState<SessionBootstrapStatus>(apiConfig.authEnabled ? "CHECKING" : "DISABLED");
  const [sessionBootstrapError, setSessionBootstrapError] = useState<UserFacingErrorInfo | null>(null);
  const [sessionBootstrapAttempt, setSessionBootstrapAttempt] = useState(0);
  const [useActive, setUseActive] = useState(!apiConfig.authEnabled);
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<Mode>("collision");
  const [journeyState, setJourneyState] = useState<JourneyState>("EN_ROUTE");
  const [input, setInput] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState("");
  const [presentationScenarioId, setPresentationScenarioId] = useState<string | null>(null);
  const [presentationReplay, setPresentationReplay] = useState<IncidentReplayEnvelope | null>(null);
  const [presentationReplayStatus, setPresentationReplayStatus] = useState<PresentationReplayStatus>("IDLE");
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
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [endSessionError, setEndSessionError] = useState<string | null>(null);
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
  const nextMovementAllowedAt = useRef(0);
  const recordResetTimer = useRef<number | null>(null);
  const operationGeneration = useRef(0);
  const operationControllers = useRef(new Set<AbortController>());
  const responderLocation = useResponderLocation(Boolean(station) && useActive);

  useEffect(() => {
    if (!apiConfig.authEnabled) return;
    const controller = new AbortController();
    setSessionBootstrapStatus("CHECKING");
    setSessionBootstrapError(null);
    void getAuthenticatedSession(controller.signal).then((context) => {
      setSessionContext(context);
      setStation(context.stationDisplayName);
      setUseActive(true);
      setSessionBootstrapStatus("AUTHENTICATED");
    }).catch((caught) => {
      if (controller.signal.aborted) return;
      const issue = toUserFacingError(caught);
      setSessionContext(null);
      setStation(null);
      setUseActive(false);
      setSessionBootstrapError(issue);
      setSessionBootstrapStatus(issue.kind === "SESSION_EXPIRED" ? "REQUIRED" : "ERROR");
    });
    return () => controller.abort();
  }, [sessionBootstrapAttempt]);

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
    const requestStartedAt = Date.now();
    if (requestStartedAt < nextMovementAllowedAt.current) return;
    const elapsed = requestStartedAt - lastMovementSentAt.current;
    if (elapsed < apiConfig.locationUpdateIntervalMs) return;
    lastMovementSentAt.current = requestStartedAt;
    movementSequence.current += 1;
    const operation = beginOperation();
    updateMovement(incidentId, {
      responderPosition: responderLocation.position,
      journeyState,
      clientSequence: movementSequence.current,
    }, operation.controller.signal).then((response) => {
      if (!isCurrentOperation(operation.generation)) return;
      setSessionExpired(null);
      setMapContext(response.mapContext);
      setMovementError(null);
      nextMovementAllowedAt.current = Date.now() + Math.max(1000, response.nextRefreshSeconds * 1000);
      if (response.mapContext.route.status === "ARRIVED") setJourneyState("ARRIVED");
    }).catch((caught) => {
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setMovementError(issue.kind === "SESSION_EXPIRED" ? null : userFacingError(caught));
    }).finally(() => finishOperation(operation.controller));
  }, [incidentId, responderLocation.position, journeyState, useActive]);

  useEffect(() => {
    if (!savedRecordId) return;
    const timer = window.setTimeout(() => setSavedRecordId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [savedRecordId]);

  useEffect(() => () => {
    if (recordResetTimer.current !== null) window.clearTimeout(recordResetTimer.current);
    cancelActiveOperations();
  }, []);

  if (apiConfig.authEnabled && sessionBootstrapStatus === "CHECKING") return <LoginScreen dataMode={runtimeDataMode} authLoginUrl={apiConfig.authLoginUrl} sessionChecking onDemoLogin={startDemoSession} />;
  if (apiConfig.authEnabled && sessionBootstrapStatus !== "AUTHENTICATED") return <LoginScreen dataMode={runtimeDataMode} authLoginUrl={apiConfig.authLoginUrl} sessionError={sessionBootstrapError} onRetrySession={() => setSessionBootstrapAttempt((attempt) => attempt + 1)} onDemoLogin={startDemoSession} />;
  if (!station) return <LoginScreen dataMode={runtimeDataMode} authLoginUrl={apiConfig.authLoginUrl} onDemoLogin={startDemoSession} />;
  if (!useActive) return <UseEndedScreen station={station} onRestart={startDirectEntrySession} />;

  const route = effectiveMapContext?.route;
  const agentPhase = analysis?.agent?.phase;
  const dispatchContact = {
    name: apiConfig.dispatchCenterName || `${station} 상황실`,
    phone: apiConfig.dispatchCenterPhone,
  };
  const dispatchPreview = presentationReplay
    ? {
        receivedAt: presentationReplay.receivedAt,
        stationDisplayName: presentationReplay.stationDisplayName,
        facilityName: presentationReplay.facilityName,
        addressText: presentationReplay.addressText,
        reportText: presentationReplay.reportText,
        requestId: presentationReplay.requestId,
        disclosure: presentationReplay.disclosure,
      }
    : presentationReplayStatus === "RECEIVED"
      ? {
          receivedAt: conversationStartedAt,
          stationDisplayName: station,
          facilityName: contestLiveScenario.facilityName,
          addressText: contestLiveScenario.address,
          reportText: contestLiveScenario.text,
          requestId: null,
          disclosure: contestLiveScenario.disclosure,
        }
      : null;
  const currentTask = !analysis
    ? presentationScenarioId
      ? { step: "2/4", title: "신고 내용을 확인하고 분석을 시작하세요", detail: "시설명·주소·신고문을 확인한 뒤 아래의 ‘분석 시작’을 누르세요.", complete: false }
      : { step: "1/4", title: "상황실 지령을 받거나 신고문을 입력하세요", detail: "왼쪽 ‘상황실 연결’을 누르면 실제 지령망에서 신고를 받을 수 있습니다.", complete: false }
    : !analysis.confirmationGate.incidentConfirmed
      ? { step: "3/4", title: "사고물질을 현장에서 확인하세요", detail: "후보 카드의 ‘사고물질 현장 확인’을 눌러 라벨·MSDS 근거를 기록하세요.", complete: false }
      : !analysis.confirmationGate.facilityConfirmed
        ? { step: "4/4", title: "시설물질을 현장에서 확인하세요", detail: "시설물질의 현재 존재와 CAS를 확인해야 충돌 검토가 실행됩니다.", complete: false }
        : { step: "확인 완료", title: "충돌 검토 결과를 확인하세요", detail: "공개 근거와 제한사항을 확인하고 최종 판단은 현장 지휘관이 수행합니다.", complete: true };

  function beginOperation() {
    const controller = new AbortController();
    operationControllers.current.add(controller);
    return { controller, generation: operationGeneration.current };
  }

  function finishOperation(controller: AbortController) {
    operationControllers.current.delete(controller);
  }

  function isCurrentOperation(generation: number) {
    return generation === operationGeneration.current;
  }

  function cancelActiveOperations() {
    operationGeneration.current += 1;
    for (const controller of operationControllers.current) controller.abort();
    operationControllers.current.clear();
  }

  function startDemoSession(stationName: string) {
    resetSession();
    setStation(stationName);
    setUseActive(true);
  }

  function startDirectEntrySession() {
    resetSession();
    setUseActive(true);
  }

  function captureRequestIssue(caught: unknown) {
    const issue = adaptDirectEntryIssue(toUserFacingError(caught), apiConfig.authEnabled);
    if (apiConfig.authEnabled && issue.kind === "SESSION_EXPIRED") setSessionExpired(issue);
    return issue;
  }

  function requestAnalysis(
    text: string,
    targetIncidentId: string | null,
    replay: IncidentReplayEnvelope | null,
    signal: AbortSignal,
  ) {
    return analyzeIncident({
      incidentId: targetIncidentId,
      text,
      inputType: "DISPATCH_TEXT",
      occurredAt: replay?.occurredAt ?? nowIso(),
      location: {
        facilityName: replay?.facilityName ?? (facilityName || null),
        address: replay?.addressText ?? (address || null),
        latitude: replay?.location.latitude ?? null,
        longitude: replay?.location.longitude ?? null,
        resolvedAt: replay?.receivedAt ?? null,
        coordinateSource: replay
          ? "DEMO_FIXTURE"
          : runtimeDataMode === "DEMO_SIMULATION" ? "DEMO_FIXTURE" : null,
      },
      operationsContext: {
        dispatchStationName: replay?.stationDisplayName ?? station,
        journeyState,
        responderPosition: responderLocation.position,
      },
      evidenceTopK: 5,
    }, signal);
  }

  function applyAnalysisResponse(response: IncidentAnalysisResponse, text: string) {
    setSessionExpired(null);
    setAnalysis(response);
    setIncidentId(response.incidentId);
    setLastIncidentText(text);
    setAnalysisIds((previous) => previous.includes(response.analysisId)
      ? previous : [...previous, response.analysisId]);
    if (response.agent?.mapContext) setMapContext(response.agent.mapContext);
    setMessages((previous) => [...previous, makeMessage(
      "ASSISTANT",
      response.agent?.currentObjective
        ?? response.requiredNextSteps[0]
        ?? analysisStateLabel(response.state),
      response.analysisId,
    )]);
  }

  async function runAnalysis(text: string, appendUserMessage: boolean) {
    const operation = beginOperation();
    setLoading(true);
    setError(null);
    if (appendUserMessage) setMessages((previous) => [...previous, makeMessage("USER", text)]);
    try {
      const response = await requestAnalysis(
        text, incidentId, presentationReplay, operation.controller.signal,
      );
      if (!isCurrentOperation(operation.generation)) return;
      applyAnalysisResponse(response, text);
    } catch (caught) {
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
      if (appendUserMessage) setInput(text);
      setMessages((previous) => [...previous, makeMessage("SYSTEM", `${issue.message}${issue.requestId ? ` (요청 ID: ${issue.requestId})` : ""}`)]);
    } finally {
      finishOperation(operation.controller);
      if (isCurrentOperation(operation.generation)) setLoading(false);
    }
  }

  async function handleSubmit(rawInput = input) {
    const query = rawInput.trim();
    if (!query || loading) return;
    setInput("");
    if (mode === "collision") {
      await runAnalysis(query, true);
      return;
    }
    const operation = beginOperation();
    setLoading(true);
    setError(null);
    try {
      const response = await discoverSubstances(query, operation.controller.signal);
      if (!isCurrentOperation(operation.generation)) return;
      setSessionExpired(null);
      setMaterialResult(response);
    } catch (caught) {
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
      setInput(query);
      setMaterialResult(null);
    } finally {
      finishOperation(operation.controller);
      if (isCurrentOperation(operation.generation)) setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!confirmationTarget || !incidentId || confirmingRole) return;
    const observedAt = confirmationDateTimeToIso(confirmationObservedAt);
    if (!observedAt) return;
    const operation = beginOperation();
    setConfirmingRole(confirmationTarget.role);
    setError(null);
    try {
      const response = await confirmSubstance(incidentId, {
        role: confirmationTarget.role,
        casNumber: confirmationTarget.casNumber,
        displayName: confirmationTarget.displayName,
        confirmationBasis,
        observedAt,
      }, operation.controller.signal);
      if (!isCurrentOperation(operation.generation)) return;
      setSessionExpired(null);
      setConfirmationIds((previous) => previous.includes(response.confirmationId) ? previous : [...previous, response.confirmationId]);
      setMessages((previous) => [...previous, makeMessage("SYSTEM", `${confirmationTarget.displayName}(${confirmationTarget.casNumber}) 현장 확인 기록이 저장됐습니다.`)]);
      setConfirmationTarget(null);
      if (response.reanalyzeRequired && lastIncidentText) await runAnalysis(lastIncidentText, false);
      if (!isCurrentOperation(operation.generation)) return;
      setMode("collision");
    } catch (caught) {
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
    } finally {
      finishOperation(operation.controller);
      if (isCurrentOperation(operation.generation)) setConfirmingRole(null);
    }
  }

  function openConfirmation(target: ConfirmationTarget) {
    setError(null);
    setConfirmationBasis(defaultConfirmationBasis(target.role));
    setConfirmationObservedAt(toConfirmationDateTimeInput());
    setConfirmationTarget(target);
  }

  function resetSession() {
    cancelActiveOperations();
    if (recordResetTimer.current !== null) {
      window.clearTimeout(recordResetTimer.current);
      recordResetTimer.current = null;
    }
    if (apiConfig.demoEnabled) resetDemoDataSession();
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
    setPresentationScenarioId(null);
    setPresentationReplay(null);
    setPresentationReplayStatus("IDLE");
    setMode("collision");
    setJourneyState("EN_ROUTE");
    setError(null);
    setSessionExpired(null);
    setMovementError(null);
    setShowSaveDialog(false);
    setSaveError(null);
    setSavedRecordId(null);
    setRecordResetPending(false);
    setConfirmationTarget(null);
    setConfirmationBasis("CONTAINER_LABEL");
    setConfirmationObservedAt(toConfirmationDateTimeInput());
    setConfirmingRole(null);
    setLoading(false);
    setSaving(false);
    movementSequence.current = 0;
    lastMovementSentAt.current = 0;
    nextMovementAllowedAt.current = 0;
  }

  function completeUseEnd() {
    resetSession();
    setShowEndSessionDialog(false);
    setUseActive(false);
    if (apiConfig.authEnabled) {
      setSessionContext(null);
      setSessionBootstrapError(null);
      setSessionBootstrapStatus("REQUIRED");
      setStation(null);
    } else if (runtimeDataMode === "DEMO_SIMULATION") {
      setStation(null);
    }
  }

  async function handleEndSession() {
    if (endingSession) return;
    cancelActiveOperations();
    setLoading(false);
    setSaving(false);
    setConfirmingRole(null);
    setEndingSession(true);
    setEndSessionError(null);
    try {
      await endAuthenticatedSession();
      completeUseEnd();
    } catch (caught) {
      const issue = toUserFacingError(caught);
      if (apiConfig.authEnabled && issue.kind === "SESSION_EXPIRED") completeUseEnd();
      else setEndSessionError(userFacingError(caught));
    } finally {
      setEndingSession(false);
    }
  }

  async function handleSave() {
    if (!apiConfig.recordEnabled || !incidentId || analysisIds.length === 0 || saving || recordResetPending) return;
    const operation = beginOperation();
    setSaving(true);
    setSaveError(null);
    const payload: RecordSaveRequest = {
      conversationStartedAt,
      messages: messages.map((message, index) => ({ ...message, sequence: index + 1 })),
      analysisIds,
      confirmationIds,
    };
    try {
      const response = await saveIncidentRecord(incidentId, payload, operation.controller.signal);
      if (!isCurrentOperation(operation.generation)) return;
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
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setSaveError(issue.kind === "SESSION_EXPIRED" ? null : userFacingError(caught));
    } finally {
      finishOperation(operation.controller);
      if (isCurrentOperation(operation.generation)) setSaving(false);
    }
  }

  async function loadPresentationIncident() {
    if (!apiConfig.presentationScenarioEnabled) {
      setPresentationReplay(null);
      setPresentationReplayStatus("RECEIVED");
      setError(null);
      return;
    }

    const operation = beginOperation();
    setPresentationReplayStatus("WAITING");
    setError(null);
    try {
      const envelope = await receiveContestIncident(operation.controller.signal);
      if (!isCurrentOperation(operation.generation)) return;
      setPresentationReplay(envelope);
      setPresentationReplayStatus("RECEIVED");
      setMessages((previous) => [...previous, makeMessage(
        "SYSTEM",
        `상황실 지령망에서 공개 합성 지령을 수신했습니다. 대원 확인 전에는 분석을 시작하지 않습니다. (요청 ID: ${envelope.requestId})`,
      )]);
    } catch (caught) {
      if (!isCurrentOperation(operation.generation) || operation.controller.signal.aborted) return;
      const issue = captureRequestIssue(caught);
      setPresentationReplay(null);
      setPresentationScenarioId(null);
      setPresentationReplayStatus("ERROR");
      setError(issue.kind === "SESSION_EXPIRED" ? null : issue);
    } finally {
      finishOperation(operation.controller);
    }
  }

  function acceptPresentationIncident() {
    if (presentationReplayStatus !== "RECEIVED") return;
    const envelope = presentationReplay;
    if (analysis || incidentId || analysisIds.length > 0) {
      resetSession();
      setPresentationReplay(envelope);
      setPresentationReplayStatus("RECEIVED");
    }
    setFacilityName(envelope?.facilityName ?? contestLiveScenario.facilityName);
    setAddress(envelope?.addressText ?? contestLiveScenario.address);
    setInput(envelope?.reportText ?? contestLiveScenario.text);
    setIncidentId(envelope?.incidentId ?? null);
    setPresentationScenarioId(contestLiveScenario.scenarioId);
    setMessages((previous) => [...previous, makeMessage(
      "SYSTEM",
      `대원이 상황실 지령을 확인해 대응화면에 반영했습니다.${envelope?.requestId ? ` (요청 ID: ${envelope.requestId})` : ""} 분석은 별도로 실행해야 합니다.`,
    )]);
    setMode("collision");
  }
  function changeIncidentInput(value: string) {
    const sourceText = presentationReplay?.reportText ?? contestLiveScenario.text;
    if (presentationScenarioId && value !== sourceText) {
      setPresentationScenarioId(null);
      setPresentationReplay(null);
      setPresentationReplayStatus("IDLE");
      if (!analysis) setIncidentId(null);
    }
    setInput(value);
  }

  function clearPresentationReplayForManualEdit() {
    if (!presentationScenarioId) return;
    setPresentationScenarioId(null);
    setPresentationReplay(null);
    setPresentationReplayStatus("IDLE");
    if (!analysis) setIncidentId(null);
  }

  return (
    <div className="field-dashboard flex h-[100dvh] min-w-[1100px] flex-col overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <div className="flex items-center gap-3"><BrandLogo /><span className="hidden rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary lg:inline">전국 현장대응</span></div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${runtimeDataMode === "DEMO_SIMULATION" ? "border-accent/40 bg-accent/10 text-accent" : runtimeDataMode === "LIVE_API" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border bg-muted text-muted-foreground"}`}>{modeLabel(runtimeDataMode)}</span>
          {presentationScenarioId && <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">공개 합성 신고</span>}
          {runtimeDataMode === "LIVE_API" && !apiConfig.authEnabled && <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">인증 미사용</span>}
          <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-secondary px-3.5 text-sm font-semibold" title={sessionContext ? `${sessionContext.stationId} · ${sessionContext.roles.join(", ")}` : undefined}><User size={15} />{station}</div>
          <button type="button" disabled={endingSession} onClick={() => { setEndSessionError(null); setShowEndSessionDialog(true); }} className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-bold transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="사용 종료 및 화면 초기화"><LogOut size={16} />사용 종료</button>
          <button onClick={() => setIsDark((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-muted" aria-label={isDark ? "라이트 모드" : "다크 모드"}>{isDark ? <Sun size={19} /> : <Moon size={19} />}</button>
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
          dispatchStreamAvailable={apiConfig.presentationScenarioEnabled || runtimeDataMode === "DEMO_SIMULATION"}
          dispatchStreamStatus={presentationReplayStatus}
          dispatchPreview={dispatchPreview}
          dispatchAccepted={Boolean(presentationScenarioId)}
          onRequestSave={() => setShowSaveDialog(true)}
          onContactAttempt={() => setMessages((previous) => [...previous, makeMessage("SYSTEM", `${dispatchContact.name} 전화 연결을 시도했습니다.`)])}
          onConnectDispatch={() => { void loadPresentationIncident(); }}
          onAcceptDispatch={acceptPresentationIncident}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          <section className="grid h-[88px] shrink-0 grid-cols-4 gap-3" aria-label="현장대응 요약">
            <StatusCard label="현재 단계" value={agentPhase ? PHASE_LABELS[agentPhase] : phaseFallback} detail={analysisStateLabel(analysis?.state)} tone="primary" />
            <StatusCard label="출동 상태" value={journeyLabel(journeyState)} detail={!apiConfig.movementEnabled ? "이동 API 준비 중" : journeyState === "ARRIVED" || journeyState === "ON_SCENE" ? "현장 도착 확인" : "위치 갱신 대기"} tone="blue" />
            <StatusCard label="ETA · 남은 거리" value={`${formatEta(route?.etaSeconds)} · ${formatDistance(route?.remainingDistanceM)}`} detail={route?.providerMode === "DEMO_SIMULATION" ? "시연 경로" : route?.provider ?? "도로 경로 없음"} tone="neutral" />
            <StatusCard label="GPS 상태" value={gpsPresentation.label} detail={gpsPresentation.detail} tone={gpsPresentation.tone === "bad" ? "danger" : gpsPresentation.tone === "good" ? "green" : "neutral"} />
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-[minmax(500px,1.05fr)_minmax(480px,0.95fr)] gap-3">
            <Suspense fallback={<div className="grid min-h-[460px] place-items-center rounded-2xl border border-border bg-card text-xs text-muted-foreground">지도 모듈을 준비하고 있습니다…</div>}>
              <IncidentMap context={effectiveMapContext} isDark={isDark} gps={gpsPresentation} />
            </Suspense>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="shrink-0 border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="grid flex-1 grid-cols-2 rounded-xl border border-border bg-muted p-1">
                    <button onClick={() => setMode("collision")} className={`min-h-11 rounded-lg text-sm font-bold transition ${mode === "collision" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>대응충돌검토</button>
                    <button onClick={() => setMode("substance")} className={`min-h-11 rounded-lg text-sm font-bold transition ${mode === "substance" ? "bg-primary text-white shadow" : "text-muted-foreground"}`}>물질검색</button>
                  </div>
                  <button disabled={!apiConfig.recordEnabled || recordResetPending || !incidentId || analysisIds.length === 0} onClick={() => setShowSaveDialog(true)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 text-[13px] font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Save size={13} />{!apiConfig.recordEnabled ? "기록 저장 준비 중" : recordResetPending ? "저장 완료" : "기록 저장"}</button>
                </div>
                {mode === "collision" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={facilityName} onChange={(event) => { clearPresentationReplayForManualEdit(); setFacilityName(event.target.value); }} className="min-h-11 rounded-lg border border-border bg-input-background px-3.5 text-sm outline-none focus:border-primary" placeholder="시설명(출동지령 기준)" />
                    <input value={address} onChange={(event) => { clearPresentationReplayForManualEdit(); setAddress(event.target.value); }} className="min-h-11 rounded-lg border border-border bg-input-background px-3.5 text-sm outline-none focus:border-primary" placeholder="사고 주소(좌표는 BE 검증)" />
                  </div>
                )}
                {presentationReplayStatus === "WAITING" && (
                  <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs leading-relaxed text-blue-800 dark:text-blue-200" role="status">
                    <strong>지령 스트림 연결 중</strong> · BE SSE에서 개인정보 없는 공개 합성 신고가 도착하기를 기다리고 있습니다.
                  </div>
                )}
                {presentationScenarioId && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200" role="status">
                    <strong>지령 반영 완료</strong> · 신고 내용을 확인한 뒤 아래에서 분석을 시작하세요.
                    {presentationReplay && <details className="mt-1"><summary className="cursor-pointer font-semibold">통신 정보 보기</summary><p className="mt-1 break-all text-xs opacity-85">공개 합성 신고 · SSE event {presentationReplay.sourceEventId} · 요청 ID {presentationReplay.requestId} · 실제 staging BE·AI 사용</p></details>}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <section className={`sticky top-0 z-20 rounded-xl border p-4 shadow-md backdrop-blur-md ${currentTask.complete ? "border-emerald-500/40 bg-emerald-50/95 dark:bg-emerald-950/90" : "border-blue-500/40 bg-blue-50/95 dark:bg-blue-950/90"}`} aria-label="현재 해야 할 일">
                  <div className="flex items-center gap-2.5"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${currentTask.complete ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}`}>{currentTask.step}</span><p className="text-[15px] font-black">{currentTask.title}</p></div>
                  <p className="mt-2 text-[13px] font-medium leading-relaxed text-foreground/80">{currentTask.detail}</p>
                </section>
                {error && <ErrorNotice error={error} onRetry={error.retryable && (input.trim() || lastIncidentText) ? () => { if (input.trim()) void handleSubmit(); else if (lastIncidentText) void runAnalysis(lastIncidentText, false); } : undefined} />}
                {movementError && <div className="rounded-lg border border-accent/30 bg-accent/5 p-2 text-xs text-accent">경로 갱신: {movementError} 기존 화면은 유지됩니다.</div>}
                {mode === "collision" ? (
                  <>
                    <IncidentAnalysisCard analysis={analysis} onConfirm={(role, casNumber, displayName) => openConfirmation({ role, casNumber, displayName })} confirmingRole={confirmingRole} />
                    {analysis?.agent && <details className="overflow-hidden rounded-xl border border-border bg-card"><summary className="cursor-pointer px-3 py-3 text-[13px] font-semibold">상세 대응 절차·에이전트 기록 보기</summary><div className="border-t border-border p-2"><AgentPanel agent={analysis.agent} /></div></details>}
                    {messages.length > 1 && <details className="rounded-xl border border-border bg-secondary/30"><summary className="cursor-pointer px-3 py-2.5 text-[13px] font-semibold">대화·상태 기록 {messages.length}건</summary><div className="space-y-2 border-t border-border p-3">{messages.slice(-6).map((message) => <div key={message.messageId} className={`rounded-lg p-2 text-xs leading-relaxed ${message.role === "USER" ? "ml-8 bg-primary/10" : "mr-8 bg-card border border-border"}`}><p className="font-semibold text-muted-foreground">{message.role === "USER" ? "대원" : message.role === "ASSISTANT" ? "에이전트" : "시스템"}</p><p className="mt-0.5">{message.text}</p></div>)}</div></details>}
                  </>
                ) : <SubstanceResults result={materialResult} incidentAvailable={Boolean(incidentId)} onUseCandidate={(candidate) => openConfirmation({ role: "INCIDENT", casNumber: candidate.casNumber, displayName: candidate.displayName })} />}
              </div>

              <div className="shrink-0 border-t border-border p-3">
                <MessageComposer
                  mode={mode}
                  value={input}
                  loading={loading}
                  unavailable={runtimeDataMode === "UNAVAILABLE"}
                  onChange={changeIncidentInput}
                  onSubmit={(value) => { void handleSubmit(value); }}
                />
                {loading && <p className="mt-1.5 text-xs text-muted-foreground">{mode === "collision" ? "신고·시설 이력·확인 게이트를 점검 중입니다…" : "물질 후보와 공식 근거를 검색 중입니다…"}</p>}
              </div>
            </div>
          </section>
        </main>
      </div>

      {confirmationTarget && (
        <DialogShell title="현장 물질 확인 기록" onClose={() => !confirmingRole && setConfirmationTarget(null)}>
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">확인할 후보</p><p className="mt-1 text-sm font-bold">{confirmationTarget.displayName}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">CAS {confirmationTarget.casNumber}</p></div>
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
              <span className="mt-1 block text-xs font-normal text-muted-foreground">현재 기기 시각을 기본값으로 사용합니다. 실제 확인 시각과 다르면 수정하세요.</span>
            </label>
            <p className="rounded-xl bg-accent/10 p-3 text-[13px] leading-relaxed text-accent">이 작업은 AI 후보 승인이 아니라 현장 확인 레코드 생성입니다. 직접 확인한 근거와 시각만 기록해주세요.</p>
            {error && <ErrorNotice error={error} />}
            <div className="flex gap-2"><button onClick={() => setConfirmationTarget(null)} disabled={Boolean(confirmingRole)} className="min-h-11 flex-1 rounded-xl border border-border font-semibold">취소</button><button onClick={() => void handleConfirm()} disabled={Boolean(confirmingRole) || !confirmationDateTimeToIso(confirmationObservedAt)} className="min-h-11 flex-1 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">{confirmingRole ? "저장 중…" : "현장 확인 기록 저장"}</button></div>
          </div>
        </DialogShell>
      )}

      {showSaveDialog && (
        <DialogShell title="대응 기록 저장" onClose={() => !saving && setShowSaveDialog(false)}>
          <div className="p-5">
            <p className="text-sm leading-relaxed">현재 대화와 현장 확인 내용을 대응 기록으로 저장합니다. 저장 후 새 사고 화면으로 초기화할까요?</p>
            <ul className="mt-3 space-y-1 text-[13px] text-muted-foreground"><li>• 대화와 분석 결과</li><li>• 물질 확인·사고 위치·출동 상태</li><li>• 대응 근거와 모델·데이터·규칙 버전</li></ul>
            {saveError && <p className="mt-3 rounded-lg bg-primary/10 p-2 text-[13px] text-primary">{saveError} 현재 화면과 분석 결과는 유지됩니다.</p>}
            <div className="mt-5 flex gap-2"><button disabled={saving} onClick={() => setShowSaveDialog(false)} className="min-h-11 flex-1 rounded-xl border border-border font-semibold">취소</button><button disabled={saving} onClick={() => void handleSave()} className="min-h-11 flex-1 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">{saving ? "저장 중…" : "저장 후 초기화"}</button></div>
          </div>
        </DialogShell>
      )}

      {showEndSessionDialog && (
        <DialogShell title="사용 종료" onClose={() => !endingSession && setShowEndSessionDialog(false)}>
          <div className="p-5">
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><AlertTriangle size={17} /></span>
              <div>
                <p className="text-sm font-bold">현재 대응 화면을 초기화할까요?</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">저장하지 않은 내용은 복구할 수 없습니다. GPS와 진행 중인 요청도 즉시 중단됩니다.{apiConfig.authEnabled ? " 로그인 세션도 함께 종료됩니다." : " 현재 공개 모드에서는 서버 세션을 사용하지 않습니다."}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px] text-muted-foreground"><li>• 현재 사고와 물질 확인 결과</li><li>• 대화·AI 분석·대응 근거</li><li>• 시설명·주소·신고 입력값</li></ul>
            {endSessionError && <p className="mt-3 rounded-lg bg-primary/10 p-2 text-[13px] leading-relaxed text-primary">{endSessionError} 화면은 유지됐습니다. 다시 시도해주세요.</p>}
            <div className="mt-5 flex gap-2"><button type="button" disabled={endingSession} onClick={() => setShowEndSessionDialog(false)} className="min-h-11 flex-1 rounded-xl border border-border font-semibold">취소</button><button type="button" disabled={endingSession} onClick={() => void handleEndSession()} className="min-h-11 flex-1 rounded-xl bg-primary font-semibold text-white disabled:opacity-50">{endingSession ? "종료 중…" : "사용 종료 및 초기화"}</button></div>
          </div>
        </DialogShell>
      )}

      {savedRecordId && <div className="fixed bottom-5 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl"><Check size={15} />저장된 기록은 화학사고 대응에 활용됩니다. <span className="font-mono text-xs text-white/70">{savedRecordId}</span></div>}
    </div>
  );
}

function ErrorNotice({ error, onRetry }: { error: UserFacingErrorInfo; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-[13px] text-primary" role="alert">
      <div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span className="flex-1 leading-relaxed">{error.message}</span></div>
      {(error.requestId || onRetry) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-5">
          {error.requestId && <button type="button" onClick={() => void navigator.clipboard.writeText(error.requestId ?? "").then(() => setCopied(true)).catch(() => setCopied(false))} className="min-h-8 rounded-lg border border-primary/25 px-2 text-xs font-semibold">{copied ? "요청 ID 복사됨" : `요청 ID ${error.requestId} 복사`}</button>}
          {onRetry && <button type="button" onClick={onRetry} className="min-h-8 rounded-lg bg-primary px-2 text-xs font-semibold text-white">다시 시도</button>}
        </div>
      )}
    </div>
  );
}

function StatusCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "primary" | "blue" | "green" | "danger" | "neutral" }) {
  const dot = { primary: "bg-primary", blue: "bg-blue-500", green: "bg-emerald-500", danger: "bg-primary", neutral: "bg-slate-400" }[tone];
  return <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"><p className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</p><p className="mt-1.5 truncate text-[15px] font-black">{value}</p><p className="mt-1 truncate text-xs font-medium text-muted-foreground">{detail}</p></div>;
}
