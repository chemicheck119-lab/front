/**
 * chemicheck119-dashboard-bff-v1 화면 사용 타입.
 * 원본: llm/contracts/dashboard-bff-v1.openapi.json (AI PR #31)
 * FE는 이 계약을 표시용으로만 사용하고 모델 API를 직접 호출하지 않는다.
 */
export type DataMode = "LIVE_API" | "CACHED_API" | "DEMO_SIMULATION" | "UNAVAILABLE";
export type JourneyState = "DISPATCHED" | "EN_ROUTE" | "ARRIVED" | "ON_SCENE";
export type AgentPhase =
  | "INCIDENT_INTAKE"
  | "EN_ROUTE_TRIAGE"
  | "ON_SCENE_CONFIRMATION"
  | "CONFLICT_SCREENING_COMPLETE"
  | "EVIDENCE_REVIEW_REQUIRED";

export interface PositionSnapshot {
  latitude: number;
  longitude: number;
  observedAt: string;
  source: "VEHICLE_GPS" | "MDT_DEVICE_GPS" | "MANUAL_DISPATCH" | "DEMO_SIMULATION";
  accuracyM?: number | null;
}

export interface MapPosition extends PositionSnapshot {
  label: string;
  isSimulation: boolean;
}

export interface RouteSnapshot {
  status:
    | "AVAILABLE"
    | "DEMO_SIMULATION"
    | "ROUTE_UNAVAILABLE"
    | "INCIDENT_LOCATION_REQUIRED"
    | "RESPONDER_POSITION_REQUIRED"
    | "POSITION_STALE"
    | "ROUTE_ENDPOINT_MISMATCH"
    | "ARRIVED";
  provider?: string | null;
  providerMode?: Exclude<DataMode, "UNAVAILABLE"> | null;
  routeId?: string | null;
  geometry?: { type: "LineString"; coordinates: Array<[number, number]> } | null;
  totalDistanceM?: number | null;
  remainingDistanceM?: number | null;
  etaSeconds?: number | null;
  progressRatio?: number | null;
  progressRatioIsProbability: false;
  trafficApplied?: boolean | null;
  generatedAt?: string | null;
  attribution?: string | null;
  message: string;
}

export interface MapContext {
  coverageScope: "NATIONWIDE_KOREA";
  incidentPosition?: MapPosition | null;
  responderPosition?: MapPosition | null;
  route: RouteSnapshot;
  rendering?: {
    geometryFormat: "GEOJSON_RFC7946";
    recommendedRenderer: "MAPLIBRE_GL_JS";
    tileProviderRequired: true;
    attributionRequired: true;
    publicOsmStandardTilesForProduction: false;
    routeAnimationSupported: true;
  };
  hazardOverlayStatus: "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL";
}

export interface OperationsAgentSnapshot {
  schemaVersion: "chemicheck119-operations-agent-v1";
  agentType: "DETERMINISTIC_FIELD_RESPONSE_ORCHESTRATOR";
  phase: AgentPhase;
  currentObjective: string;
  nextActions: string[];
  workflow: Array<{
    stepId: string;
    label: string;
    status: "COMPLETED" | "IN_PROGRESS" | "WAITING" | "BLOCKED" | "NOT_APPLICABLE";
    detail: string;
  }>;
  toolExecutions: Array<{
    toolId: string;
    status: "COMPLETED" | "WAITING" | "BLOCKED" | "FALLBACK" | "NOT_RUN" | "UNAVAILABLE";
    outputReference: string;
    summary: string;
  }>;
  mapContext: MapContext;
  autonomousRiskDecisionAllowed: false;
  finalDecisionAuthority: "현장 지휘관";
  traceIsChainOfThought: false;
}

export interface EvidenceCard {
  evidenceId: string;
  casNumber: string;
  source: "KOSHA" | "CAMEO";
  title: string;
  bodyLabel: "공식 문서 발췌";
  bodyPreview: string;
  sourceUrl: string;
  documentVersion: string;
}

