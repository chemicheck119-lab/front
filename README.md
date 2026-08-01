# 케미체크119 프론트엔드

119 화학재난 신고부터 출동 위치·도로 경로·현장 물질 확인·충돌 규칙·대응 기록 저장까지 한 화면에서 연결하는 태블릿 대시보드입니다.

> 통합 기준 브랜치는 `develop`입니다. 기능 브랜치는 `develop`에서 분기하고 PR도 `develop`만 대상으로 만듭니다. `main`에는 직접 커밋하거나 병합하지 않습니다.

## 현재 구현 상태

| 기능 | 상태 | 설명 |
|---|---|---|
| MapLibre 전국 지도 | UI·계약 연동 완료 | 사고/대원 마커와 BE GeoJSON LineString 표시 |
| 브라우저 위치 | 구현 완료 | `watchPosition`, 권한 거부·대기·오래됨·낮은 정확도 처리 |
| 이동 경로·ETA | FE 계약 연동 완료·BE 미구현 | Live 기본값은 `준비 중`; 기능 플래그 전에는 movement를 호출하거나 가짜 직선 경로를 만들지 않음 |
| 현장대응 에이전트 | BFF 계약 연동 완료 | 단계·목표·다음 행동·도구 실행 요약 표시 |
| 물질검색 | FE·BE 연동 가능 | 이름/CAS/관찰 특징 후보와 공식 근거 표시 |
| 확인 게이트 | FE·BE 구현 완료 | 두 CAS 확인 전 규칙 차단, `0/2→2/2` 현장 체크포인트와 역할·근거·확인 시각 기록 |
| 기록 저장 | FE 계약 연동 완료·BE 미구현 | 내역 조회는 유지하고 저장은 `준비 중`; 기능 플래그와 성공 응답 뒤에만 초기화 |
| 좌측 현장 도구 | UI·화면 상태 연동 완료 | 상황실 연결 확인, CAS 공식자료, 미저장 현재 기록 |
| 실제 BE/BFF | 3개 경로 연동 가능 | `develop@d1a7391` 기준 사고분석·물질검색·현장확인, movement·record 미구현 |
| BFF 계약 드리프트 | 자동 검증 | 고정 OpenAPI 해시·5개 경로·세션 보안·생성 타입을 `pnpm check`에서 검증 |
| 실제 길찾기 | 미연동 | movement 구현과 서버측 길찾기 Provider 설정 필요 |
| 시연 모드 | 구현 완료 | 모든 화면에 `시연 데이터` 배지를 고정 표시 |

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

## 환경변수와 보안

설정 목록은 [.env.example](./.env.example)을 참고합니다.

- `VITE_BFF_BASE_URL`: FE가 호출할 서비스 BE/BFF 주소
- `VITE_MAP_STYLE_URL`: 운영 지도 Style URL
- `VITE_MAP_DARK_STYLE_URL`: 선택적 다크 지도 Style URL
- `VITE_AUTH_LOGIN_URL`: 배포 환경의 신뢰된 운영 로그인 진입 URL
- `VITE_DISPATCH_CENTER_NAME`: 로그인 세션 연동 전 임시 상황실 표시명
- `VITE_DISPATCH_CENTER_PHONE`: 로그인 세션 연동 전 임시 상황실 전화번호
- `VITE_API_TIMEOUT_MS`: BFF 요청 제한 시간. BE의 모델 제한 15초보다 긴 20초 권장
- `VITE_LOCATION_UPDATE_INTERVAL_MS`: 위치 갱신 최소 간격
- `VITE_ENABLE_DEMO_MODE`: 명시적 시연 fixture 사용 여부
- `VITE_ENABLE_MOVEMENT_API`: BE movement 배포가 검증된 환경에서만 `true`
- `VITE_ENABLE_RECORD_API`: BE record 배포가 검증된 환경에서만 `true`

`VITE_*` 값은 브라우저 번들에 그대로 노출됩니다. 모델 API Key, 길찾기 API Key, 영구 토큰 등 비밀정보를 절대 넣지 않습니다. 브라우저는 모델 API를 직접 호출하지 않으며 모든 운영 요청은 BE/BFF를 거칩니다.

BFF 요청은 인증 세션 쿠키를 전달하기 위해 `credentials: include`를 기본 적용합니다. 다른 origin을 사용하는 운영·staging에서는 BE가 정확한 FE origin과 credential 허용 CORS 정책을 함께 설정해야 합니다.

401 응답은 403 권한 거부와 분리합니다. 세션 만료 시 현재 사고·후보·현장 확인 상태를 메모리에 유지하고, 안전한 운영 인증 URL이 있으면 새 창 재로그인을 제공합니다. 로그인 성공 후 사용자가 실패한 작업을 다시 실행해 BFF 요청이 성공하면 만료 안내를 해제합니다. 새로고침 이후의 보존·폐기 정책은 아직 팀 결정 전이므로 브라우저 영구 저장소에는 사고 상태를 기록하지 않습니다.

시연 모드에서만 지역·소방서를 로컬로 선택해 접속합니다. Live 모드의 소속과 권한은 사용자 입력값으로 만들지 않으며, 안전한 `VITE_AUTH_LOGIN_URL`이 설정된 경우에만 운영 로그인 링크를 표시합니다. 로그인 후 대시보드 진입에는 BE가 HttpOnly 세션의 사용자·소방서 정보를 돌려주는 세션 컨텍스트 API가 추가로 필요합니다.

