import type {
  ConfirmationResponse,
  IncidentAnalysisResponse,
  MapContext,
  MaterialDiscoveryResponse,
  MovementUpdateResponse,
  RecordDetailResponse,
  RecordSaveResponse,
  RecordSummary,
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
    status: "CANDIDATES_FOUND",
    label: "과거 공개 이력 기반 시설물질 후보",
    warning: "과거 이력은 현재 재고를 의미하지 않으며 현장 확인이 필요합니다.",
    candidates: [{
      facilityName: "시연 사업장",
      casNumber: "7647-01-0",
      chemicalNames: "염산",
      sourceUrl: "https://icis.me.go.kr/",
    }],
  },
  evidenceCards: [
    {
      evidenceId: "EVD-DEMO-KOSHA-1",
      casNumber: "7681-52-9",
      source: "KOSHA",
      title: "차아염소산나트륨 공식 MSDS 근거",
      bodyLabel: "공식 문서 발췌",
      bodyPreview: "용기 라벨과 현장 MSDS에서 제품명, CAS, 농도를 함께 대조해야 합니다.",
      sourceUrl: "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do",
      documentVersion: "시연 링크",
    },
    {
      evidenceId: "EVD-DEMO-CAMEO-1",
      casNumber: "7647-01-0",
      source: "CAMEO",
      title: "CAMEO Chemicals 염산 자료",
      bodyLabel: "공식 문서 발췌",
      bodyPreview: "공개 반응성 자료는 현장 조건을 대체하지 않으며 추가 확인이 필요합니다.",
      sourceUrl: "https://cameochemicals.noaa.gov/chemical/3598",
      documentVersion: "시연 링크",
    },
  ],
  groundedRag: {
    status: "NOT_RUN_REQUIRES_CONFIRMED_PAIR",
    statements: [],
    citations: [],
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
    response.groundedRag = {
      status: "COMPLETED",
      usedLlm: true,
      semanticGroundingVerified: false,
      riskDecisionSource: "DETERMINISTIC_CAMEO_RULE_ENGINE",
      statements: [
        {
          text: "확인된 두 CAS의 조합은 공개 CAMEO 반응성 규칙에서 추가 격리와 현장 조건 확인이 필요한 조합으로 검토됐습니다.",
          sourceIds: ["CAMEO-PAIR"],
        },
        {
          text: "농도, 온도, 실제 혼합 여부는 이 공개 근거만으로 확인할 수 없으므로 현장 계측과 지휘관 판단이 필요합니다.",
          sourceIds: ["CAMEO-LIMIT"],
        },
      ],
      citations: [
        { sourceId: "CAMEO-PAIR", title: "CAMEO 반응성 검토", sourceUrls: ["https://cameochemicals.noaa.gov/reactivity"] },
        { sourceId: "CAMEO-LIMIT", title: "CAMEO Chemicals", sourceUrls: ["https://cameochemicals.noaa.gov/"] },
      ],
    };
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
    schemaVersion: "chemicheck119-dashboard-bff-v1",
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
    schemaVersion: "chemicheck119-dashboard-bff-v1",
    requestId: "REQ-DEMO-RECORD-001",
    incidentId: DEMO_INCIDENT_ID,
    recordId: `REC-DEMO-${Date.now()}`,
    savedAt: new Date().toISOString(),
    resetAllowed: true,
  };
}

const DEMO_RECORD_SUMMARIES: RecordSummary[] = [
  {
    recordId: "REC-DEMO-0001",
    incidentId: DEMO_INCIDENT_ID,
    facilityName: "울산 화학공장",
    incidentSubstanceName: "차아염소산나트륨",
    briefApplicationStatus: "APPLIED",
    finalResponseOutcome: "SPREAD_CONTAINED",
    savedAt: "2026-09-16T21:08:00Z",
  },
  {
    recordId: "REC-DEMO-0002",
    incidentId: "INC-DEMO-20260801-0002",
    facilityName: "울산 △△산업",
    incidentSubstanceName: "염산",
    briefApplicationStatus: "REVIEWED_NOT_APPLIED",
    finalResponseOutcome: "MONITORING_CONTINUES",
    savedAt: "2026-09-16T18:42:00Z",
  },
];

