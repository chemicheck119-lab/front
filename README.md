# 케미체크119 프론트엔드

119 화학재난 신고부터 출동 위치·도로 경로·현장 물질 확인·충돌 규칙·대응 기록 저장까지 한 화면에서 연결하는 태블릿 대시보드입니다.

> 통합 기준 브랜치는 `develop`입니다. 기능 브랜치는 `develop`에서 분기하고 PR도 `develop`만 대상으로 만듭니다. `main`에는 직접 커밋하거나 병합하지 않습니다.

## 현재 구현 상태

| 기능 | 상태 | 설명 |
|---|---|---|
| MapLibre 전국 지도 | 운영 배경지도 연동 완료 | MapTiler Streets Light/Dark, 사고/대원 마커와 BE GeoJSON LineString 표시 |
| 브라우저 위치 | 구현 완료 | `watchPosition`, 권한 거부·대기·오래됨·낮은 정확도 처리 |
| 이동 경로·ETA | FE·BE 구현 완료·활성화 대기 | Live 기본값은 `준비 중`; staging GPS·도로 경로 검증 후 기능 플래그 활성화 |
| 현장대응 에이전트 | BFF 계약 연동 완료 | 단계·목표·다음 행동·도구 실행 요약 표시 |
| 물질검색 | FE·BE 연동 가능 | 이름/CAS/관찰 특징 후보와 공식 근거 표시 |
| 확인 게이트 | FE·BE 구현 완료 | 두 CAS 확인 전 규칙 차단, `0/2→2/2` 현장 체크포인트와 역할·근거·확인 시각 기록 |
| 기록 저장 | FE·BE 구현 완료·활성화 대기 | 저장은 staging 영속성 검증 전까지 `준비 중`; 성공 응답 뒤에만 초기화 |
| 좌측 현장 도구 | UI·화면 상태 연동 완료 | 상황실 연결 확인, CAS 공식자료, 미저장 현재 기록 |
| 실제 BE/BFF | 7개 operation 계약 동기화 | `develop@9685a8c2` 기준 세션·로그아웃·분석·검색·확인·movement·record |
| BFF 계약 드리프트 | 자동 검증 | 고정 OpenAPI 해시·7개 operation·세션 보안·생성 타입을 `pnpm check`에서 검증 |
| 실제 길찾기 | 미연동 | movement 구현과 서버측 길찾기 Provider 설정 필요 |
| 시연 모드 | 구현 완료 | 모든 화면에 `시연 데이터` 배지를 고정 표시 |
| 공모전 Live 시나리오 | 실제 BFF·AI 사용 | 공개 합성 신고임을 표시하고 실제 staging 분석 경로로 전송 |

## 실행

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev
```

로컬 기본 주소는 `http://localhost:5173`입니다.

### 시연 모드

공개 MapLibre 데모 스타일과 fixture를 사용하는 시연 화면은 별도 설정 복사 없이 실행할 수 있습니다.

```bash
corepack pnpm dev:demo
```

`.env.demo`는 공개 시연 전용이며 운영 배포에 사용하지 않습니다. 운영과 동일한 로컬 설정이 필요하면 `.env.local`에서 아래 값을 명시적으로 설정합니다.

```text
VITE_ENABLE_DEMO_MODE=true
```

시연 fixture는 `src/fixtures/demo.ts`에만 있으며 실제 API 장애 시 자동 fallback으로 사용되지 않습니다. 운영에서는 `false`로 두고, API 장애를 “연결할 수 없음” 상태로 표시합니다.

공모전의 주 시연에는 이 offline 시연 모드를 사용하지 않습니다. `https://chemicheck119.site`의
`공개 합성 지령 실시간 수신`으로 BE SSE에서 개인정보 없는 IncidentEnvelope를 받고 실제
BFF·AI 응답을 보여줍니다. 화면의
`실제 API`는 처리 경로를, `공개 합성 신고`는 입력 데이터 성격을 뜻합니다. 자세한 경계와 실제
119 지령 연계 계획은 [신고 입력·시연·실운영 전략](./docs/INCIDENT_INTAKE_STRATEGY.md)을 참고합니다.