상황실 전화번호는 비밀키가 아니지만 운영 조직별로 달라질 수 있으므로, 실제 서비스에서는 환경변수보다 인증된 로그인 세션/BFF 응답으로 제공하는 방식을 권장합니다. 좌측 도구의 자세한 동작은 [현장 도구 설계](./docs/FIELD_TOOLS.md)를 참고하세요.

운영 타일은 OpenStreetMap 공개 표준 타일 서버를 그대로 사용하지 않습니다. 트래픽·저작자 표시·SLA를 감당하는 사업자 또는 자체 호스팅 Style URL을 설정하세요. 지도 구현은 [MapLibre GL JS 공식 문서](https://maplibre.org/maplibre-gl-js/docs/), 운영 타일 정책은 [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)를 따릅니다.

## BFF 경로

권위 기준은 BE `develop@d1a7391`입니다. 모든 요청은 `VITE_BFF_BASE_URL`과 인증 쿠키를 사용합니다.

동일 커밋의 OpenAPI 원본과 생성 타입을 저장소에 고정했습니다. 갱신 절차는 [BFF 계약 동기화](./contracts/README.md), 출처 메타데이터는 [dashboard-bff-v1.source.json](./contracts/dashboard-bff-v1.source.json)을 참고합니다.

| 경로 | 현재 상태 |
|---|---|
| `POST /api/c2guard/v1/incidents/analyze` | 연동 가능 |
| `POST /api/c2guard/v1/substances/discover` | 연동 가능 |
| `POST /api/c2guard/v1/incidents/{incidentId}/confirmations` | 연동 가능; 성공 후 `reanalyzeRequired=true`이면 같은 `incidentId`로 재분석 |
| `POST /api/c2guard/v1/incidents/{incidentId}/movement` | BE 미구현 |
| `POST /api/c2guard/v1/incidents/{incidentId}/record` | BE 미구현 |

현재 FE는 확인 성공 후 동일 사고를 재분석하며 BE 계약과 일치합니다. movement·record는 명시적 기능 플래그가 없으면 Live 요청을 보내지 않고 `준비 중`으로 표시하므로, 미구현 응답을 FE 결함으로 오인하지 않습니다.

상세 계약과 BE 담당 체크리스트는 [BE 연동 요청서](./docs/BE_INTEGRATION_REQUEST.md)를 참고합니다.

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
- 401 세션 만료와 403 접근 거부 분리, 진행 사고 보존 안내
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
`develop` 대상 PR과 `develop` push에서는 GitHub Actions가 같은 `pnpm check`를 실행하며 Sites 시연 배포 번들까지 검증합니다.

### Develop 시연 배포

`develop` 검증본은 OpenAI Sites의 비공개 시연 배포로 게시합니다. 실제 BFF·로그인 주소가 확정되기 전에는 `build:sites:demo`로 명확한 시연 데이터 번들을 만들며, 운영 연결 실패를 fixture로 자동 대체하지 않습니다.

```bash
corepack pnpm build:sites:demo
```

배포 패키지는 정적 SPA fallback과 보안 응답 헤더를 제공하는 Worker를 포함합니다. Sites 프로젝트 식별자만 `.openai/hosting.json`에 보관하고 비밀값은 저장소에 기록하지 않습니다.

팀 통합 배포는 BE staging과 같은 GCP 프로젝트 `chemi-check`, 서울 리전의 Cloud Run 서비스 `chemicheck119-fe-develop`을 사용합니다. 현재는 인증·CORS 경계가 확정되지 않아 명확한 Demo 빌드만 배포하며, Live 전환 조건은 [GCP develop 배포](./docs/GCP_DEPLOYMENT.md)에 기록합니다.

## 데이터 의미와 안전 경계

- 전국 시설 데이터는 17개 시·도, 28,647개 사업장의 **과거 공개 취급 후보**이며 현재 재고가 아닙니다.
- 색·냄새·상태 기반 후보는 자동 물질 확정값이 아닙니다.
- 위험등급은 확률이 아니라 CAMEO 결정 규칙의 서수 등급을 원본 그대로 표시합니다.
- 검증된 확산 모델이 없으므로 임의의 위험 반경을 그리지 않습니다.
- 에이전트는 업무 절차를 조율하며 자율 위험 결정을 하지 않습니다.
- 최종 판단 주체는 현장 지휘관입니다.

## 알려진 한계

- AI 계약·BE client·자동화 테스트는 완료됐지만 실제 배포 AI 서버와 API Key를 사용한 Live E2E 증적은 없습니다.
- 사용자 세션 검증과 현장확인 BFF는 구현됐지만 실제 로그인 방식·세션 발급 어댑터·세션 컨텍스트 API는 확정 전입니다.
- 이동갱신·기록저장 BFF와 실제 길찾기 Provider·영구 DB는 아직 운영 연동 전입니다.
- 저장소의 기존 로고 이미지에는 `케미가드` 표기가 남아 있습니다. 서비스 표시명 확정 후 별도 디자인 자산 교체가 필요합니다.

## 배포 전 결정 필요

- 개발·staging·운영 FE의 exact origin
- 실제 로그인 방식: SSO, 인증 Gateway, 별도 로그인 API
- 새로고침·장시간 방치·명시적 로그아웃 시 사고 화면 보존·민감정보 제거 정책
- 표시명과 분리된 안정적인 `stationId`
- movement·record는 현재 `준비 중`으로 표시하며, BE 배포 확인 후 환경별 기능 플래그 활성화

팀·인프라 결정과 임시 개발값은 [팀·인프라 결정 목록](./docs/TEAM_INFRA_DECISIONS.md)에서 관리합니다.
