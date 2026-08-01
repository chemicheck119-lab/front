import type {
  ConfirmationResponse,
  IncidentAnalysisResponse,
  MapContext,
  MaterialDiscoveryResponse,
  MovementUpdateResponse,
  RecordSaveResponse,
} from "../api/contracts";

export const DEMO_INCIDENT_ID = "INC-DEMO-20260801-0001";
const demoConfirmedRoles = new Set<"INCIDENT" | "FACILITY">();

export const demoMapContext: MapContext = {
  coverageScope: "NATIONWIDE_KOREA",
  incidentPosition: {
    latitude: 37.2181,
    longitude: 126.9417,
    observedAt: "2026-08-01T12:20:00+09:00",
    source: "DEMO_SIMULATION",
    label: "경기 화성시 팔탄면 사고지점",
    isSimulation: true,
  },
  responderPosition: {
    latitude: 37.2065,
    longitude: 126.8311,
    observedAt: new Date().toISOString(),
    source: "DEMO_SIMULATION",
    accuracyM: 12,
    label: "시연용 출동 차량",
    isSimulation: true,
  },
  route: {
    status: "DEMO_SIMULATION",
    provider: "DEMO_ROUTE_FIXTURE",
    providerMode: "DEMO_SIMULATION",
    routeId: "ROUTE-DEMO-001",
    geometry: {
      type: "LineString",
      coordinates: [
        [126.8311, 37.2065],
        [126.855, 37.2074],
        [126.878, 37.2092],
        [126.9, 37.21],
        [126.921, 37.214],
        [126.9417, 37.2181],
      ],
    },
    totalDistanceM: 10000,
    remainingDistanceM: 4000,
    etaSeconds: 480,
    progressRatio: 0.6,
    progressRatioIsProbability: false,
    trafficApplied: false,
    generatedAt: new Date().toISOString(),
    attribution: "발표용 경로 fixture — 실제 길찾기 결과 아님",
    message: "시연용 출동 경로입니다.",
  },
  rendering: {
    geometryFormat: "GEOJSON_RFC7946",
    recommendedRenderer: "MAPLIBRE_GL_JS",
    tileProviderRequired: true,
    attributionRequired: true,
    publicOsmStandardTilesForProduction: false,
    routeAnimationSupported: true,
  },
  hazardOverlayStatus: "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL",
};

