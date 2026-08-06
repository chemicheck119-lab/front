# 팀·인프라 결정 목록

FE가 인증 체계, 운영 API 주소, 지도 사업자, 조직 식별자와 보존 정책을 임의로 확정하지 않도록 팀 결정과 임시 개발값을 분리합니다.

## 미확정 결정

| 항목 | 필요한 결정 | FE 임시 처리 |
|---|---|---|
| staging·운영 FE origin 분리 | `chemicheck119.site` 이후 별도 운영 환경을 둘지 결정 | 현재 공개 develop origin은 `https://chemicheck119.site`로 고정 |
| 공모전 이후 로그인 방식 | SSO, 인증 Gateway, 별도 로그인 API 중 권위 흐름 | 현재 staging은 제한 파일럿 서명 세션 사용 |
| 공모전 이후 세션 정책 | 새로고침·장시간 방치·만료 때의 보존·민감정보 제거 정책 | `POST /api/c2guard/v1/logout`은 구현됨; 현재 `사용 종료`는 로컬 대응 상태 초기화 |
| 소방서 식별자 | 운영 기관 연계 시 권위 ID 매핑 | staging은 공개 소방서 목록의 안정적인 `stationId` 사용 |
| 경로 사업자 | 운영 SLA·요금·쿼터 정책 | staging은 NAVER Directions 5 서버 Secret 연동 완료 |
| 기록 보존기간 | 사고 기록의 보존·삭제·접근 감사 정책 | FE 로컬 상태를 영구 기록으로 간주하지 않음 |
| movement 활성화 | 운영 쿼터·재탐색 정책 확정 | staging `VITE_ENABLE_MOVEMENT_API=true`; 실도로 smoke 완료 |
| record 활성화 | 운영 보존·파기 정책 확정 | staging `VITE_ENABLE_RECORD_API=true`; PostgreSQL 사용 |

## 확정된 FE 경계

- 공개 develop FE origin은 `https://chemicheck119.site`입니다. BE staging credential CORS allowlist에 이 exact origin만 등록했으며 허용 preflight `200`, 미인증 `401`, 외부 origin `403`을 확인했습니다.
- 운영 배경지도는 국내 도로·건물·한글 지명이 표시되는 네이버 Web Dynamic Map을 우선 사용합니다. 도메인 제한 Client ID만 FE에 주입하고 Client Secret은 BE Secret Manager 경계에 둡니다. MapTiler Streets Raster XYZ는 fallback으로 유지합니다.
- 모든 서비스 요청은 `VITE_BFF_BASE_URL`을 사용합니다. 현재 공모전 staging은 `VITE_ENABLE_AUTH=true`로 제한 파일럿 HttpOnly 세션을 사용합니다.
- FE는 모델 API와 길찾기 Provider를 직접 호출하거나 API Key를 보관하지 않습니다.
- 세션·로그아웃·사고 분석·물질 검색·현장 확인·movement·record는 고정 OpenAPI 계약을 사용하며 BE 배포 기준은 `develop@feda53d`입니다.
- 확인 성공 응답의 `reanalyzeRequired=true`이면 동일한 `incidentId`로 사고 분석을 다시 호출합니다.
- movement와 record는 staging 검증을 통과해 기능 플래그가 활성화됐습니다.
- 시연 fixture는 `VITE_ENABLE_DEMO_MODE=true`인 명시적 데모 환경에서만 사용합니다.
- 제한 파일럿 세션의 401은 세션 만료로 분류하며 기존 사고 화면을 즉시 지우지 않고 재진입을 안내합니다.
- BFF OpenAPI는 승인된 BE 전체 commit SHA에 고정하고 `pnpm contract:check`로 생성 타입과 보안 경계를 검증합니다.

## 활성화 체크

movement 또는 record 기능 플래그를 켜기 전에 다음을 확인합니다.

- [x] 대상 환경의 BE 커밋과 배포 URL이 기록돼 있다.
- [x] 실제 인증 쿠키가 포함된 staging 요청이 성공한다.
- [x] 실패·timeout·409에서 기존 사고 화면이 유지된다.
- [x] movement는 GeoJSON endpoint와 attribution을 검증한다.
- [x] record는 영구 저장 성공에서만 `resetAllowed=true`를 반환한다.
- [x] 브라우저 네트워크에 모델·지도 Provider API Key가 없다.
