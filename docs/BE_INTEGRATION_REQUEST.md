# 케미체크119 FE → BE/BFF 연동 요청서

기준 계약: `chemicheck119-dashboard-bff-v1`

BE 권위 기준: `develop@d1a7391`

AI 계약 기준: `chemicheck119/llm` PR #31, `main` 병합 완료

AI staging upstream:

```text
MODEL_API_BASE_URL=https://chemicheck119-model-api-staging-w6s6lwanpa-du.a.run.app
POST /api/v1/incidents/analyze
X-API-Key: BE Secret에서만 주입
모델 timeout: 15초
```

모델 API Key는 `VITE_*` 환경변수나 FE 요청에 포함하지 않습니다. 호출 구조는 항상 `FE → BE/BFF → AI`이며, BE는 모델의 camelCase 응답을 `chemicheck119-dashboard-bff-v1` 화면 계약으로 투영합니다.

현재 Live 연결 대상은 사고 분석, 물질 검색, 현장 확인입니다. 이동갱신과 기록저장은 BE 미구현이며 해당 경로의 실패를 FE 결함으로 분류하지 않습니다. AI 계약·client·자동화 테스트는 완료됐지만 실제 배포 AI 서버와 API Key를 사용한 Live E2E 증적은 없습니다.

## 현재 연동 행렬

| 영역 | 상태 | FE 처리 |
|---|---|---|
| CORS | 연동 완료 | `https://chemicheck119.site` exact origin 허용; preflight 200·미인증 401·외부 origin 403 실측 |
| 현재 공모전 인증 | FE 비활성화·BE 변경 필요 | FE는 로그인·세션·로그아웃 UI 없이 `credentials: omit`; BE는 무인증 서비스 요청을 허용하도록 인증 필터를 비활성화해 재배포 필요 |
| 사고 분석 | 연동 가능 | `VITE_BFF_BASE_URL` 기준 호출 |
| 물질 검색 | 연동 가능 | `VITE_BFF_BASE_URL` 기준 호출 |
| 현장 확인 | 연동 가능 | 성공 후 `reanalyzeRequired=true`이면 같은 `incidentId`로 사고 분석 재호출 |
| movement | BE 미구현 | `준비 중` 표시; `VITE_ENABLE_MOVEMENT_API=true` 전에는 Live 요청 차단 |
| record | BE 미구현 | 내역 조회 유지·저장은 `준비 중`; `VITE_ENABLE_RECORD_API=true` 전에는 Live 요청 차단 |
| AI Live E2E | 증적 없음 | 실제 배포 AI URL·API Key가 준비된 환경에서 별도 검증 필요 |

## 공모전 시연 전 필수 통합 시나리오

| 단계 | 입력/확인 상태 | 반드시 관찰할 결과 |
|---|---|---|
| 신고문만 입력 | `염산 저장탱크에서 누출` | 물질 후보와 `현장 확인 필요` 표시, 충돌 규칙 `executed=false`, 위험등급 비공개 |
| 사고물질 CAS만 확인 | 사고물질 CAS 확인, 시설물질 미확인 | `시설물질 확인 대기`, 충돌 규칙 미실행, 기존 사고 화면 유지 |
| 두 CAS 모두 확인 | 사고물질 CAS + 시설물질 CAS | CAMEO 결정 규칙 실행, 서수 위험등급·구체적 위험·대응 근거 표시, 최종 판단 `현장 지휘관` |

세 요청은 같은 `incidentId`를 유지하고 각 응답의 `requestId`, `analysisId`, `confirmationId`를 기록합니다. 후보 물질명이나 과거 업체 취급 이력만으로 충돌 검토를 실행한 응답은 실패로 판정합니다.

## 공통 원칙

- FE는 서비스 BE/BFF만 호출합니다.
- 모델 API의 `X-API-Key`와 길찾기 Provider Key는 BE Secret으로만 보관합니다.
- 현재 공모전 staging은 인증을 사용하지 않으며 FE는 인증 쿠키를 전송하지 않습니다. 이 임시 정책은 운영 인증 체계가 아닙니다.
- BE는 정확한 FE origin만 CORS로 허용하고, 인증 미사용 배포에서도 사고·확인 입력을 서버 계약으로 검증합니다.
- 모든 응답은 `requestId`를 포함해 FE→BE→AI 로그를 연결합니다.
- 과거 업체 취급 이력을 현재 재고로 바꾸어 표현하지 않습니다.
- 사고물질·시설물질 CAS 두 개가 확인되기 전 CAMEO 규칙을 실행하지 않습니다.
- BE 모델 응답 제한은 15초이며 FE 요청 제한은 20초로 두어 구조화된 `MODEL_TIMEOUT` 응답을 우선 수신합니다.
- FE는 `develop@d1a7391d`의 OpenAPI 원본과 생성 타입을 고정하고 CI에서 경로·세션 보안·필수 필드 드리프트를 검사합니다.

## 0. 운영 로그인 후 세션 컨텍스트 (공모전 이후 보류)

현재 공모전 staging에서는 로그인·세션·로그아웃 UI를 사용하지 않으므로 아래 계약은 연결하지 않습니다. 운영 인증을 다시 도입할 때 사용하는 후속 설계입니다.

권장 신규 경로: `GET /api/c2guard/v1/session`

필요한 이유: `CHEMICHECK119_SESSION`은 HttpOnly이므로 FE가 사용자 소속과 역할을 직접 읽을 수 없습니다. 지역·소방서 선택값을 권한 정보로 사용하지 않고, BE가 검증한 principal을 화면과 사고분석의 조직 컨텍스트로 사용해야 합니다.

요청 body: 없음. 브라우저는 `credentials: include`로 서명된 세션 쿠키를 전달합니다.

권장 응답:

