# 프론트엔드 검증 기록

검증일: 2026-08-01

환경: macOS arm64, Node.js 24, Chromium 기반 Codex 브라우저

## 자동 검증

```text
pnpm typecheck  성공
pnpm test       성공 — 7 files, 17 tests
pnpm build      성공
pnpm build:demo 성공
```

테스트한 핵심 상태:

- GPS 권한 거부·오래된 위치·낮은 정확도
- 실제/시연 GeoJSON 경로만 렌더링
- 에이전트 `EN_ROUTE_TRIAGE` 단계와 다음 행동
- 한 CAS 확인 시 위험 숨김
- 두 CAS 확인·규칙 실행 뒤 위험 표시
- 저장 성공 응답에서만 초기화
- MapLibre 컨테이너 높이 0px 회귀 방지
- Demo 모드에서만 fixture 사용, Live 장애 시 자동 대체 금지
- 인증·확인 필요·근거 부족·경로 없음·artifact 미준비 오류 구분
- 사용자 오류 메시지에 안전한 문구와 request ID만 표시

## 브라우저 검증

| 화면/동작 | 결과 |
|---|---|
| 로그인 | 17개 시·도 선택과 소방서 접속 성공 |
| 사고 좌표 없음 | 위치 확인 필요 상태, 직선 경로·가짜 ETA 없음 |
| 시연 신고 | 사고/대원 마커·GeoJSON 경로·ETA 8분·거리 4.0km 표시 |
| 확인 게이트 | 첫 CAS 확인 후 계속 잠김, 두 번째 확인 후 규칙 결과 표시 |
| 에이전트 | 현재 목표·다음 행동·workflow·도구 요약 표시 |
| 물질검색 | 관찰 후보·CAS·일치 특징·출처·확인 필요 표시 |
| 기록 저장 | 확인 Dialog → 성공 → 토스트 → 새 사고 화면 초기화 |
| 라이트/다크 | 두 모드의 대비·상태색 확인 |
| 1024×768 | 가로 스크롤 없음(`scrollWidth=1024`), 지도/패널 동시 표시 |
| 콘솔 | 페이지 오류 없음 |

브라우저 위치 권한을 실제로 허용하는 동작은 사용자 승인 없이 수행하지 않았습니다. 대신 geolocation 상태 분기와 권한 거부는 단위 테스트로 검증했고, 시각 검증은 명확한 `시연 데이터` 모드에서 수행했습니다.

## 변경 전·후

### 변경 전 — 울산 고정 iframe

![변경 전 울산 고정 지도](./screenshots/00-before-fixed-ulsan.jpg)

### 변경 후 — 전국 현장대응 에이전트·지도

![에이전트 지도 시연](./screenshots/02-agent-map-demo.jpg)

### 물질검색

![물질검색 후보](./screenshots/03-substance-search.jpg)

### 1024px 다크 모드

![1024px 태블릿 다크 모드](./screenshots/04-tablet-dark-1024.jpg)

## 검증 한계

- 공개 MapLibre demo style은 `.env.demo`와 `pnpm dev:demo`에서만 사용하며 운영 설정에는 사용하지 않습니다.
- 실제 BE·길찾기 Provider·차량 GPS는 아직 연결되지 않았으므로 운영 연동 완료가 아닙니다.
- 실제 장비 위치 권한과 장시간 이동은 staging 태블릿에서 추가 검증해야 합니다.
