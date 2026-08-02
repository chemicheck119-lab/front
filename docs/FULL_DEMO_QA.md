# 완성형 공개 합성 시연 QA

## 접속

- FE: `https://chemicheck119.site`
- BFF: `https://chemicheck119-be-staging-w6s6lwanpa-du.a.run.app`
- 권장 화면: 가로 1024×768 이상

상단에 `실제 API`와 `인증 미사용`이 보여야 합니다. `시연 데이터`가 보이면 offline fixture
환경이므로 Live QA 증적으로 사용하지 않습니다.

## 한 번에 실행

1. `3분 완성형 시연 시작`을 누릅니다.
2. 진행표가 `합성 지령 → AI 후보 → 사고물질 → 시설물질 → CAMEO` 순으로 완료되는지 봅니다.
3. 최종 화면에서 다음 항목을 확인합니다.
   - `공개 합성 신고`
   - 필수 CAS `2/2`
   - 충돌 규칙 `실행됨`
   - CAMEO 공개 규칙 기반 서수 등급
   - 최종 판단 `현장 지휘관`
4. `사용 종료`로 화면을 초기화한 뒤 한 번 더 실행해 재현성을 확인합니다.

## 단계별 통과 조건

| 단계 | 서버 동작 | 화면 통과 조건 |
|---|---|---|
| 합성 지령 | BE SSE `incident.accepted` | 실제 119가 아닌 `공개 합성 신고` 고지 |
| AI 후보 | FE → BFF → AI | 확인 0/2, 규칙 잠김, 위험 카드 비공개 |
| 사고물질 | 서버 고정 7681-52-9 합성 확인 후 재분석 | 확인 1/2, 규칙 잠김 |
| 시설물질 | 서버 고정 7647-01-0 합성 확인 | 확인 2/2 |
| CAMEO | 같은 incidentId로 실제 AI 재분석 | `SCREENING_COMPLETED`, 실제 CAMEO ruleId, 위험 카드 공개 |

합성 확인은 실제 대원·기관의 확인이 아니며 운영 판단에 사용할 수 없습니다. 브라우저는
CAS·물질명·확인 근거를 전송하지 않고 역할만 전송합니다. 임의 incidentId와 만료된 replay
incidentId는 서버가 거부합니다.

## 실패 시 증적

- 실패한 진행 단계와 화면의 요청 ID
- 브라우저 Network의 요청 URL·HTTP 상태·응답 `error.code`
- 실행 시각(Asia/Seoul)
- 화면 전체 스크린샷
- `GET /actuator/info`의 BE `release.gitCommit`

실패를 offline fixture 성공으로 바꾸지 않습니다. `시연 재시도`는 새 SSE incidentId부터 다시
시작합니다.