### BE staging 연동 빌드

BE가 전달한 staging 설정은 `.env.staging`에 비밀값 없이 고정합니다.

```bash
corepack pnpm build:staging
```

현재 staging BFF는 `https://chemicheck119-be-staging-w6s6lwanpa-du.a.run.app`이며 movement·record는 비활성화합니다. 공모전 staging은 `VITE_ENABLE_AUTH=false`로 로그인·세션 없이 `현장대응본부` 화면에 바로 진입합니다. 상단 `사용 종료`는 사고·대화·분석·입력값을 로컬에서 초기화하며, 인증 모드에서는 BE `POST /api/c2guard/v1/logout`을 먼저 호출합니다. AI 분석을 포함한 모든 서비스 요청은 모델 서버가 아니라 이 BFF만 호출합니다. 공개 물질검색·사고분석은 인증 없이 Live E2E가 가능하며 confirmation·movement·record는 운영 인증 범위를 유지합니다.

## 환경변수와 보안

설정 목록은 [.env.example](./.env.example)을 참고합니다.

- `VITE_BFF_BASE_URL`: FE가 호출할 서비스 BE/BFF 주소
- `VITE_MAP_STYLE_URL`: 운영 지도 Style URL
- `VITE_MAP_DARK_STYLE_URL`: 선택적 다크 지도 Style URL
- `VITE_MAP_PUBLIC_TOKEN`: 도메인 제한된 브라우저용 공개 지도 키. Git에 저장하지 않고 빌드 환경에서만 주입
- `VITE_ENABLE_AUTH`: 로그인·세션 UI와 인증 쿠키 전송 사용 여부. 현재 공모전 staging은 `false`
- `VITE_DEFAULT_STATION_NAME`: 인증 미사용 Live 화면에 표시할 임시 현장 조직명
- `VITE_AUTH_LOGIN_URL`: 배포 환경의 신뢰된 운영 로그인 진입 URL
- `VITE_DISPATCH_CENTER_NAME`: 로그인 세션 연동 전 임시 상황실 표시명
- `VITE_DISPATCH_CENTER_PHONE`: 로그인 세션 연동 전 임시 상황실 전화번호
- `VITE_API_TIMEOUT_MS`: BFF 요청 제한 시간. BE의 모델 제한 15초보다 긴 20초 권장
- `VITE_LOCATION_UPDATE_INTERVAL_MS`: 위치 갱신 최소 간격
- `VITE_ENABLE_DEMO_MODE`: 명시적 시연 fixture 사용 여부
- `VITE_ENABLE_PRESENTATION_SCENARIO`: BE의 공개 합성 지령 SSE 수신 UI. `VITE_ENABLE_DEMO_MODE=false`이고 BFF URL이 있을 때만 활성화
- `VITE_ENABLE_MOVEMENT_API`: BE movement 배포가 검증된 환경에서만 `true`
- `VITE_ENABLE_RECORD_API`: BE record 배포가 검증된 환경에서만 `true`

`VITE_*` 값은 브라우저 번들에 그대로 노출됩니다. 모델 API Key, 길찾기 API Key, 영구 토큰 등 비밀정보를 절대 넣지 않습니다. 브라우저는 모델 API를 직접 호출하지 않으며 모든 운영 요청은 BE/BFF를 거칩니다.

BFF 요청은 `VITE_ENABLE_AUTH=true`인 환경에서만 인증 세션 쿠키를 전달합니다. 현재 인증 미사용 staging은 `credentials: omit`으로 호출하며, 향후 인증을 도입할 때 정확한 FE origin과 credential 허용 CORS 정책을 함께 설정해야 합니다.

인증 미사용 환경에서 받은 401은 로그인 화면을 띄우지 않고 `BFF가 아직 인증 없는 직접 요청을 허용하지 않습니다`로 안내합니다. 향후 `VITE_ENABLE_AUTH=true`로 전환하면 401 세션 만료와 403 권한 거부를 분리하고 기존 재인증 UI를 다시 사용합니다.