export function makeDemoRecordList(): RecordSummary[] {
  return DEMO_RECORD_SUMMARIES.map((record) => ({ ...record }));
}

type DemoRecordDetailBody = Pick<
  RecordDetailResponse,
  "conversationStartedAt" | "facilityAddress" | "incidentSubstanceCas" | "performedActions" | "additionalFactors" | "conflictRisk" | "messages"
>;

const DEMO_RECORD_DETAILS: Record<string, DemoRecordDetailBody> = {
  "REC-DEMO-0001": {
    conversationStartedAt: "2026-09-16T21:00:00Z",
    facilityAddress: "울산광역시 남구 산업로 119",
    incidentSubstanceCas: "7681-52-9",
    performedActions: ["ZONE_CONTROL", "LEAK_SOURCE_CONTROL"],
    additionalFactors: ["ENCLOSED_SPACE"],
    conflictRisk: {
      analysisId: "ANL-DEMO-0001",
      incidentCas: "7681-52-9",
      facilitySubstanceName: "염산",
      facilitySubstanceCas: "7647-01-0",
      ruleId: "CAMEO-REACTIVE-GROUP-COMPATIBILITY-MATRIX",
      ruleVersion: "RUNTIME-MANIFEST-1",
      severity: "HIGH_RISK",
      riskLevel: "HIGH",
      riskLevelKo: "높음",
      briefText: "산성 물질과 접촉하면 독성 염소가스가 발생할 수 있습니다.",
      expertReviewed: false,
      humanConfirmationRequired: true,
      hazardCodes: ["C", "T"],
      gasProducts: ["Cl2"],
    },
    messages: [
      { messageId: "MSG-0001", sequence: 1, role: "USER", text: "차아염소산나트륨 저장탱크 누출", createdAt: "2026-09-16T21:00:00Z", analysisId: null },
      { messageId: "MSG-0002", sequence: 2, role: "ASSISTANT", text: "현장 확인이 필요합니다.", createdAt: "2026-09-16T21:00:02Z", analysisId: "ANL-DEMO-0001" },
    ],
  },
  "REC-DEMO-0002": {
    conversationStartedAt: "2026-09-16T18:30:00Z",
    facilityAddress: "울산광역시 남구 공단로 45",
    incidentSubstanceCas: "7647-01-0",
    performedActions: ["EVACUATION", "VENTILATION"],
    additionalFactors: [],
    conflictRisk: null,
    messages: [
      { messageId: "MSG-0001", sequence: 1, role: "USER", text: "염산 이송배관 미세 누출", createdAt: "2026-09-16T18:30:00Z", analysisId: null },
      { messageId: "MSG-0002", sequence: 2, role: "ASSISTANT", text: "시설 물질 확인 전이라 반응 위험 검토를 표시할 수 없습니다.", createdAt: "2026-09-16T18:30:02Z", analysisId: "ANL-DEMO-0002" },
    ],
  },
};

export function makeDemoRecordDetail(recordId: string): RecordDetailResponse {
  const summary = DEMO_RECORD_SUMMARIES.find((record) => record.recordId === recordId) ?? DEMO_RECORD_SUMMARIES[0];
  const body = DEMO_RECORD_DETAILS[summary.recordId];
  return {
    schemaVersion: "chemicheck119-dashboard-bff-v1",
    requestId: "REQ-DEMO-RECORD-DETAIL-001",
    recordId: summary.recordId,
    incidentId: summary.incidentId,
    savedAt: summary.savedAt,
    facilityName: summary.facilityName,
    incidentSubstanceName: summary.incidentSubstanceName,
    briefApplicationStatus: summary.briefApplicationStatus,
    finalResponseOutcome: summary.finalResponseOutcome,
    ...body,
  };
}