export type GroundedRagStatus =
  | "COMPLETED"
  | "FALLBACK_EXTRACTIVE"
  | "NOT_RUN_REQUIRES_CONFIRMED_PAIR"
  | "NOT_RUN_RULE_NOT_COMPLETED"
  | "NO_GROUNDED_EVIDENCE"
  | "DISABLED";

export interface GroundedRagResult {
  status: GroundedRagStatus;
  statements: Array<{ text: string; sourceIds: string[] }>;
  citations: Array<{ sourceId: string; title: string; sourceUrls: string[] }>;
  usedLlm?: boolean;
  semanticGroundingVerified?: boolean;
  riskDecisionSource?: "DETERMINISTIC_CAMEO_RULE_ENGINE" | string;
}

export interface MaterialCandidate {
  rank: number;
  casNumber: string;
  displayName: string;
  matchBasis: "IDENTITY_EXPRESSION" | "PUBLIC_PROPERTY_PROFILE" | "IDENTITY_AND_PUBLIC_PROPERTY_PROFILE";
  matchedExpression?: string | null;
  matchedProperties: Array<{ field: string; label: string; value: string }>;
  propertySource?: { label: string; sourceUrl: string; documentVersion: string } | null;
  evidenceStatus: string;
  evidenceWarning?: string | null;
  evidenceNotice?: string | null;
  casLinkWarning?: string | null;
  evidenceCards: EvidenceCard[];
  requiresResponderConfirmation: true;
  ruleEligible: false;
  riskDeterminationAllowed: false;
}

export interface MaterialDiscoveryResponse {
  schemaVersion: "chemicheck119-dashboard-bff-v1";
  sourceModelSchemaVersion: "chemiguard119-api-v1";
  requestId: string;
  query: string;
  status: "CANDIDATES_FOUND" | "NO_RELIABLE_CANDIDATE" | "PROFILE_INDEX_NOT_AVAILABLE";
  searchMode: "IDENTITY_AND_PROPERTY_RETRIEVAL" | "IDENTITY_RETRIEVAL" | "PROPERTY_PROFILE_RETRIEVAL" | "ABSTAINED";
  candidates: MaterialCandidate[];
  requiresResponderConfirmation: true;
  candidateScoreIsProbability: false;
  riskDisplayAllowed: false;
  notice: string;
  safetyNotice: string;
}

export interface IncidentAnalyzeRequest {
  incidentId?: string | null;
  text: string;
  inputType?: "MANUAL_TEXT" | "DISPATCH_TEXT" | "VOICE_TRANSCRIPT" | "STRUCTURED_FORM";
  occurredAt?: string | null;
  location?: {
    facilityName?: string | null;
    address?: string | null;
    province?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    coordinateSource?: "DISPATCH_SYSTEM" | "GEOCODING_PROVIDER" | "RESPONDER_OBSERVATION" | "MANUAL_ENTRY" | "DEMO_FIXTURE" | null;
    resolvedAt?: string | null;
  } | null;
  operationsContext?: {
    dispatchStationName?: string | null;
    responderPosition?: PositionSnapshot | null;
    journeyState?: JourneyState;
  } | null;
  plannedActions?: string[];
  evidenceTopK?: number;
}

export interface ConflictReviewWaiting {
  executed: false;
  status: "NOT_RUN_REQUIRES_TWO_CONFIRMED_CAS";
  missingConfirmations: Array<"incident_cas" | "facility_cas">;
  reason: string;
  riskDisplayAllowed: false;
}

export interface ConflictReviewCompleted {
  executed: true;
  status: "SCREENING_COMPLETED";
  riskDisplayAllowed: true;
  result: {
    kind: "ORDINAL_SCREENING_RESULT";
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    riskLevelKo: "낮음" | "중간" | "높음";
    briefText: string;
    riskScale: { isProbability: false; lowMeansSafe: false; probabilityPercent: null };
    requiredChecks: string[];
    evidenceUrls: string[];
    limitations: string[];
    ruleId: string;
    ruleVersion: string;
    finalDecision: "현장 지휘관 판단";
  };
}

