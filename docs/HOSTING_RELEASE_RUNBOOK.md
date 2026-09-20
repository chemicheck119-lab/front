# 프론트 미리보기·승인 배포와 복구

사이트를 먼저 내리지 않고 **새 화면을 준비 → 검증 → 승인 → 버전 교체**합니다.
사용 중인 실제 사이트는 `https://chemicheck119.site`이며 Firebase Hosting 사이트 `chemi-check`를 그대로 사용합니다.
새 Cloud Run·VM·GPU·DB나 장기 서비스 계정 키를 만들지 않습니다.

> **2026-09-20 실제 검증 상태: CI·실제 미리보기 배포 통과, 운영 전환 미실행.** 사용자 승인 후 Hosting Admin·quota 사용 권한을 설정하고, 기존 BFF 서비스 하나에 `run.services.get`만 추가했습니다. [Actions 실행 35496286086의 2차 시도](https://github.com/chemicheck119-lab/front/actions/runs/35496286086/attempts/2)에서 업로드·미리보기·HTTP 검사가 통과했습니다. 프론트 141개와 Hosting 보호 26개 테스트가 통과했으며, 운영 version `4cfe0bf0a437bd8b`와 BFF rewrite 설정은 유지됩니다. **운영 승격·실제 롤백·사용자 세션 무중단은 아직 실행 검증하지 않았습니다.**

## 확인 가능한 첫 성공 결과

| 항목 | 실제 기록 |
|---|---|
| 미리보기 | [CI 미리보기 열기](https://chemi-check--ci-35496286086-2-qraarcir.web.app) — 7일 후 만료 |
| 후보 version | `fca1308ce8827702` |
| 당시 운영 version | `4cfe0bf0a437bd8b` — 변경 없음 |
| 소스 commit | `24af611877c20d13d30555c1f453e8edd750bd79` |
| 검사 시간 | `2026-09-20T07:19:30.013Z` |
| 새 번들 크기 | 6,458,764 bytes, 이전 asset 추가 보존 1개 |
| config SHA-256 | `4fa13a02e146f6afd9ab9039cb4e93f6d20b14b4531e339a1f37bfc63b7704c7` |
| 파일 manifest SHA-256 | `783cf7297dfb24d8576ae85e6c43ddf7dea1a1701050e91738ebd19a18b9b461` |
| index SHA-256 | `59a9d705e5c910f964b911fc66feff7d4341057f317a9b8b70267e77d50a4fad` |
| HTTP 검사 | `/`, `/features`, `/public-data`, `/trends`, JS/CSS, 소방서 GET 계약 |
| 브라우저 확인 | 홈 렌더링·기능 소개 이동 확인. 로그인·신고 생성·전화 발신은 수행하지 않음 |

이 표는 첫 성공의 고정 기록입니다. 실제 승격 시에는 **최신 실행 Summary**의 후보·운영 version을 확인해야 합니다. 위 ID를 최신 상태 확인 없이 복사하지 마세요.

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
| 새 미리보기의 전파 지연 | 루트·정적 asset의 404/503만 최대 6회 GET 검사, 대기 2/4/8/16/30초(합계 60초). HTML hash·BFF 계약 오류는 즉시 실패하며 배포 POST는 반복하지 않음 |
| 파일·비용 누적 | 새 파일 원본 64 MiB, 기존 version 크기+새 파일 128 MiB, 보존 파일 2,000개, 활성 CI preview 10개 상한 |

미리보기는 7일 후 만료됩니다. 업로드 실패 뒤 release에 연결되지 않은 version은 별도 점검 대상입니다. 보존 상한 도달 시 자동으로 운영 이력을 삭제하지 않고 중단합니다.
파일 크기 상한은 비용 차단 장치가 아닙니다. 기존 Hosting 저장·트래픽과 GitHub Actions 이용량은 과금 대상일 수 있습니다.

**수동 CLI 배포를 동시에 실행하지 마세요.** Hosting release 생성 API에는 이 코드가 쓸 수 있는 원자적 compare-and-swap 조건이 없어, 최종 확인과 전환 사이의 외부 수동 배포 경합까지 제거하지는 못합니다. workflow 밖의 배포 권한·변경 관리도 필요합니다.
Backend 운영자는 기존 release tag를 다른 revision으로 재지정하지 않아야 합니다. FE 전용 계정에는 Hosting rewrite 검증을 위해 해당 BFF 서비스 하나의 `run.services.get` 조회 권한만 부여했습니다. 현재 스크립트가 tag→revision 매핑을 저장·비교하는 것은 아니므로, 외부에서 tag의 대상을 바꾼 사실까지 검증하지는 않습니다. Cloud Run 변경 권한은 없습니다.

## 인증·권한 설정

2026-09-20 구성 대상:

| 항목 | 값 |
|---|---|
| GitHub workflow | `.github/workflows/hosting-release.yml` |
| WIF provider | `projects/181872008704/locations/global/workloadIdentityPools/github-actions/providers/chemicheck119-fe` |
| Service account | `chemicheck119-hosting-deploy@chemi-check.iam.gserviceaccount.com` |
| Hosting 권한 | `roles/firebasehosting.admin` — 사용자 승인 후 부여, Hosting 사이트 생성·삭제 포함 |
| API quota 사용 | `roles/serviceusage.serviceUsageConsumer` — 프로젝트 quota 사용, API 활성화·비활성화 권한 아님 |
| BFF 연결 확인 | `projects/chemi-check/roles/chemicheck119HostingBackendReader` — `run.services.get` 한 개만 포함, `asia-northeast3/chemicheck119-be-staging` 서비스에만 binding |
| 시험 구성한 Custom IAM role | `projects/chemi-check/roles/chemicheck119HostingDeployer` — 미지원, 배포 계정의 binding 제거 |
| GitHub variables | `HOSTING_WIF_PROVIDER`, `HOSTING_SERVICE_ACCOUNT` |
| GitHub environments | `hosting-preview`, `hosting-production` |

WIF는 숫자 repository ID `1357789419`, owner ID `325139595`, `refs/heads/develop`, 위 workflow 경로, `push/workflow_dispatch`, 두 환경 subject만 허용합니다.
저장소는 immutable subject를 사용하므로 subject prefix는 `repo:chemicheck119-lab@325139595/front@1357789419`입니다. ID가 없는 과거 형식을 사용한 첫 시도는 거부됐고, 실제 저장소 OIDC 설정을 확인해 수정했습니다.
다른 저장소·PR 브랜치·임의 workflow는 배포 계정을 사용할 수 없습니다. 서비스 계정 키는 생성하지 않습니다.

시험 구성한 Hosting Custom role 권한은 `firebasehosting.sites.get/list/update`, `resourcemanager.projects.get`, `serviceusage.services.use`이며 실제 version 생성에 실패했습니다. Hosting의 custom role 미지원 제약도 확인했으므로 채택하지 않습니다. 표준 Hosting Admin으로 교체한 뒤의 상세 오류는 BFF의 `run.services.get` 누락이었습니다. 초기 403의 원인을 custom role 문제 하나로만 단정하지 않습니다.
사용자 승인 후 표준 Hosting Admin과 Service Usage Consumer로 교체했으며 시험용 custom role binding은 제거했습니다. 이 표준 Hosting 역할에는 사이트 생성·삭제 권한도 포함됩니다. Cloud Run·SQL·Secret·IAM 관리 권한은 부여하지 않습니다.
추가 사용자 승인으로 BFF 서비스 하나에 `run.services.get`만 부여했습니다. 이 Cloud Run custom role은 프로젝트 전체에 binding하지 않으며, Hosting 전용 custom role과 다른 역할입니다. 서비스 설정·메타데이터를 읽을 수 있지만 수정·삭제·재배포·IAM 변경·Secret Manager 값 조회 권한은 포함하지 않습니다. 서비스 설정에 평문 환경변수가 있다면 조회 범위에 포함되므로 조회 결과 전체나 환경변수는 CI 로그에 출력하지 않습니다.
preview와 live의 IAM 권한 자체는 분리되지 않으며, 운영 승인 경계는 보호된 workflow·GitHub environment입니다. Hosting 권한의 범위는 프로젝트입니다.

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
| staging 빌드·WIF 인증·실제 preview·HTTP 검사 | 구현 완료 — 위 실행·artifact에서 재현 확인 |
| 승인 환경·동일 버전 승격·실패 시 복구 코드 | 부분 구현 또는 개발용 데모 — 보호 로직 테스트 통과, 운영 실행은 미검증 |
| 운영 전환·실제 운영 롤백 훈련 | 부분 구현 또는 개발용 데모 — 코드·모의 실패 테스트와 별개로 **운영 실행 검증은 사람 승인 후 별도** |
| 전사 중 사용자 영향 0·현장 고가용성·무중단 보장 | 검증되지 않은 가설 |

현재 UI 수정 작업의 별도 브랜치는 이 배포 설정 PR에 섞지 않습니다. 새 화면을 내보내려면 해당 UI 변경도 PR·CI를 거쳐 `develop`에 반영해야 합니다.

관련 이슈: [#57](https://github.com/chemicheck119-lab/front/issues/57)

### 2026-09-20 새 미리보기의 최초 404 진단

홈 UI PR #63 병합 후 [35498432398 실행](https://github.com/chemicheck119-lab/front/actions/runs/35498432398)의 두 시도에서 업로드·FINALIZED·채널 release 직후 첫 GET이 404로 실패했다. 첫 후보 `111a3080c31f0d9b`는 운영 전환 없이 같은 주소를 다시 검사하여 08:04:58 UTC에 홈·3개 탭·정적 asset·소방서 GET을 통과했다. 이를 근거로 새 미리보기의 제한적 전파 대기를 추가한다. 실제 파일/hash 검사나 운영 승인 조건을 생략하지 않으며, 실제 전환 결과는 이슈 #61에 별도로 기록한다.

근거: [Hosting REST 배포](https://firebase.google.com/docs/hosting/api-deploy), [채널·버전·복구](https://firebase.google.com/docs/hosting/manage-hosting-resources), [Cloud Run rewrite tag](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions#CloudRunRewrite), [GitHub WIF](https://github.com/google-github-actions/auth).
