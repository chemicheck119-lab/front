# GCP develop 배포

FE develop 시연 배포는 BE staging과 같은 GCP 프로젝트·서울 리전에 둡니다.

| 항목 | 값 |
|---|---|
| GCP 프로젝트 | `chemi-check` |
| 리전 | `asia-northeast3` |
| Cloud Run 서비스 | `chemicheck119-fe-develop` |
| Artifact Registry | `asia-northeast3-docker.pkg.dev/chemi-check/chemicheck119` |
| 공개 FE origin | `https://chemicheck119.site` |
| 공개 호스팅 | Firebase Hosting 기본 사이트 `chemi-check` |
| Cloud Run 예비 주소 | `https://chemicheck119-fe-develop-w6s6lwanpa-du.a.run.app` |
| 데이터 모드 | `LIVE_API` (인증 미사용 staging) |

공개 Firebase 배포는 `staging` 모드를 빌드합니다. 실제 BFF 장애를 fixture로 바꾸지 않으며 로그인 화면 없이 현장 화면으로 진입합니다.

`develop`의 공개 진입점은 같은 GCP 프로젝트의 Firebase Hosting에 정적 staging 번들을 배포하고 `chemicheck119.site`를 연결합니다. 서울 리전 `asia-northeast3`은 Cloud Run 직접 도메인 매핑 지원 리전이 아니므로 기존 Cloud Run 서비스는 예비 주소로 유지합니다. Firebase Hosting은 SPA fallback과 Google 관리형 HTTPS 인증서를 담당합니다.

```bash
corepack pnpm build:staging
npx firebase-tools deploy --only hosting --project chemi-check
```

## 전달받은 BE staging 설정

2026-08-01 기준으로 다음 공개 설정을 `.env.staging`에 반영했습니다.

| 환경변수 | 값 |
|---|---|
| `VITE_BFF_BASE_URL` | `https://chemicheck119-be-staging-w6s6lwanpa-du.a.run.app` |
| `VITE_ENABLE_DEMO_MODE` | `false` |
| `VITE_ENABLE_AUTH` | `false` |
| `VITE_DEFAULT_STATION_NAME` | `현장대응본부` |
| `VITE_ENABLE_MOVEMENT_API` | `false` |
| `VITE_ENABLE_RECORD_API` | `false` |
| `VITE_MAP_STYLE_URL` | `https://api.maptiler.com/maps/dataviz-light/style.json` |
| `VITE_MAP_DARK_STYLE_URL` | `https://api.maptiler.com/maps/dataviz-dark/style.json` |
| `VITE_MAP_PUBLIC_TOKEN` | 도메인 제한 공개 키; 저장소 밖의 빌드 환경에서만 주입 |

`pnpm build:staging` 또는 Docker build argument `VITE_BUILD_MODE=staging`으로 Live API 번들을 만들 수 있습니다. `VITE_*` 값은 정적 브라우저 번들에 포함되므로 API Key나 세션 비밀값은 넣지 않습니다.

2026-08-01에 BE staging의 `CHEMICHECK119_CORS_ALLOWED_ORIGINS`에 `https://chemicheck119.site`를 등록했습니다. 실측 결과 preflight는 `200`과 정확한 `Access-Control-Allow-Origin`을 반환합니다. 다만 인증 쿠키가 없는 POST는 CORS 헤더가 포함된 `401 AUTH_REQUIRED`를 반환하므로, FE 직접 연동을 완료하려면 BE 인증 필터 비활성화 배포가 필요합니다.

FE는 로그인·세션 없이 직접 진입하고 인증 정보를 보내지 않는 staging 번들로 전환합니다. `사용 종료`는 현재 로컬 대응 상태를 초기화하며, 인증 모드에서만 BE `POST /api/c2guard/v1/logout`을 세션 쿠키와 함께 호출합니다. BFF가 무인증 요청을 허용하기 전까지 화면은 유지하면서 BE 배포 상태 오류를 표시합니다.

## 공모전 Live 연동 완료 조건

FE staging 배포 이후 실제 분석 시연에는 다음 조건이 남습니다.

- [완료] `https://chemicheck119.site`를 BE `CHEMICHECK119_CORS_ALLOWED_ORIGINS`에 exact origin으로 등록
- BE 인증 필터를 비활성화해 무인증 BFF 요청 허용
- 사고 분석·물질 검색·현장 확인 Live E2E 증적

movement·record는 BE 배포 확인과 기능 플래그 승인 전까지 `준비 중` 상태를 유지합니다.
