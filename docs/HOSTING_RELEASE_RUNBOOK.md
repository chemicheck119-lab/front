# 프론트 미리보기·승인 배포와 복구

사이트를 먼저 내리지 않고 **새 화면을 준비 → 검증 → 승인 → 버전 교체**합니다.
사용 중인 실제 사이트는 `https://chemicheck119.site`이며 Firebase Hosting 사이트 `chemi-check`를 그대로 사용합니다.
새 Cloud Run·VM·GPU·DB나 장기 서비스 계정 키를 만들지 않습니다.

## 팀원이 사용하는 순서

1. PR의 `type-test-build` 검사를 통과시킨 뒤 `develop`에 병합합니다.
2. [프론트 미리보기·승인 배포](https://github.com/chemicheck119-lab/front/actions/workflows/hosting-release.yml)가 staging 번들을 검증·빌드합니다.
3. 실행 Summary에서 `previewUrl`을 열어 홈·기능 소개·공공데이터·정부 동향을 확인합니다. 운영 사이트는 아직 바뀌지 않습니다.
4. Summary의 `version`과 `expectedLiveVersion`을 기록합니다.
5. 같은 workflow의 **Run workflow**에서 branch `develop`, operation `promote`, version과 expected_live_version을 입력합니다.
6. 실행의 **Review deployments → hosting-production**에서 담당자 `hywznn`이 검토 후 승인합니다. 자동화 도구가 이 승인을 대신하지 않습니다.
7. 검증된 **동일 Hosting version**을 운영으로 전환합니다. 다시 빌드하지 않습니다. HTTP smoke 실패 시 다른 배포가 끼어들지 않은 경우에만 직전 버전으로 되돌립니다.

승인 환경은 관리자 우회 불가, `develop` 브랜치만 허용합니다. 단독 담당자가 수동 실행한 작업을 직접 승인할 수 있도록 self-review 차단은 사용하지 않습니다. 승인자가 여러 명 필요한 조직 운영 정책은 별도 결정 사항입니다.

```bash
# 미리보기만 수동 재실행 (실제 사이트 전환 없음)
gh workflow run hosting-release.yml --repo chemicheck119-lab/front --ref develop -f operation=preview

# 아래 명령은 실행 요청만 생성합니다. GitHub 환경의 사람 승인은 별도입니다.
gh workflow run hosting-release.yml --repo chemicheck119-lab/front --ref develop \
  -f operation=promote -f version=확인한_후보_ID -f expected_live_version=확인한_운영_ID
```

### 롤백

같은 workflow에서 operation `rollback`을 선택하고 **이전에 실제 운영했던 version ID**와 **현재 운영 ID**를 입력합니다. 역시 `hosting-production` 승인이 필요합니다.
최근 운영 release 100건에 없는 대상, 삭제·만료된 version, 미고정 BFF 설정은 거부합니다.
복구 대상은 임시 preview에서 먼저 검사합니다. 현재 사이트의 오류 때문에 롤백 자체가 차단되지는 않도록 현재 사이트의 정상 동작을 선행 조건으로 삼지 않습니다.

복구는 해당 version의 **화면과 Hosting rewrite 설정 전체**를 복원합니다. 과거 BFF tag의 존재·정상 동작도 확인해야 합니다.
롤백 대상에는 이후에 생긴 JS가 없을 수 있어, 새 버전을 이미 열었던 사용자는 새로고침이 필요할 수 있습니다.

## 배포 사고를 줄이는 장치

| 문제 | 구현한 동작 |
|---|---|
| 업로드 도중 방문 | 파일 업로드·FINALIZED 완료 후 release 생성. 기존 운영 유지 |
| 미리보기와 운영의 빌드 차이 | 검증한 Hosting version ID 그대로 승격 |
| 프론트 배포 중 BFF가 최신으로 바뀜 | 실제 live version의 고정 `run.tag`·전체 config 복사. `pinTag: true`를 다시 해석하지 않음 |
| 이미 열린 화면이 이전 JS 요청 | 이전 live의 `/assets/` hash를 새 version에도 포함. 같은 URL의 다른 내용은 차단 |
| 승인 대기 중 다른 운영 배포 | expected_live_version·후보 base-version·config 동일성 검사 후 중단 |
| 중복·경합 배포 | live job 직렬화, 실행 중 작업 취소 안 함, 전환 POST 자동 재시도 안 함 |
| 전환 응답 유실 | 실제 live version을 읽어 후보가 올라갔는지 확인하고 복구 여부 결정 |
| 잘못된 복구로 다른 배포 덮어쓰기 | 현재 live가 이 실행의 후보일 때만 자동 복구 |
| timeout·무한 반복 | HTTP 15~60초, 배포 job 15분, post-smoke 최대 3회 |
| 파일·비용 누적 | 새 파일 원본 64 MiB, 기존 version 크기+새 파일 128 MiB, 보존 파일 2,000개, 활성 CI preview 10개 상한 |

미리보기는 7일 후 만료됩니다. 업로드 실패 뒤 release에 연결되지 않은 version은 별도 점검 대상입니다. 보존 상한 도달 시 자동으로 운영 이력을 삭제하지 않고 중단합니다.
파일 크기 상한은 비용 차단 장치가 아닙니다. 기존 Hosting 저장·트래픽과 GitHub Actions 이용량은 과금 대상일 수 있습니다.

**수동 CLI 배포를 동시에 실행하지 마세요.** Hosting release 생성 API에는 이 코드가 쓸 수 있는 원자적 compare-and-swap 조건이 없어, 최종 확인과 전환 사이의 외부 수동 배포 경합까지 제거하지는 못합니다. workflow 밖의 배포 권한·변경 관리도 필요합니다.
Backend 운영자는 기존 release tag를 다른 revision으로 재지정하지 않아야 합니다. 이 FE 전용 계정에는 Cloud Run 조회·변경 권한이 없으므로, 외부에서 tag의 대상을 바꾼 사실까지 검증하는 것은 아닙니다.

## 인증·권한 설정

2026-09-20 구성 대상:

| 항목 | 값 |
|---|---|
| GitHub workflow | `.github/workflows/hosting-release.yml` |
| WIF provider | `projects/181872008704/locations/global/workloadIdentityPools/github-actions/providers/chemicheck119-fe` |
| Service account | `chemicheck119-hosting-deploy@chemi-check.iam.gserviceaccount.com` |
| Custom IAM role | `projects/chemi-check/roles/chemicheck119HostingDeployer` |
| GitHub variables | `HOSTING_WIF_PROVIDER`, `HOSTING_SERVICE_ACCOUNT` |
| GitHub environments | `hosting-preview`, `hosting-production` |

WIF는 숫자 repository ID `1357789419`, owner ID `325139595`, `refs/heads/develop`, 위 workflow 경로, `push/workflow_dispatch`, 두 환경 subject만 허용합니다.
다른 저장소·PR 브랜치·임의 workflow는 배포 계정을 사용할 수 없습니다. 서비스 계정 키는 생성하지 않습니다.

Custom role 권한은 `firebasehosting.sites.get/list/update`, `resourcemanager.projects.get`, `serviceusage.services.use`입니다.
Firebase의 사이트 갱신 권한은 release·version 관리도 포괄하므로 preview와 live의 IAM 권한 자체가 분리된 것은 아닙니다. 운영 승인 경계는 보호된 workflow·GitHub environment이며, Hosting API 권한은 프로젝트 범위입니다. Cloud Run·SQL·Secret·IAM 관리 및 사이트 생성·삭제 권한은 부여하지 않습니다.

actions는 commit SHA로 고정했습니다. 빌드 job에는 OIDC 권한이 없고, 배포 job에서는 npm 의존성을 설치하지 않습니다.
`gha-creds-*.json`·배포 결과 파일은 Git/Docker 이미지에서 제외합니다.

## 검증과 한계

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm build:hosting
node scripts/hosting/release.mjs inspect # 운영 version 읽기만, gcloud 인증 필요
```

- `dist/hosting`만 배포합니다. Sites Worker·데모 번들·`dist/client`를 섞지 않습니다.
- workflow Summary와 `hosting-*-evidence` artifact에 version·commit·config hash·파일 manifest hash·검사 범위를 기록합니다. 토큰·세션·신고 내용은 기록하지 않습니다.
- HTTP 검사는 홈과 3개 탭의 HTML, JS/CSS 응답, 공개 소방서 GET 계약을 확인합니다. POST·전화 발신·신고 생성은 하지 않습니다.
- preview의 빌드는 운영과 동일합니다. `.env.staging`의 API/로그인 URL은 운영 origin을 가리킵니다. preview가 격리된 Backend 테스트 환경인 것은 아닙니다. preview에서 실제 신고·로그인·개인정보 입력을 하지 않습니다.
- 도메인 제한 지도 키는 preview 도메인에서 제한될 수 있습니다. HTTP smoke 통과를 지도·로그인·전사 E2E 통과로 표현하지 않습니다.
- 무중단 **배포 절차**와 실행 중인 전사 SSE·로그인 세션·메모리 상태 보존은 다릅니다. 자동 새로고침을 추가하지 않으며 API 하위 호환과 실제 사용자 세션은 별도 검증이 필요합니다.

| 항목 | 사실 상태 |
|---|---|
| staging 빌드·preview·승인·동일 버전 승격·복구 코드 | 부분 구현 또는 개발용 데모 — 개별 실행 결과는 Actions와 연결 이슈에서 확인 |
| 운영 전환·실제 운영 롤백 훈련 | 부분 구현 또는 개발용 데모 — 코드·모의 실패 테스트와 별개로 **운영 실행 검증은 사람 승인 후 별도** |
| 전사 중 사용자 영향 0·현장 고가용성·무중단 보장 | 검증되지 않은 가설 |

현재 UI 수정 작업의 별도 브랜치는 이 배포 설정 PR에 섞지 않습니다. 새 화면을 내보내려면 해당 UI 변경도 PR·CI를 거쳐 `develop`에 반영해야 합니다.

관련 이슈: [#57](https://github.com/chemicheck119-lab/front/issues/57)

근거: [Hosting REST 배포](https://firebase.google.com/docs/hosting/api-deploy), [채널·버전·복구](https://firebase.google.com/docs/hosting/manage-hosting-resources), [Cloud Run rewrite tag](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions#CloudRunRewrite), [GitHub WIF](https://github.com/google-github-actions/auth).
