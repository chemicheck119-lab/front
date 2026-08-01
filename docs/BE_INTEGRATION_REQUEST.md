# 케미체크119 FE → BE/BFF 연동 요청서

기준 계약: `chemicheck119-dashboard-bff-v1`

참고 AI 작업: `chemicheck119/llm` PR #31 `codex/30-national-incident-agent`

## 공통 원칙

- FE는 서비스 BE/BFF만 호출합니다.
- 모델 API의 `X-API-Key`와 길찾기 Provider Key는 BE Secret으로만 보관합니다.
- 사용자 인증·사고 접근권한·확인 기록은 BE가 검증합니다.
- 모든 응답은 `requestId`를 포함해 FE→BE→AI 로그를 연결합니다.
- 과거 업체 취급 이력을 현재 재고로 바꾸어 표현하지 않습니다.
- 사고물질·시설물질 CAS 두 개가 확인되기 전 CAMEO 규칙을 실행하지 않습니다.

## 1. 사고 분석

`POST /api/c2guard/v1/incidents/analyze`

필요한 이유: 신고문, 사고 위치, 출동 상태를 구조화하고 안전 게이트·에이전트 단계·근거를 한 DTO로 받기 위해 필요합니다.

요청 핵심:

```json
{
  "incidentId": "INC-20260801-0001",
  "text": "차아염소산나트륨 저장탱크 누출 의심",
  "inputType": "DISPATCH_TEXT",
  "occurredAt": "2026-08-01T12:20:00+09:00",
  "location": {
    "facilityName": "예시 사업장",
    "address": "경기 화성시 팔탄면",
    "latitude": 37.2181,
    "longitude": 126.9417,
    "coordinateSource": "DISPATCH_SYSTEM",
    "resolvedAt": "2026-08-01T12:20:00+09:00"
  },
  "operationsContext": {
    "dispatchStationName": "화성소방서",
    "journeyState": "EN_ROUTE",
    "responderPosition": {
      "latitude": 37.2065,
      "longitude": 126.8311,
      "observedAt": "2026-08-01T12:22:00+09:00",
      "source": "MDT_DEVICE_GPS",
      "accuracyM": 12
    }
  }
}
```

응답 필수: `analysisId`, `incidentId`, `state`, `substanceCandidates`, `facilityHistory`, `confirmationGate`, `conflictReview`, `groundedRag`, `agent`, `provenance`, `safetyNotice`.

오류 처리:

- `401/403`: 사용자 인증·사고 접근권한 오류
- `422`: FE 입력 재시도 유도가 아니라 BE→AI 계약 오류로 기록
- `503 retryable=true`: 기존 분석 유지 후 재시도 허용
- 모델 인증 오류: 사용자 입력 오류로 숨기지 않고 서버 구성 장애로 매핑

담당자 체크리스트:

- [ ] 모델 `/api/v1/incidents/analyze` 호출과 camelCase DTO 투영
- [ ] 모델 경고·출처·확인 상태·버전 필드 누락 금지
- [ ] 저장된 confirmation 조회 후 재분석 입력에 연결
- [ ] 두 확인 전 규칙 실행 차단

## 2. 이동 갱신

`POST /api/c2guard/v1/incidents/{incidentId}/movement`

필요한 이유: 브라우저 GPS를 검증하고 서버측 길찾기 결과를 GeoJSON·ETA로 전달하기 위해 필요합니다. FE는 Key를 갖지 않습니다.

요청:

```json
{
  "responderPosition": {
    "latitude": 37.2065,
    "longitude": 126.8311,
    "observedAt": "2026-08-01T12:22:00+09:00",
    "source": "MDT_DEVICE_GPS",
    "accuracyM": 12
  },
  "journeyState": "EN_ROUTE",
  "clientSequence": 12
}
```

응답 필수: `mapContext.incidentPosition`, `mapContext.responderPosition`, `mapContext.route`, `nextRefreshSeconds`, `routeRecalculated`.

오류·경로 상태:

- 역행 `clientSequence`: `409`
- 사고 좌표 없음: `INCIDENT_LOCATION_REQUIRED`
- GPS 없음: `RESPONDER_POSITION_REQUIRED`
- 5분 이상 오래됨: `POSITION_STALE`; ETA 숨김
- 경로 시작/끝 불일치: `ROUTE_ENDPOINT_MISMATCH`; 경로 숨김
- Provider 장애: `ROUTE_UNAVAILABLE`; 직선 경로·가짜 ETA 금지
- 발표 fixture: 반드시 `DEMO_SIMULATION`과 attribution 포함

