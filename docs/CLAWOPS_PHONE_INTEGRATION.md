# ClawOps 전화 연동 계획

Issue: #34

## 목표

ClawOps에서 발급한 070 번호로 인바운드 전화를 받고, 통화 중 transcript를 인증된 상황실 화면에 표시한 뒤 통화 종료 후 사용자가 검토한 transcript만 사고 분석에 전달한다.

```text
070 인바운드 전화
  -> ClawOps Voice Agent SDK
  -> 별도 gateway 서비스
  -> 인증된 BFF/SSE
  -> 상황실 transcript panel
  -> 통화 종료 후 사용자 검토
  -> 기존 incident analyze 흐름
```

## 3일 범위

### Day 1: 통화 수신 smoke

- ClawOps `agent.serve()` 기반 gateway 실행
- `call_start`, `transcript`, `call_end` 이벤트 수신
- `call_id`와 ClawOps account/session 경계 확인
- 현재 Trial 플랜에서 Voice Agent와 transcript event가 가능한지 확인

### Day 2: 상황판 표시

- gateway에서 interim/final transcript를 구분
- 인증된 BFF SSE 또는 동일한 서버 이벤트 경로로 전달
- 상황판에서 통화 연결, 전사 중, 통화 종료 상태 표시
- 전화번호, 원문 transcript, API key를 일반 로그에 기록하지 않음

### Day 3: 검토 후 분석

- 통화 종료 후 final transcript를 검토 대기 상태로 표시
- 사용자가 수정하거나 승인한 뒤 기존 사고 분석 호출
- transcript를 CAS 확정값으로 승격하지 않음
- 두 CAS confirmation gate를 유지
- 통화 연동 실패 시 브라우저 직접 입력으로 복귀

## 안전 경계

- 브라우저에서 ClawOps/OpenAI API를 직접 호출하지 않는다.
- ClawOps API key와 LLM API key는 Secret Manager 또는 Cloud Run secret 환경변수로만 주입한다.
- `call_id`, `account_id`, 로그인 사용자, incident의 연결을 서버에서 검증한다.
- transcript는 분석 후보이며 확정 사실이 아니다.
- 통화 중 자동 위험 판단, 자동 action 실행, 현장 지시를 하지 않는다.
- 녹음과 transcript 보존은 동의·보존기간·삭제 정책을 확정하기 전 활성화하지 않는다.
- 모든 Webhook은 `X-Signature`를 검증한다.

## 구현 선택

3일 안에는 저수준 VoiceML Stream/WebRTC를 직접 구현하지 않고 검증된 Voice Agent SDK 경로를 우선한다.

```text
ClawOps Voice Agent SDK
  - Control WebSocket: gateway와 ClawOps signaling
  - Media WebSocket: SDK 내부 통화 오디오 처리
  - transcript event: gateway가 수신
```

저수준 Stream은 G.711 mu-law 8kHz mono와 WebSocket 인증·IP allowlist·pacing을 직접 관리해야 하므로 2차 범위로 둔다.

## 브라우저 Speech와의 역할 분리

두 음성 경로는 같은 기능으로 합치지 않는다.

```text
브라우저 음성
  -> 우리 Speech API
  -> 전사 초안
  -> 사용자 검토

전화 음성
  -> ClawOps transcript
  -> gateway/BFF
  -> 상황판 실시간 표시
  -> 통화 종료 후 사용자 검토
```

브라우저 음성은 우리 faster-whisper 모델을 검증하는 경로이고, 전화 음성은 ClawOps의
실시간 통화 transcript를 검증하는 경로다. 전화 transcript를 브라우저 Speech API로
재전송하거나, 두 결과를 자동으로 합쳐 확정 텍스트를 만들지 않는다.

## Transcript 이벤트 계약

gateway가 BFF/SSE로 전달하는 최소 이벤트는 다음 의미를 갖는다.

```json
{
  "type": "call.transcript",
  "callId": "CA-EXAMPLE",
  "phase": "INTERIM",
  "role": "user",
  "text": "공장 탱크에서 누출이 발생했습니다.",
  "requiresReview": true
}
```

- `INTERIM`은 화면에 임시 문장으로만 표시하고 분석에 사용하지 않는다.
- `FINAL`도 자동 분석하지 않고 사용자의 검토를 기다린다.
- `callId`와 로그인 session/incident의 연결은 서버에서 검증한다.
- `text` 전문은 일반 로그에 기록하지 않는다.
- 통화가 종료되면 gateway는 최종 transcript와 통화 상태만 전달하고, 프론트가 분석 시작을 결정한다.

## Go/No-Go

### Go

다음 흐름이 성공하면 전화 기능을 보조 시연 경로로 포함한다.

```text
070 번호 -> Voice Agent -> transcript event -> gateway -> 상황판 표시
```

### No-Go

오늘 안에 통화 이벤트 수신이 되지 않거나 플랜 제한이 확인되지 않으면 전화 기능은 제출 주 경로에서 제외한다. 브라우저 Speech API 전사 흐름을 주 경로로 유지하고 전화 연동은 확장 계획으로만 설명한다.

## Business 플랜 판단

Business를 먼저 구매하지 않는다. 현재 계정에서 다음을 확인한 뒤 막히는 항목이 있을 때만 업그레이드를 검토한다.

- 인바운드 Voice Agent 사용 가능 여부
- `transcript` 이벤트 사용 가능 여부
- Webhook URL 등록 가능 여부
- 통화시간과 일일 통화량 제한
- 번호 유지기간
- 동시 통화 제한
- 실시간 Stream 권한
- 녹음/전사 애드온 과금 여부
- 심사기간인 2026-09-21부터 2026-10-05까지 번호와 API 유지 여부
- 초과 요금과 자동 결제 여부

## 제출 시 표현

검증 전에는 다음처럼 표현한다.

> ClawOps 기반 인바운드 전화 연동은 별도 gateway 구조로 설계했으며, 현재 제출 주 경로는 검증된 브라우저 음성 전사와 사용자 검토 흐름입니다.

통화 smoke가 성공한 뒤에만 다음 표현을 사용한다.

> 070 인바운드 통화의 전사 이벤트를 gateway에서 수신해 상황판에 표시하고, 통화 종료 후 사용자가 확인한 transcript를 사고 분석 입력으로 연결했습니다.

## 참고

- https://platform.claw-ops.com/docs/getting-started
- https://platform.claw-ops.com/docs/voice-agent
- https://platform.claw-ops.com/docs/webhooks
- https://platform.claw-ops.com/docs/build/stream
