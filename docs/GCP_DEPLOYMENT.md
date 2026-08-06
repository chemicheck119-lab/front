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
| 데이터 모드 | `LIVE_API` (서명된 전국 소방서 파일럿 세션) |

공개 Firebase 배포는 `staging` 모드를 빌드합니다. 실제 BFF 장애를 fixture로 바꾸지 않으며 제한 파일럿 소방서 선택 화면에서 서명 세션을 발급받은 뒤 현장 화면으로 진입합니다.

`develop`의 공개 진입점은 같은 GCP 프로젝트의 Firebase Hosting에 정적 staging 번들을 배포하고 `chemicheck119.site`를 연결합니다. 서울 리전 `asia-northeast3`은 Cloud Run 직접 도메인 매핑 지원 리전이 아니므로 기존 Cloud Run 서비스는 예비 주소로 유지합니다. Firebase Hosting은 SPA fallback과 Google 관리형 HTTPS 인증서를 담당합니다.

```bash
corepack pnpm build:staging
npx firebase-tools deploy --only hosting --project chemi-check
```

## 전달받은 BE staging 설정

2026-08-06 기준으로 다음 공개 설정을 `.env.staging`에 반영했습니다.

| 환경변수 | 값 |
|---|---|
| `VITE_BFF_BASE_URL` | `https://chemicheck119.site` (Hosting의 BFF rewrite) |
| `VITE_ENABLE_DEMO_MODE` | `false` |
| `VITE_ENABLE_PRESENTATION_SCENARIO` | `true` |
| `VITE_ENABLE_AUTH` | `true` |
| `VITE_DEFAULT_STATION_NAME` | 빈 값; 파일럿 세션의 소방서 사용 |
| `VITE_ENABLE_MOVEMENT_API` | `true` |
| `VITE_ENABLE_RECORD_API` | `true` |
| `VITE_MAP_STYLE_URL` | `https://api.maptiler.com/maps/streets-v2/style.json` |
| `VITE_MAP_DARK_STYLE_URL` | `https://api.maptiler.com/maps/streets-v2-dark/style.json` |
| `VITE_MAP_PUBLIC_TOKEN` | 도메인 제한 공개 키; 저장소 밖의 빌드 환경에서만 주입 |
| `VITE_NAVER_MAP_CLIENT_ID` | `cmft9zdyo1`; `chemicheck119.site` 등록 도메인으로 제한된 브라우저 공개 식별자 |

`pnpm build:staging` 또는 Docker build argument `VITE_BUILD_MODE=staging`으로 Live API 번들을 만들 수 있습니다. `VITE_*` 값은 정적 브라우저 번들에 포함되므로 API Key나 세션 비밀값은 넣지 않습니다.

2026-08-06 기준 공개 FE는 같은 origin의 제한 파일럿 진입에서 HttpOnly 서명 세션을 발급받고,
전국 215개 소방서 중 선택한 안정적인 `stationId`와 공개 좌표를 사용합니다. 분석·확인·movement·record는
이 세션으로 BFF에 요청하며 `사용 종료`는 BE 로그아웃 후 로컬 대응 상태를 정리합니다.

## 공모전 Live 연동 완료 조건

FE staging 배포 이후 실제 분석 시연에는 다음 조건이 남습니다.

- [완료] `https://chemicheck119.site`를 BE `CHEMICHECK119_CORS_ALLOWED_ORIGINS`에 exact origin으로 등록
- [완료] 제한 파일럿 세션으로 사고 분석·물질 검색·현장 확인 Live E2E
- [완료] NAVER Directions 5 실도로 GeoJSON·교통 ETA Live E2E

movement는 BE `develop@feda53d`와 Cloud Run revision `rfeda53d1`에서 검증해 활성화했습니다.
