# BFF 계약 동기화

FE의 고정 기준은 `chemicheck119/BE_Repository@d1a7391d33cd7dc798eb72debc6198e1549547c6`의 `contracts/dashboard-bff-v1.openapi.json`입니다.

- `dashboard-bff-v1.openapi.json`: 권위 커밋에서 가져온 OpenAPI 원본
- `dashboard-bff-v1.source.json`: 저장소·전체 commit SHA·원본 해시·URL
- `src/api/generated/dashboard-bff.ts`: `openapi-typescript` 생성 타입

## 검증

```bash
pnpm contract:check
```

이 검사는 원본 SHA-256, 계약 버전, 정확한 5개 BFF 경로, `ServiceSession` 쿠키 보안, 브라우저의 모델 API 직접 호출 금지, 현장 확인 필수 필드와 생성 타입 동기화를 확인합니다. `pnpm check`와 `develop` CI에도 포함됩니다.

## 기준 커밋 갱신

1. 팀이 새 BE 기준 commit을 승인합니다.
2. 해당 전체 SHA의 OpenAPI 파일로 원본을 교체합니다.
3. `dashboard-bff-v1.source.json`의 commit·SHA-256·URL을 함께 갱신합니다.
4. `pnpm contract:generate`를 실행합니다.
5. 생성 타입을 직접 편집하지 않고 `pnpm check`로 검증합니다.

BE 최신 브랜치를 자동 추종하지 않습니다. 기준 변경은 FE 영향 검토와 staging 증적을 동반해야 합니다.
