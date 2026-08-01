# GCP develop 배포

FE develop 시연 배포는 BE staging과 같은 GCP 프로젝트·서울 리전에 둡니다.

| 항목 | 값 |
|---|---|
| GCP 프로젝트 | `chemi-check` |
| 리전 | `asia-northeast3` |
| Cloud Run 서비스 | `chemicheck119-fe-develop` |
| Artifact Registry | `asia-northeast3-docker.pkg.dev/chemi-check/chemicheck119` |
| 데이터 모드 | `DEMO_SIMULATION` |

Docker 이미지는 `pnpm build:demo` 결과만 포함합니다. 따라서 실제 BFF 장애를 fixture로 바꾸지 않으며 모든 화면에 `시연 데이터` 경계가 유지됩니다.

## Live 전환 조건

다음 조건이 모두 충족되기 전에는 이 서비스를 운영 Live 빌드로 바꾸지 않습니다.

- 실제 로그인·세션 컨텍스트 API 확정
- FE origin을 BE `CHEMICHECK119_CORS_ALLOWED_ORIGINS`에 exact origin으로 등록
- credential CORS와 Secure·SameSite 쿠키 검증
- `VITE_BFF_BASE_URL`·`VITE_AUTH_LOGIN_URL`의 staging 값 확정
- 사고 분석·물질 검색·현장 확인 Live E2E 증적

movement·record는 BE 배포 확인과 기능 플래그 승인 전까지 `준비 중` 상태를 유지합니다.
