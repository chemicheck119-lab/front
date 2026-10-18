# 전사 연결 중단과 수동 재연결

2026-10-18. backend 5ec6bf64d0cec8fde8fb92489abde11261ea6324 계약을 고정하고 생성 타입을 갱신했다.

- EventSource CLOSED는 자동 재연결 중과 구분해 전사 연결 중단으로 표시한다.
- EventSource에서는 HTTP 204/401/403 등의 상세 상태를 읽을 수 없으므로 한도 초과라고 단정하지 않는다.
- 사용자가 전사 다시 연결 버튼을 누르면 기존 구독을 정리하고 새 구독을 연다. 새 전화 세션은 만들지 않는다.
- 같은 사고·이벤트 revision의 재생은 편집 중 문장을 덮어쓰지 않는다. 새 revision 도착 시 기존 갱신 경로를 사용한다.
- 기존 승인 revision과 분석 게이트는 유지한다.

검증: corepack pnpm check 통과. 45 test files / 208 tests, 계약·타입·hosting 검사·각 모드 빌드 통과. 새 회귀는 중단 표시, 클릭 전 구독 추가 없음, 클릭 후 새 구독, 동일 revision 재생 후 수정문 유지, 새 전화 세션 호출 없음 확인.

범위: 화면 회귀는 mock API 기반이며 실제 브라우저 native EventSource 및 전화 공급자 end-to-end 시험이 아니다. 운영 배포하지 않았다. 테스트 로그는 private-data/validation/sse-20261018/frontend-check.log에 보관.

사용자 직접 수행: 사용자가 backend PhoneTranscriptEventBrokerTest 실행 후 BUILD SUCCESSFUL을 보고했다. 이 기록은 코드 직접 작성 또는 모든 테스트 의미를 이해했다는 증거로 확대하지 않는다.