담당자 체크리스트:

- [ ] 좌표 범위·시각·sequence 검증
- [ ] 거리/시간 임계값 기반 재탐색으로 요금·rate limit 보호
- [ ] GeoJSON 좌표 순서 `[longitude, latitude]`
- [ ] Provider Key를 Secret으로 보관
- [ ] attribution 반환

## 3. 물질 후보 검색

`POST /api/c2guard/v1/substances/discover`

요청: `{ "query": "무색 투명하고 박하 냄새가 나는 휘발성 액체", "topK": 5, "evidenceTopK": 3 }`

필요한 이유: FE mock 대신 이름·CAS·화학식·관찰 특징 기반 후보와 공식 근거를 받기 위해 필요합니다.

응답 필수: `status`, `searchMode`, `candidates[].displayName/casNumber/matchBasis/matchedProperties/evidenceCards`, `candidateScoreIsProbability=false`, `riskDisplayAllowed=false`, `notice`, `safetyNotice`.

오류 처리:

- 후보 없음은 `NO_RELIABLE_CANDIDATE`; 물질 없음·안전 의미 아님
- artifact 미준비는 `PROFILE_INDEX_NOT_AVAILABLE`
- 상세 근거 미적재 시 다른 CAS의 근거로 대체 금지

담당자 체크리스트:

- [ ] 모델 material discovery 매핑
- [ ] 후보 점수를 확률로 변환하지 않음
- [ ] 출처 URL·문서 버전·근거 경고 보존

## 4. 현장 물질 확인

`POST /api/c2guard/v1/incidents/{incidentId}/confirmations`

요청:

```json
{
  "role": "INCIDENT",
  "casNumber": "7681-52-9",
  "displayName": "차아염소산나트륨",
  "confirmationBasis": "CONTAINER_LABEL",
  "observedAt": "2026-08-01T12:35:00+09:00"
}
```

필요한 이유: 인증된 대원의 현장 확인과 후보 검색을 분리하고 규칙 실행 게이트를 열기 위해 필요합니다.

응답: `confirmationId`, `role`, `casNumber`, `createdAt`, `reanalyzeRequired=true`.

오류 처리: 다른 사고·중복·권한 오류를 구조화하고, 실패 시 FE는 확인된 것으로 표시하지 않습니다.

담당자 체크리스트:

- [ ] 인증 사용자·사고·역할·CAS·근거·서버 시각 저장
- [ ] 사진/문서 진위를 모델이 보증한 것으로 기록하지 않음
- [ ] 확인 성공 후 재분석에서 저장 레코드 사용

## 5. 전체 대응 기록 저장

`POST /api/c2guard/v1/incidents/{incidentId}/record`

요청: `conversationStartedAt`, 순번·역할·시각이 있는 `messages[]`, 중복 없는 `analysisIds[]`, `confirmationIds[]`.

필요한 이유: 대화·분석 snapshot·현장 확인·위치·출동 상태·근거·버전을 하나의 감사 가능한 대응 기록으로 묶기 위해 필요합니다.

성공 응답: `201`, `recordId`, `savedAt`, `resetAllowed=true`.

오류 처리:

- 저장 실패·timeout·네트워크 단절: FE는 화면과 분석을 유지
- 참조 ID가 다른 사고이거나 없음: `409`
- transaction 실패: 부분 저장 없이 실패

담당자 체크리스트:

- [ ] analysis/confirmation 권위 snapshot을 ID로 서버에서 조회
- [ ] FE가 다시 보낸 provenance를 권위 데이터로 신뢰하지 않음
- [ ] transaction 또는 동등한 원자성 보장
- [ ] 성공한 영구 저장에서만 `resetAllowed=true`

## 통합 완료 시나리오

- [ ] 성상 검색 → 후보·출처 표시, 위험 카드는 잠김
- [ ] 신고 분석 → 후보·과거 이력 표시, “현재 보유 확인” 문구 없음
- [ ] 한 CAS만 확인 → 규칙 미실행
- [ ] 두 CAS 확인 → 지원 규칙이 있을 때만 서수 위험등급 표시
- [ ] 근거 부족 → “공개 근거 부족”, 임의 `LOW/안전` 없음
- [ ] GPS 갱신 → GeoJSON 도로 경로·ETA 또는 명시적 unavailable
- [ ] 저장 성공 → `recordId` → 초기화
- [ ] 저장 실패 → 전체 화면 유지
- [ ] 브라우저 네트워크에 모델 Key·모델 직접 호출 없음
