# Pad 음성 전사와 검토 UX

## 사실 상태

**부분 구현 또는 개발용 데모**입니다. 브라우저 microphone 녹음, PCM16 WAV 변환,
인증된 BFF 호출, 전사 초안 검토 경계와 자동 검증은 구현했습니다. 실제 Pad 기종,
private Speech Cloud Run, 현장 무전 음성, 운영 부하와 사용자 효과는 아직 검증하지 않았습니다.

## 사용자 흐름

```text
대원이 음성 녹음 또는 승인된 PCM WAV 선택
  → 브라우저 memory에서 16 kHz·mono·PCM16 WAV 생성
  → 인증된 BFF로 1회 전송
  → Speech API 전사 또는 안전한 기권
  → 편집 가능한 textarea에 “전사 초안” 표시
  → 대원이 듣고 수정
  → 대원이 분석 시작을 명시적으로 누름
  → Parser·Resolver 후보 탐색
```

전사가 끝나도 분석을 자동 실행하지 않습니다. 전사문은 CAS 확정값이 아니며 Speech API 품질
신호도 정답 확률이 아닙니다. 전사 응답이 물질 식별·CAS 확인·위험 판단을 수행했다고 표시하거나
원본 음성을 보관했다고 표시하면 FE가 결과를 숨깁니다.

## 두 입력 단계

| 단계 | BFF 경로 | 권한 | 응답 incident ID |
|---|---|---|---|
| 신고 접수 전 | `POST /api/c2guard/v1/transcriptions` | 인증 session | `null` |
| 사고 생성 후 | `POST /api/c2guard/v1/incidents/{incidentId}/transcriptions` | 인증 + incident scope | 기존 ID |

사고 ID는 전사 client가 만들지 않습니다. 접수 전 전사문을 검토한 뒤 사고 분석 API가 ID를
발급합니다. 이 구조로 임의 incident scope 우회를 막습니다.

## 음성 처리 경계

- microphone은 `MediaRecorder`로 일시 녹음합니다.
- 브라우저가 만든 WebM/MP4 음성은 `AudioContext`로 decode한 뒤
  `OfflineAudioContext`에서 16 kHz mono로 resample합니다.
- PCM16 RIFF/WAVE bytes는 memory에서만 생성하고 다운로드·localStorage·IndexedDB에
  저장하지 않습니다.
- 최대 녹음은 60초이고 파일 상한은 16 MiB입니다.
- component unmount 시 요청을 abort하고 microphone track·timer를 닫습니다.
- BFF 503이 retryable이어도 고비용 중복 전사를 막기 위해 자동 재시도하지 않습니다.

## 활성화 조건

다음 세 조건이 모두 맞아야 UI가 보입니다.

```text
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_AUTH=true
VITE_ENABLE_SPEECH_API=true
```

`VITE_BFF_BASE_URL`도 필요합니다. 인증 없는 공개 staging이나 offline demo에서는 전사 버튼을
숨깁니다. Speech API Key나 IAM token을 `VITE_*`에 넣지 않으며 브라우저는 Speech API를
직접 호출하지 않습니다.

## 검증 범위

- 16 kHz mono PCM16 WAV header/sample 생성
- 60초·sample rate·파일 크기·media type 제한
- 접수 전/사고 후 BFF 경로 선택과 incident ID URL encoding
- 전사 요청의 자동 재시도 금지
- 기권 시 빈 전사문 미입력
- 응답 safety boundary 회귀 차단
- microphone 중지·track 정리
- 전사 기능 off 또는 물질 검색 mode에서 control 숨김

```bash
corepack pnpm check
```

실제 적용 전에는 대상 Pad/브라우저별 codec decode와 microphone 권한, 60초 자동 중지,
네트워크 timeout, 한국어 신고음성 전사 품질을 별도 E2E로 검증해야 합니다.
