export const contestLiveScenario = {
  scenarioId: "CONTEST-LIVE-CHEMICAL-001",
  title: "염소계 세정제 저장시설 누출",
  dataClassification: "PUBLIC_SYNTHETIC",
  sourceType: "SYNTHETIC_DISPATCH_REPLAY",
  processingPath: "LIVE_BFF_AI",
  disclosure: "개인정보가 없는 공개 합성 신고이며, 분석은 실제 배포된 BE·AI를 사용합니다.",
  platformBasis: "소방안전 빅데이터 플랫폼의 화학사고 물질 표현을 서비스 입력·후보 검색에 활용합니다.",
  facilityName: "공개 합성 사업장",
  address: "경기도 화성시 팔탄면",
  text: "차아염소산나트륨 저장탱크 누출 의심, 인접 저장고에 염산 표기",
} as const;

export type ContestLiveScenario = typeof contestLiveScenario;