시연 모드에서는 기존 지역·소방서 선택 화면을 유지합니다. 인증 미사용 Live staging은 `VITE_DEFAULT_STATION_NAME`으로 바로 진입하며 이 표시명을 권한·감사 식별자로 사용하지 않습니다. 인증 모드는 `GET /api/c2guard/v1/session` 성공 후 받은 `stationId`·역할·표시명으로만 진입하며 안전한 `VITE_AUTH_LOGIN_URL`이 함께 준비된 환경에서 활성화합니다.

상황실 전화번호는 비밀키가 아니지만 운영 조직별로 달라질 수 있으므로, 실제 서비스에서는 환경변수보다 인증된 로그인 세션/BFF 응답으로 제공하는 방식을 권장합니다. 좌측 도구의 자세한 동작은 [현장 도구 설계](./docs/FIELD_TOOLS.md)를 참고하세요.

운영 배경지도는 실제 도로·건물·지명이 보이는 MapTiler Streets Light/Dark Raster XYZ 타일을 MapLibre GL JS로 렌더링합니다. 사고·대원 위치와 출동 경로는 별도 벡터 오버레이로 유지합니다. 공개 키는 `chemicheck119.site`·Sites·로컬 개발 origin으로 제한하고 소스에 저장하지 않습니다. MapTiler와 OpenStreetMap의 공식 attribution을 MapLibre 컨트롤에 표시하며, 공개 OSM 표준 타일 서버를 운영 트래픽에 직접 사용하지 않습니다.

## BFF 경로

권위 기준은 BE `develop@9685a8c2`입니다. 모든 요청은 `VITE_BFF_BASE_URL`을 사용하며 인증 쿠키는 인증 기능이 활성화된 환경에서만 포함합니다.

동일 커밋의 OpenAPI 원본과 생성 타입을 저장소에 고정했습니다. 갱신 절차는 [BFF 계약 동기화](./contracts/README.md), 출처 메타데이터는 [dashboard-bff-v1.source.json](./contracts/dashboard-bff-v1.source.json)을 참고합니다.

| 경로 | 현재 상태 |
|---|---|
| `GET /api/c2guard/v1/session` | 인증 모드 진입 게이트와 사용자·소방서 컨텍스트 연동 완료 |
| `POST /api/c2guard/v1/logout` | 인증 모드 사용 종료 연동 완료 |
| `POST /api/c2guard/v1/incidents/analyze` | 연동 가능 |
| `POST /api/c2guard/v1/substances/discover` | 연동 가능 |
| `POST /api/c2guard/v1/incidents/{incidentId}/confirmations` | 연동 가능; 성공 후 `reanalyzeRequired=true`이면 같은 `incidentId`로 재분석 |
| `POST /api/c2guard/v1/incidents/{incidentId}/movement` | FE·BE 구현 완료; staging 활성화 검증 대기 |
| `POST /api/c2guard/v1/incidents/{incidentId}/record` | FE·BE 구현 완료; staging 영속성 검증 대기 |

현재 FE는 확인 성공 후 동일 사고를 재분석하며 BE 계약과 일치합니다. movement·record는 명시적 기능 플래그가 없으면 Live 요청을 보내지 않고 `준비 중`으로 표시하며, staging E2E가 통과된 환경에서만 활성화합니다.

상세 계약과 BE 담당 체크리스트는 [BE 연동 요청서](./docs/BE_INTEGRATION_REQUEST.md)를 참고합니다.

공모전 직전의 실제 3개 통합 시나리오, 3분 시연 대본, 10분 발표 수치와 인터넷 장애 대비 절차는 [공모전 통합·시연·발표 런북](./docs/CONTEST_DEMO_RUNBOOK.md)을 따릅니다.