export const demoAnalysis: IncidentAnalysisResponse = {
  schemaVersion: "chemicheck119-dashboard-bff-v1",
  sourceModelSchemaVersion: "chemiguard119-api-v1",
  analysisId: "ANL-DEMO-0001",
  requestId: "REQ-DEMO-0001",
  incidentId: DEMO_INCIDENT_ID,
  state: "AWAITING_SUBSTANCE_CONFIRMATION",
  substanceCandidates: [
    {
      surfaceText: "차아염소산나트륨",
      role: "INCIDENT",
      resolverStatus: "EXACT_ALIAS_CANDIDATE",
      candidates: [{ casNumber: "7681-52-9", rankingScore: 1, rankingScoreIsProbability: false }],
      requiresResponderConfirmation: true,
    },
    {
      surfaceText: "염산",
      role: "FACILITY",
      resolverStatus: "EXACT_ALIAS_CANDIDATE",
      candidates: [{ casNumber: "7647-01-0", rankingScore: 1, rankingScoreIsProbability: false }],
      requiresResponderConfirmation: true,
    },
  ],
  facilityHistory: {
    status: "NO_HISTORY_MATCH",
    label: "과거 공개 이력 기반 시설물질 후보",
    warning: "과거 이력은 현재 재고를 의미하지 않으며 현장 확인이 필요합니다.",
    candidates: [],
  },
  evidenceCards: [],
  groundedRag: {
    status: "NOT_RUN_REQUIRES_CONFIRMED_PAIR",
    statements: [],
    citations: [],
  },
  agent: {
    schemaVersion: "chemicheck119-operations-agent-v1",
    agentType: "DETERMINISTIC_FIELD_RESPONSE_ORCHESTRATOR",
    phase: "EN_ROUTE_TRIAGE",
    currentObjective: "출동 중 신고·시설 이력·공식 근거를 미리 정리합니다.",
    nextActions: [
      "용기 라벨 또는 현장 MSDS로 사고물질 CAS를 확인하세요.",
      "시설물질의 현재 존재와 CAS를 운송 문서 또는 라벨로 확인하세요.",
    ],
    workflow: [
      { stepId: "INCIDENT_INGESTION", label: "신고 접수", status: "COMPLETED", detail: "출동 지령이 접수됐습니다." },
      { stepId: "INCIDENT_PARSING", label: "신고문 구조화", status: "COMPLETED", detail: "누출 및 물질 표현을 찾았습니다." },
      { stepId: "INCIDENT_LOCATION", label: "사고 위치", status: "COMPLETED", detail: "시연 좌표가 연결됐습니다." },
      { stepId: "SUBSTANCE_RESOLUTION", label: "물질 후보 검색", status: "COMPLETED", detail: "CAS 후보 2건을 찾았습니다." },
      { stepId: "ON_SITE_CONFIRMATION", label: "현장 물질 확인", status: "IN_PROGRESS", detail: "두 CAS의 현장 근거가 필요합니다." },
      { stepId: "CONFLICT_SCREENING", label: "충돌 규칙", status: "BLOCKED", detail: "확인 전에는 실행하지 않습니다." },
      { stepId: "RESPONSE_RECORD", label: "대응 기록", status: "WAITING", detail: "분석·확인 결과를 저장할 예정입니다." },
    ],
    toolExecutions: [
      { toolId: "RULE_PARSER", status: "COMPLETED", outputReference: "ANL-DEMO-0001", summary: "신고문 구조화를 완료했습니다." },
      { toolId: "SUBSTANCE_RESOLVER", status: "COMPLETED", outputReference: "ANL-DEMO-0001", summary: "물질 후보 2건을 찾았습니다." },
      { toolId: "CONFIRMATION_GATE", status: "WAITING", outputReference: "ANL-DEMO-0001", summary: "현장 확인 2건을 기다립니다." },
      { toolId: "CAMEO_RULE_ENGINE", status: "NOT_RUN", outputReference: "", summary: "확인 게이트가 열리기 전에는 실행하지 않습니다." },
      { toolId: "SERVER_ROUTE_PROVIDER", status: "FALLBACK", outputReference: "ROUTE-DEMO-001", summary: "시연용 경로 fixture를 표시합니다." },
    ],
    mapContext: demoMapContext,
    autonomousRiskDecisionAllowed: false,
    finalDecisionAuthority: "현장 지휘관",
    traceIsChainOfThought: false,
  },
  confirmationGate: {
    incidentConfirmed: false,
    facilityConfirmed: false,
    allRequiredConfirmed: false,
    ruleExecutionAllowed: false,
  },
  conflictReview: {
    executed: false,
    status: "NOT_RUN_REQUIRES_TWO_CONFIRMED_CAS",
    missingConfirmations: ["incident_cas", "facility_cas"],
    reason: "사고물질과 시설물질 CAS의 현장 확인이 모두 필요합니다.",
    riskDisplayAllowed: false,
  },
  riskDisplayAllowed: false,
  requiredNextSteps: ["용기 라벨·현장 MSDS·운송 문서 등으로 두 물질의 CAS를 확인하세요."],
  provenance: {
    modelVersion: "demo-contract-v1",
    dataVersion: "demo-fixture-2026-08-01",
    rulePolicy: "PUBLIC_SOURCE_PILOT_V1",
    expertReviewed: false,
    finalDecisionAuthority: "현장 지휘관",
  },
  safetyNotice: "시연 데이터입니다. 후보만으로 위험을 확정하지 않으며 최종 판단은 현장 지휘관이 수행합니다.",
};

export function getDemoAnalysis(incidentId = DEMO_INCIDENT_ID): IncidentAnalysisResponse {
  const response = structuredClone({ ...demoAnalysis, incidentId });
  const incidentConfirmed = demoConfirmedRoles.has("INCIDENT");
  const facilityConfirmed = demoConfirmedRoles.has("FACILITY");
  const completed = incidentConfirmed && facilityConfirmed;
  response.confirmationGate = {
    incidentConfirmed,
    facilityConfirmed,
    allRequiredConfirmed: completed,
    ruleExecutionAllowed: completed,
  };
  if (completed) {
    response.state = "SCREENING_COMPLETED";
    response.riskDisplayAllowed = true;
    response.conflictReview = {
      executed: true,
      status: "SCREENING_COMPLETED",
      riskDisplayAllowed: true,
      result: {
        kind: "ORDINAL_SCREENING_RESULT",
        riskLevel: "HIGH",
        riskLevelKo: "높음",
        briefText: "NOAA/EPA CAMEO 공개 원자료로 대조한 반응성 그룹 조합의 시연 결과는 높음입니다.",
        riskScale: { isProbability: false, lowMeansSafe: false, probabilityPercent: null },
        requiredChecks: [
          "두 물질의 물리적 형태와 농도를 다시 확인",
          "저장구역·배수로·환기계통의 실제 연결 여부 확인",
          "실제 혼합 여부와 현장 계측 결과 확인",
        ],
        evidenceUrls: [
          "https://cameochemicals.noaa.gov/chemical/4503",
          "https://cameochemicals.noaa.gov/reactivity",
        ],
        limitations: ["시연용 계약 fixture이며 실제 현장 판정이 아닙니다."],
        ruleId: "CAMEO-REACTIVE-GROUP-COMPATIBILITY-MATRIX",
        ruleVersion: "RUNTIME_MANIFEST_PINNED",
        finalDecision: "현장 지휘관 판단",
      },
    };
    if (response.agent) {
      response.agent.phase = "CONFLICT_SCREENING_COMPLETE";
      response.agent.currentObjective = "결정 규칙 결과와 공식 근거를 현장 지휘관에게 제시합니다.";
      response.agent.nextActions = ["농도·온도·압력과 실제 혼합 여부를 확인하세요.", "지휘관 판단과 대응 내용을 기록으로 저장하세요."];
      response.agent.workflow = response.agent.workflow.map((step) => step.stepId === "ON_SITE_CONFIRMATION" || step.stepId === "CONFLICT_SCREENING"
        ? { ...step, status: "COMPLETED", detail: "시연 확인과 규칙 실행을 완료했습니다." }
        : step);
    }
  } else {
    const missingConfirmations: Array<"incident_cas" | "facility_cas"> = [];
    if (!incidentConfirmed) missingConfirmations.push("incident_cas");
    if (!facilityConfirmed) missingConfirmations.push("facility_cas");
    if (!incidentConfirmed && facilityConfirmed) response.state = "AWAITING_INCIDENT_CONFIRMATION";
    if (incidentConfirmed && !facilityConfirmed) response.state = "AWAITING_FACILITY_CONFIRMATION";
    response.conflictReview = {
      executed: false,
      status: "NOT_RUN_REQUIRES_TWO_CONFIRMED_CAS",
      missingConfirmations,
      reason: "사고물질과 시설물질 CAS의 현장 확인이 모두 필요합니다.",
      riskDisplayAllowed: false,
    };
  }
  return response;
}

