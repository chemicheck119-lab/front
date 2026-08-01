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
| 데이터 모드 | `DEMO_SIMULATION` |

Docker 이미지는 기본적으로 `demo` 모드를 빌드합니다. 따라서 실제 BFF 장애를 fixture로 바꾸지 않으며 모든 화면에 `시연 데이터` 경계가 유지됩니다.

`develop`의 공개 진입점은 같은 GCP 프로젝트의 Firebase Hosting에 정적 demo 번들을 배포하고 `chemicheck119.site`를 연결합니다. 서울 리전 `asia-northeast3`은 Cloud Run 직접 도메인 매핑 지원 리전이 아니므로 기존 Cloud Run 서비스는 예비 주소로 유지합니다. Firebase Hosting은 SPA fallback과 Google 관리형 HTTPS 인증서를 담당합니다.

```bash
corepack pnpm build:demo
npx firebase-tools deploy --only hosting --project chemi-check
```

## 전달받은 BE staging 설정

2026-08-01 기준으로 다음 공개 설정을 `.env.staging`에 반영했습니다.

| 환경변수 | 값 |
|---|---|
| `VITE_BFF_BASE_URL` | `https://chemicheck119-be-staging-w6s6lwanpa-du.a.run.app` |
| `VITE_ENABLE_DEMO_MODE` | `false` |
| `VITE_ENABLE_MOVEMENT_API` | `false` |
| `VITE_ENABLE_RECORD_API` | `false` |

`pnpm build:staging` 또는 Docker build argument `VITE_BUILD_MODE=staging`으로 Live API 번들을 만들 수 있습니다. `VITE_*` 값은 정적 브라우저 번들에 포함되므로 API Key나 세션 비밀값은 넣지 않습니다.

실측 결과 인증 쿠키가 없는 BFF 요청은 `401 AUTH_REQUIRED`를 반환해 인증 경계가 정상 작동합니다. 반면 공개 FE origin의 CORS preflight는 BE allowlist에 등록되기 전까지 허용할 수 없습니다. 그러므로 Firebase Hosting과 기존 Cloud Run 서비스는 아직 staging 빌드로 교체하지 않고 demo 빌드를 유지합니다.

## Live 전환 조건

다음 조건이 모두 충족되기 전에는 이 서비스를 운영 Live 빌드로 바꾸지 않습니다.

- 실제 로그인·세션 컨텍스트 API 확정
- `https://chemicheck119.site`를 BE `CHEMICHECK119_CORS_ALLOWED_ORIGINS`에 exact origin으로 등록
- credential CORS와 Secure·SameSite 쿠키 검증
- `VITE_AUTH_LOGIN_URL`의 staging 값 확정
- 사고 분석·물질 검색·현장 확인 Live E2E 증적

movement·record는 BE 배포 확인과 기능 플래그 승인 전까지 `준비 중` 상태를 유지합니다.
