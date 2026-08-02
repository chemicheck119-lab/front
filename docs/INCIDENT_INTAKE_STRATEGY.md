# 신고 입력·시연·실운영 전략

## 결론

공모전 주 시연은 `공개 합성 신고 → 실제 FE → 실제 BE/BFF → 실제 AI → 실제 응답`으로 한다.
합성 입력이라는 사실을 화면과 발표에서 숨기지 않는다. 로컬 fixture가 응답을 만드는
`DEMO_SIMULATION`은 인터넷 장애 시 백업 영상·화면에만 사용한다.

현재 케미체크119가 실시간으로 받는 것은 사용자가 입력한 신고문과 브라우저 GPS다. 소방청
119 종합상황실의 실제 지령 feed와 연계됐다고 주장하지 않는다. 실제 119 지령 데이터는 공개
API가 아니라 기관별 권한·개인정보·망연계·감사 정책이 필요한 운영 통합 대상이다.

## 데이터와 처리 경계

| 구분 | 신고 입력 | 분석·저장 | 화면 표기 | 용도 |
|---|---|---|---|---|
| Contest Live | 개인정보 없는 공개 합성 신고 | 배포된 BFF·AI·DB | `실제 API` + `공개 합성 신고` | 발표 주 시연 |
| Manual Live | 상황실·대원이 직접 입력 | 배포된 BFF·AI·DB | `실제 API` | 기관 pilot 전 운영 검증 |
| Dispatch Pilot | 승인된 지령 adapter | 동일 BFF·AI·DB | 실제 입력 출처 | 기관 협약 후 |
| Offline Demo | 저장소 fixture | 브라우저 메모리 | `시연 데이터` | 인터넷 장애 백업 |

합성 신고는 서비스 동작을 재현하기 위한 입력이다. 물질 후보·근거·안전 gate 결과는 소방안전
빅데이터 플랫폼 자료와 공개 화학안전 근거를 사용하는 실제 서버에서 생성한다. fixture 응답과
live 응답을 자동으로 섞거나 장애 시 몰래 대체하지 않는다.

## 목표 운영 구조

```text
119 지령 시스템 또는 승인된 기관 연계
  → Dispatch Adapter
  → IncidentEnvelope 정규화·검증·비식별/접근통제
  → BE intake 저장 + event 발행
  → 권한 있는 MDT/태블릿이 수신
  → 기존 incidents/analyze BFF
  → AI 후보·공식 근거·확인 gate
  → confirmation → movement → record
```

시연에서는 `Scenario Replay Adapter`가 같은 `IncidentEnvelope`를 만든다. 운영 adapter와 replay
adapter는 입력원만 다르고 이후 검증·분석·저장 경로는 같아야 한다.

## IncidentEnvelope 최소 계약

```json
{
  "eventId": "EVT-...",
  "incidentId": "INC-...",
  "sourceType": "SYNTHETIC_REPLAY | MANUAL_DISPATCH | AUTHORIZED_119_ADAPTER",
  "dataClassification": "PUBLIC_SYNTHETIC | OPERATIONAL_RESTRICTED",
  "receivedAt": "RFC3339",
  "occurredAt": "RFC3339|null",
  "dispatchText": "string",
  "location": {
    "address": "string|null",
    "latitude": "number|null",
    "longitude": "number|null",
    "coordinateSource": "string|null"
  },
  "organization": {
    "stationId": "string|null"
  },
  "provenance": {
    "scenarioId": "string|null",
    "datasetVersions": ["string"]
  }
}
```

전화번호·신고자 이름·주민정보 같은 원문 개인정보는 분석에 불필요하면 adapter에서 제거한다.
운영 event는 인증된 조직과 사고 scope에만 전달하고 모든 열람·처리를 request ID로 감사한다.

## 단계별 실사용 전환

1. 공개 합성 시나리오가 실제 배포 파이프라인을 통과하는지 반복 검증한다.
2. 기관 제공 없이 가능한 `Manual Live`에서 상황실 입력→태블릿 분석→기록 저장을 검증한다.
3. 지령 시스템 담당 기관과 데이터 항목, 전송 방식, 망연계, 보존·삭제, 장애 fallback을 합의한다.
4. `AUTHORIZED_119_ADAPTER`를 별도 배포하고 합성 replay와 같은 계약 테스트를 통과시킨다.
5. 가명·비식별 pilot 사고로 shadow 운영한 뒤 승인된 범위에서만 실운영한다.

실제 119 feed가 없어도 공개 가능한 서비스와 플랫폼 데이터 활용은 시연할 수 있다. 다만 기관
연계가 끝나기 전에는 `실시간 119 신고 연동 완료`가 아니라 `실시간 연계를 위한 adapter-ready
구조, 현재는 공개 합성 신고와 수동 접수로 검증`이라고 표현한다.
