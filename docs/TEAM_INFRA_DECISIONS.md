# 팀·인프라 결정 목록

FE가 인증 체계, 운영 API 주소, 지도 사업자, 조직 식별자와 보존 정책을 임의로 확정하지 않도록 팀 결정과 임시 개발값을 분리합니다.

## 미확정 결정

| 항목 | 필요한 결정 | FE 임시 처리 |
|---|---|---|
| staging·운영 FE origin 분리 | `chemicheck119.site` 이후 별도 운영 환경을 둘지 결정 | 현재 공개 develop origin은 `https://chemicheck119.site`로 고정 |
| 공모전 이후 로그인 방식 | SSO, 인증 Gateway, 별도 로그인 API 중 권위 흐름 | 현재 staging은 로그인·세션·로그아웃 UI를 사용하지 않음 |
| 공모전 이후 세션 정책 | 새로고침·장시간 방치·명시적 로그아웃 때의 보존·민감정보 제거 정책 | 인증 기능을 다시 켤 때 확정 |
| 소방서 식별자 | 표시명과 분리된 안정적인 `stationId` | 임시 표시명은 권한·감사 식별자로 사용하지 않음 |
| 지도·경로 사업자 | 운영 Style URL, 경로 Provider, attribution, SLA | 공개 OSM 표준 타일과 FE 보유 Provider Key를 사용하지 않음 |
| 기록 보존기간 | 사고 기록의 보존·삭제·접근 감사 정책 | FE 로컬 상태를 영구 기록으로 간주하지 않음 |
| movement 활성화 | BE 배포, Provider, staging 이동 검증 완료 기준 | `VITE_ENABLE_MOVEMENT_API=false`, 화면에 `준비 중` 표시 |
| record 활성화 | BE 영구 저장·원자성·staging 검증 완료 기준 | `VITE_ENABLE_RECORD_API=false`, 내역 조회만 유지 |

## 확정된 FE 경계

- 공개 develop FE origin은 `https://chemicheck119.site`입니다. BE staging credential CORS allowlist에 이 exact origin만 등록했으며 허용 preflight `200`, 미인증 `401`, 외부 origin `403`을 확인했습니다.
- 모든 서비스 요청은 `VITE_BFF_BASE_URL`을 사용합니다. 현재 공모전 staging은 `VITE_ENABLE_AUTH=false`로 인증 쿠키를 포함하지 않고 현장 화면에 바로 진입합니다.
- FE는 모델 API와 길찾기 Provider를 직접 호출하거나 API Key를 보관하지 않습니다.
- 사고 분석, 물질 검색, 현장 확인은 BE `develop@d1a7391` 기준 Live 연결 대상입니다.
- 확인 성공 응답의 `reanalyzeRequired=true`이면 동일한 `incidentId`로 사고 분석을 다시 호출합니다.
- movement와 record는 BE 배포가 검증된 환경에서 각각의 기능 플래그를 켜기 전까지 호출하지 않습니다.
- 시연 fixture는 `VITE_ENABLE_DEMO_MODE=true`인 명시적 데모 환경에서만 사용합니다.
- 현재 인증 미사용 환경의 401은 로그인 UI 대신 BE 인증 필터 배포 상태 오류로 표시하고 화면을 초기화하지 않습니다.
- BFF OpenAPI는 승인된 BE 전체 commit SHA에 고정하고 `pnpm contract:check`로 생성 타입과 보안 경계를 검증합니다.

## 활성화 체크

movement 또는 record 기능 플래그를 켜기 전에 다음을 확인합니다.

- [ ] 대상 환경의 BE 커밋과 배포 URL이 기록돼 있다.
- [ ] 실제 인증 쿠키가 포함된 staging 요청이 성공한다.
- [ ] 실패·timeout·409에서 기존 사고 화면이 유지된다.
- [ ] movement는 GeoJSON endpoint와 attribution을 검증한다.
- [ ] record는 영구 저장 성공에서만 `resetAllowed=true`를 반환한다.
- [ ] 브라우저 네트워크에 모델·지도 Provider API Key가 없다.