```json
{
  "schemaVersion": "chemicheck119-dashboard-bff-v1",
  "requestId": "REQ-SESSION-0001",
  "authenticated": true,
  "user": {
    "userId": "USER-001",
    "displayName": "최현준",
    "role": "RESPONDER"
  },
  "organization": {
    "organizationId": "ORG-GG-SUWON",
    "organizationName": "경기 수원소방서",
    "stationName": "경기 수원소방서"
  },
  "dispatchContext": {
    "dispatchCenterName": "경기 수원소방서 상황실",
    "dispatchCenterPhone": "<운영 검증 연락처>",
    "phoneVerifiedAt": "2026-08-01T09:00:00+09:00"
  }
}
```

오류 처리:

- `401 AUTH_REQUIRED`: 로그인 어댑터로 다시 이동할 수 있는 인증 필요 상태
- `403 ACCESS_DENIED`: 유효한 사용자지만 서비스 또는 조직 접근권한 없음
- `503`: 세션 검증 또는 조직 컨텍스트가 준비되지 않아 대시보드 진입 차단

담당자 체크리스트:

- [ ] 배포 인증 어댑터가 HttpOnly·Secure 세션을 발급
- [ ] 응답 조직은 FE 입력이 아니라 검증된 JWT principal에서 결정
- [x] FE origin `https://chemicheck119.site`를 exact allowlist로 두고 credential CORS 허용
- [ ] 사용자 표시명·역할·소방서·상황실 연락처의 권위 출처와 최신성 제공
- [ ] 로그아웃 또는 만료 세션 처리 경로 확정
- [ ] 운영 인증 재도입 시에만 FE가 이 응답 성공 전 Live 대시보드 진입을 제한

## 1. 사고 분석

`POST /api/c2guard/v1/incidents/analyze`

상태: BE `develop@d1a7391` 기준 연동 가능. 실제 배포 AI 서버까지 이어지는 Live E2E 증적은 아직 없습니다.

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

- `401`: 세션 만료 또는 인증 필요 — 현재 사고 화면 유지·새 창 재인증
- `403`: 유효한 사용자지만 사고·조직 접근권한 없음
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

상태: BE 미구현. FE는 명시적인 `준비 중` 상태를 표시하고 `VITE_ENABLE_MOVEMENT_API=true`가 검증된 배포 환경에 설정되기 전까지 이 경로를 호출하지 않습니다.

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

상태: BE `develop@d1a7391` 기준 연동 가능. 실제 배포 AI 서버까지 이어지는 Live E2E 증적은 아직 없습니다.

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

상태: BE `develop@d1a7391` 기준 연동 가능. 현재 저장은 영구 DB 전까지 process-local입니다.

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

FE는 성공 응답의 `reanalyzeRequired=true`를 받으면 동일한 `incidentId`와 기존 신고문으로 사고 분석을 다시 호출합니다. 현재 구현은 BE 계약과 일치합니다.

오류 처리: 다른 사고·중복·권한 오류를 구조화하고, 실패 시 FE는 확인된 것으로 표시하지 않습니다.

담당자 체크리스트:

- [ ] 인증 사용자·사고·역할·CAS·근거·서버 시각 저장
- [ ] 사진/문서 진위를 모델이 보증한 것으로 기록하지 않음
- [ ] 확인 성공 후 재분석에서 저장 레코드 사용

## 5. 전체 대응 기록 저장

`POST /api/c2guard/v1/incidents/{incidentId}/record`

상태: BE 미구현. FE는 현재 사고 내역 조회는 유지하되 저장 버튼을 `준비 중`으로 표시하고, `VITE_ENABLE_RECORD_API=true`가 검증된 배포 환경에 설정되기 전까지 이 경로를 호출하지 않습니다.

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

## 연동 전 결정 필요

| 결정 항목 | 필요한 이유 |
|---|---|
| staging·운영 origin 분리 여부 | 공개 develop origin은 `https://chemicheck119.site`로 확정·CORS 등록 완료; 이후 환경 분리 시 별도 exact origin 필요 |
| 공모전 staging BE 인증 필터 | 로그인 없이 `POST /api/c2guard/v1/**` 요청이 통과하도록 현재 배포의 `401 AUTH_REQUIRED` 제거 |
| 공모전 이후 인증 방식 | SSO·인증 Gateway·별도 로그인 API와 세션 보존·로그아웃 정책 확정 |
| 안정적인 `stationId` | 표시명 변경과 무관한 조직 식별·권한·감사 로그 연결 |
| movement·record 배포 활성화 승인 | 현재 `준비 중` UX에서 각 환경의 기능 플래그를 켤 검증 기준 확정 |

## 추가 운영 컨텍스트: 상황실 연락처

좌측 `상황실 연결`을 조직별 실제 연락처로 제공하려면 인증된 로그인 세션 또는 동등한 BFF 응답에 다음 정보가 필요합니다. 현재 FE 환경변수는 로컬·staging 임시 설정이며 운영 권위 데이터가 아닙니다.

권장 응답 조각:

```json
{
  "dispatchContext": {
    "stationId": "STATION-GG-SUWON",
    "stationName": "경기 수원소방서",
    "dispatchCenterName": "경기 수원소방서 상황실",
    "dispatchCenterPhone": "031-000-0000",
    "phoneVerifiedAt": "2026-08-01T09:00:00+09:00"
  }
}
```

담당자 체크리스트:

- [ ] 인증 사용자의 소속 조직과 연락처를 서버에서 결정
- [ ] FE가 전달한 임의 전화번호를 권위 데이터로 저장하지 않음
- [ ] 연락처 미설정·변경·폐기 상태 구분
- [ ] 전화 연결 시도 기록이 필요하면 통화 내용 없이 사고 ID·사용자·시각만 감사 로그로 저장