export interface IncidentAnalysisResponse {
  schemaVersion: "chemicheck119-dashboard-bff-v1";
  sourceModelSchemaVersion: "chemiguard119-api-v1";
  analysisId: string;
  requestId: string;
  incidentId: string;
  state:
    | "AWAITING_SUBSTANCE_CONFIRMATION"
    | "AWAITING_INCIDENT_CONFIRMATION"
    | "AWAITING_FACILITY_CONFIRMATION"
    | "SCREENING_COMPLETED"
    | "VERIFY_REQUIRED"
    | "UNCLASSIFIED"
    | "CAMEO_GROUP_SCREENING_ONLY";
  substanceCandidates: Array<{
    surfaceText: string;
    role: "INCIDENT" | "FACILITY" | "UNKNOWN";
    resolverStatus: string;
    candidates: Array<{ casNumber: string; rankingScore?: number | null; rankingScoreIsProbability: false }>;
    requiresResponderConfirmation: true;
  }>;
  facilityHistory: {
    status: "CANDIDATES_FOUND" | "NO_HISTORY_MATCH" | "NOT_QUERIED";
    label: string;
    warning: string;
    candidates: Array<{ facilityName: string; casNumber: string; chemicalNames?: string | null; sourceUrl?: string | null }>;
  };
  evidenceCards: EvidenceCard[];
  groundedRag?: GroundedRagResult | null;
  agent?: OperationsAgentSnapshot | null;
  confirmationGate: {
    incidentConfirmed: boolean;
    facilityConfirmed: boolean;
    allRequiredConfirmed: boolean;
    ruleExecutionAllowed: boolean;
  };
  conflictReview: ConflictReviewWaiting | ConflictReviewCompleted | {
    executed: true;
    status: "VERIFY_REQUIRED" | "UNCLASSIFIED" | "CAMEO_GROUP_SCREENING_ONLY";
    riskDisplayAllowed: false;
    result: { kind: "INCONCLUSIVE_RESULT"; reason: string };
  };
  riskDisplayAllowed: boolean;
  requiredNextSteps: string[];
  provenance: {
    modelVersion: string;
    dataVersion: string;
    rulePolicy: string;
    expertReviewed: false;
    finalDecisionAuthority: "현장 지휘관";
  };
  safetyNotice: string;
}

export interface MovementUpdateRequest {
  responderPosition: PositionSnapshot;
  journeyState: JourneyState;
  clientSequence: number;
}

export interface MovementUpdateResponse {
  schemaVersion: "chemicheck119-dashboard-bff-v1";
  requestId: string;
  incidentId: string;
  acceptedAt: string;
  clientSequence: number;
  mapContext: MapContext;
  nextRefreshSeconds: number;
  routeRecalculated: boolean;
}

export interface ConfirmationRequest {
  role: "INCIDENT" | "FACILITY";
  casNumber: string;
  displayName?: string | null;
  confirmationBasis: "CONTAINER_LABEL" | "SITE_MSDS" | "SHIPPING_DOCUMENT" | "INSTRUMENT_READING" | "RESPONDER_OBSERVATION" | "OTHER_VERIFIED_SOURCE";
  observedAt: string;
}

export interface ConfirmationResponse {
  requestId: string;
  incidentId: string;
  confirmationId: string;
  role: "INCIDENT" | "FACILITY";
  casNumber: string;
  createdAt: string;
  reanalyzeRequired: true;
}

export interface RecordSaveRequest {
  conversationStartedAt: string;
  messages: Array<{
    messageId: string;
    sequence: number;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    text: string;
    createdAt: string;
    analysisId?: string | null;
  }>;
  analysisIds: string[];
  confirmationIds: string[];
}

export interface RecordSaveResponse {
  requestId: string;
  incidentId: string;
  recordId: string;
  savedAt: string;
  resetAllowed: true;
}
