# 브라우저 음성 전사 검증

## 범위

이 검증은 실제 전화 통화가 아니라, 인증된 staging 브라우저에서 음성을 전사 초안으로 만들고 사용자가 검토한 뒤 사고 분석에 전달하는 흐름을 확인한다.

```text
브라우저 녹음 -> PCM WAV 변환 -> BFF -> Speech Cloud Run
-> 전사 초안 -> 사용자 수정 -> 사고 분석
```

실제 전화번호, PSTN 통화, 실시간 통화 스트리밍은 이 범위에 포함하지 않는다.

## 실행 전 조건

- `VITE_ENABLE_DEMO_MODE=false`
- `VITE_ENABLE_AUTH=true`
- `VITE_ENABLE_SPEECH_API=true`
- `VITE_BFF_BASE_URL`이 staging BFF를 가리킴
- 파일럿 세션 로그인 및 마이크 권한 허용

## 검증 시나리오

1. 5~10초 길이의 개인정보 없는 합성 문장으로 녹음한다.
2. 전사 요청이 모델 API가 아니라 BFF로 전송되는지 확인한다.
3. 전사 응답 전에는 분석 callback이 호출되지 않는지 확인한다.
4. 전사 초안을 사용자가 수정한 뒤 분석을 시작한다.
5. 전사 기권, 권한 거부, 429, 503, timeout에서는 수동 입력으로 복귀한다.
6. 전사문이 CAS 확정이나 위험 판단으로 자동 승격되지 않는지 확인한다.

## 브라우저 네트워크 확인

허용되는 운영 요청:

```text
POST /api/c2guard/v1/transcriptions
POST /api/c2guard/v1/incidents/{incidentId}/transcriptions
POST /api/c2guard/v1/incidents/analyze
```

다음은 실패 조건이다.

- 브라우저가 model API Cloud Run URL을 직접 호출함
- 브라우저 요청에 `X-API-Key`가 포함됨
- bundle 또는 환경변수에 Speech API key가 포함됨

## 제한사항

- Speech API의 전사 품질은 현장 무전 성능을 의미하지 않는다.
- 전사 품질 신호는 정답 확률로 표시하지 않는다.
- 원본 음성은 저장하지 않는다.
- 음성 모델은 물질 확정, CAS 확인, 위험 판단을 수행하지 않는다.
- 실제 테스트 request ID와 결과는 개인정보 없는 QA 기록으로만 보관한다.

## 결과 기록

| 시나리오 | 결과 | Request ID | 비고 |
| --- | --- | --- | --- |
| 정상 전사 | 미실행 | - | staging 배포 후 기록 |
| 전사 기권 | 미실행 | - | 침묵 또는 무발화 |
| 사용자 수정 후 분석 | 미실행 | - | 자동 분석 방지 확인 |
| API 오류 fallback | 미실행 | - | 429/503/timeout |