export function resetDemoSession() {
  demoConfirmedRoles.clear();
}

export function makeDemoMovement(sequence: number): MovementUpdateResponse {
  return {
    schemaVersion: "chemicheck119-dashboard-bff-v1",
    requestId: `REQ-DEMO-MOVE-${sequence}`,
    incidentId: DEMO_INCIDENT_ID,
    acceptedAt: new Date().toISOString(),
    clientSequence: sequence,
    mapContext: demoMapContext,
    nextRefreshSeconds: 5,
    routeRecalculated: false,
  };
}

export const demoMaterialSearch: MaterialDiscoveryResponse = {
  schemaVersion: "chemicheck119-dashboard-bff-v1",
  sourceModelSchemaVersion: "chemiguard119-api-v1",
  requestId: "REQ-DEMO-SUBSTANCE-001",
  query: "무색 투명하고 박하 냄새가 나는 휘발성 액체",
  status: "CANDIDATES_FOUND",
  searchMode: "PROPERTY_PROFILE_RETRIEVAL",
  candidates: [
    {
      rank: 1,
      casNumber: "78-93-3",
      displayName: "메틸 에틸 케톤",
      matchBasis: "PUBLIC_PROPERTY_PROFILE",
      matchedProperties: [
        { field: "physical_state", label: "상온 상태", value: "액체(휘발성)" },
        { field: "color", label: "색상", value: "무색 투명" },
        { field: "odor", label: "냄새", value: "박하 및 달콤한 냄새" },
      ],
      propertySource: {
        label: "소방청 울산 화학물질 정보 기반 관찰 후보",
        sourceUrl: "https://www.data.go.kr/data/15081005/fileData.do",
        documentVersion: "2021-01-15 기준",
      },
      evidenceStatus: "CAS_EVIDENCE_NOT_LOADED",
      evidenceWarning: "상세 근거가 적재되지 않아 외부 공식 MSDS 확인이 필요합니다.",
      evidenceCards: [],
      requiresResponderConfirmation: true,
      ruleEligible: false,
      riskDeterminationAllowed: false,
    },
  ],
  requiresResponderConfirmation: true,
  candidateScoreIsProbability: false,
  riskDisplayAllowed: false,
  notice: "관찰 특징은 여러 물질이 공유하므로 후보를 자동 확정하지 않습니다.",
  safetyNotice: "용기 라벨·현장 MSDS 등으로 CAS와 현장 존재를 확인하세요.",
};

export function makeDemoConfirmation(role: "INCIDENT" | "FACILITY", casNumber: string): ConfirmationResponse {
  demoConfirmedRoles.add(role);
  return {
    requestId: `REQ-DEMO-CONFIRM-${role}`,
    incidentId: DEMO_INCIDENT_ID,
    confirmationId: `CNF-DEMO-${role}`,
    role,
    casNumber,
    createdAt: new Date().toISOString(),
    reanalyzeRequired: true,
  };
}

export function makeDemoRecord(): RecordSaveResponse {
  return {
    requestId: "REQ-DEMO-RECORD-001",
    incidentId: DEMO_INCIDENT_ID,
    recordId: `REC-DEMO-${Date.now()}`,
    savedAt: new Date().toISOString(),
    resetAllowed: true,
  };
}
