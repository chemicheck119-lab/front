# 비용 증폭 방지와 의존성 보안 재검증

2026-10-18. 이 변경은 로컬/Draft PR이며 운영 배포하지 않았다. backend의 `fix/cost-traffic-security-review` 계약과 동기화한다. 이 PR은 기존 reference 서비스 PR #74 위에 쌓인 후속 변경이다.

## 발견과 의도

1. FE가 `retryable=true`인 503에 POST를 한 번 더 보내고, BFF도 Model API POST를 재시도할 수 있었다. 응답이 실패했다고 유료 공급자가 계산하지 않았다는 보장은 없다. 따라서 FE 자동 재시도는 GET에만 허용하고, POST는 사용자가 다시 요청하도록 한다.
2. BFF의 처리 한도 초과는 429 `CAPACITY_LIMITED`로 구분해 입력을 유지한 채 사용자에게 안내한다. 안전 판정·빈 결과·합성 응답으로 대체하지 않는다.
3. `package.json`의 Vite는 6.4.3인데 workspace override가 6.3.5를 강제해 실제 설치본은 취약한 이전 버전이었다. Router 역시 직접 의존성과 DOM 하위 의존성 버전이 달랐다. 선언값보다 실제 lockfile과 설치 그래프를 확인해야 했다.

## 실제 수정

- Vite override 6.3.5 → 6.4.3, react-router-dom 7.13.0 → 7.18.2로 직접 router와 정렬.
- 패치 후 남은 source-map-js 고위험 advisory에 대해 전이 의존성을 1.2.2로 고정.
- lockfile을 갱신하고 `--ignore-scripts`로 설치. 새 build script 실행 허용을 추가하지 않음.
- 공통 API 클라이언트 GET 재시도는 유지, POST 503과 capacity 429 반복 호출 방지 테스트 추가.
- 429 계약·source commit·SHA256·생성 타입 동기화.

## 검증과 해석

같은 로컬 프로젝트에서 `pnpm audit --json` 수행: 알려진 advisory 집계 20건(High 9, Moderate 8, Low 3) → 0건. `DEPENDENCY_AUDIT_RESULTS.json`에 실행 시각·전후 집계·버전·원본 hash를 기록한다. npm registry advisory 기준이며 도달 가능성 분석·침투 테스트·전체 보안 보장이 아니다. dev tooling 항목도 포함한다. 기본 브랜치의 GitHub Dependabot 알림은 Draft PR이 merge되기 전 그대로 남을 수 있다.

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm audit --json
corepack pnpm check
```

전체 검사는 207 tests, contract, typecheck, hosting tests와 각 build를 포함한다. API client 테스트는 동일 503에 GET 2회/POST 1회만 호출하고, 429에서도 추가 호출하지 않는지 확인한다. 이것은 실제 과금 절감액 측정이 아니다.

관련 공식/일차 출처:

- https://github.com/vitejs/vite/security/advisories
- https://github.com/remix-run/react-router/releases
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q

클라우드 비용 원본은 공개 Git에 올리지 않는다. 현재 IAM·SQL·구독 상태와 금융 내역은 비공개 감사 기록을 참고한다. gateway/DB/공급자 비용 상한과 다중 인스턴스 quota는 FE 변경으로 해결되지 않는다.