## 검증

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm contract:check
# 또는 한 번에
corepack pnpm check
```

테스트 범위:

- API 응답과 안전 상태 매핑
- 고정 OpenAPI 원본과 생성 타입·보안 경계의 드리프트 검사
- 인증 미사용 직접 진입과 401 BE 배포 상태 안내
- 응답 최상위·확인 gate·규칙 실행을 함께 보는 위험 공개 조건
- 문장별 RAG 근거와 citation 연결
- 물질검색 후보의 비자동 현장 확인 연결
- 시연 접속과 Live 운영 인증 진입 분리
- 에이전트 phase 표시
- GPS 최신성·권한 거부·낮은 정확도
- GeoJSON 경로 표시 조건
- 두 CAS 현장 확인 게이트
- 기록 저장 성공 후 초기화 조건
- 시연 데이터와 실제 API 구분

브라우저 검증 결과와 스크린샷은 [검증 기록](./docs/VALIDATION.md)에 있습니다.
`develop` 대상 PR과 `develop` push에서는 GitHub Actions가 같은 `pnpm check`를 실행하며 BE staging 연동 번들과 Sites 시연 배포 번들까지 검증합니다.

### Develop staging 배포

`develop` 검증본은 OpenAI Sites의 비공개 배포와 Firebase Hosting 공개 배포로 게시합니다. 현재 공모전 staging 번들은 로그인 없이 BFF에 직접 연결하고, 운영 연결 실패를 fixture로 자동 대체하지 않습니다.

```bash
corepack pnpm build:sites:staging
```

배포 패키지는 정적 SPA fallback과 보안 응답 헤더를 제공하는 Worker를 포함합니다. Sites 프로젝트 식별자만 `.openai/hosting.json`에 보관하고 비밀값은 저장소에 기록하지 않습니다.

팀 통합 배포는 BE staging과 같은 GCP 프로젝트 `chemi-check`를 사용합니다. 공개 develop origin은 Firebase Hosting에 연결한 `https://chemicheck119.site`이며, 서울 리전의 Cloud Run 서비스 `chemicheck119-fe-develop`은 예비 주소로 유지합니다. 현재 두 배포는 인증 미사용 staging 번들을 사용하며, 공개 물질검색·사고분석은 BFF·AI Live 경로를 호출합니다.

## 데이터 의미와 안전 경계

- 전국 시설 데이터는 17개 시·도, 28,647개 사업장의 **과거 공개 취급 후보**이며 현재 재고가 아닙니다.
- 색·냄새·상태 기반 후보는 자동 물질 확정값이 아닙니다.
- 위험등급은 확률이 아니라 CAMEO 결정 규칙의 서수 등급을 원본 그대로 표시합니다.
- 검증된 확산 모델이 없으므로 임의의 위험 반경을 그리지 않습니다.
- 에이전트는 업무 절차를 조율하며 자율 위험 결정을 하지 않습니다.
- 최종 판단 주체는 현장 지휘관입니다.

## 알려진 한계

- 실제 배포 AI 서버와 API Key를 사용한 공개 물질검색·사고분석 Live E2E는 검증됐지만, 기관 사용자·지령 시스템 연계는 아직 없습니다.
- 현재 공모전 staging은 공개 물질검색·사고분석만 인증 없이 허용하며 confirmation·movement·record는 보호됩니다.
- Cloud SQL 영속화는 배포됐지만 보호된 confirmation·movement·record 전체 E2E와 실제 길찾기 Provider는 아직 운영 연동 전입니다.
- 저장소의 기존 로고 이미지에는 `케미가드` 표기가 남아 있습니다. 서비스 표시명 확정 후 별도 디자인 자산 교체가 필요합니다.

## 배포 전 결정 필요

- staging·운영 환경을 공개 develop origin `https://chemicheck119.site`와 분리할지 여부
- 실제 로그인 방식: SSO, 인증 Gateway, 별도 로그인 API
- 새로고침·장시간 방치·명시적 로그아웃 시 사고 화면 보존·민감정보 제거 정책
- 표시명과 분리된 안정적인 `stationId`
- movement·record는 현재 `준비 중`으로 표시하며, BE 배포 확인 후 환경별 기능 플래그 활성화

팀·인프라 결정과 임시 개발값은 [팀·인프라 결정 목록](./docs/TEAM_INFRA_DECISIONS.md)에서 관리합니다.
