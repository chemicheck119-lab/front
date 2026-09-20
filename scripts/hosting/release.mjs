import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { allFiles, assert, assertBaseline, assertPinnedConfig, assertStorageBudget, checkRetainedAssets, collectBundle, configHash, createPreview, hostingClient, liveRelease, mergeAssets, promoteSafely, reuseEquivalentAssets, sha256, SITE, LIVE_ORIGIN, smoke, uploadBlobs, versionId, versionName } from "./lib.mjs";

const mode = process.argv[2];
assert(["preview", "promote", "rollback", "inspect"].includes(mode), "preview / promote / rollback / inspect 중 하나를 선택하세요.");
const api = hostingClient();
const baseline = await liveRelease(api);
const base = await api(baseline.version.name);
assertPinnedConfig(base.config);
const output = async (result) => {
  await mkdir("deployment-evidence", { recursive: true });
  await writeFile("deployment-evidence/result.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## Hosting ${mode}\n\n운영 변경: ${mode === "promote" || mode === "rollback" ? "승인된 전환 수행" : "없음"}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`);
};
if (mode === "inspect") {
  await output({ liveVersion: versionId(base.name), release: baseline.name, configHash: configHash(base.config) });
} else {
  assert(process.env.GITHUB_REF === "refs/heads/develop" && process.env.GITHUB_REPOSITORY === "chemicheck119-lab/front", "배포는 front/develop GitHub Actions에서만 실행합니다.");
  const run = process.env.GITHUB_RUN_ID, attempt = process.env.GITHUB_RUN_ATTEMPT;
  assert(/^\d+$/.test(run ?? "") && /^\d+$/.test(attempt ?? ""), "실행 식별자가 필요합니다.");
  if (mode === "preview") {
    const commit = process.env.GITHUB_SHA;
    assert(/^[a-f0-9]{40}$/.test(commit ?? ""), "commit SHA가 필요합니다.");
    const bundle = await collectBundle("dist/hosting");
    assertStorageBudget(base.versionBytes, bundle.bytes);
    const channels = await api(`${SITE}/channels?pageSize=100`);
    assert(!channels.nextPageToken && (channels.channels ?? []).filter((c) => c.name.includes("/channels/ci-")
      && new Date(c.expireTime).getTime() > Date.now()).length < 10, "CI 미리보기 10개 한도: 만료를 기다리거나 보존 정책을 검토하세요.");
    const previous = await allFiles(api, base.name);
    const files = mergeAssets(await reuseEquivalentAssets(bundle, previous), previous);
    const channel = `ci-${run}-${attempt}`;
    const version = await api(`${SITE}/versions`, "POST", {
      config: base.config, labels: { "managed-by": "front-actions", commit, "base-version": versionId(base.name), channel },
    });
    versionId(version.name);
    const upload = await api(`${version.name}:populateFiles`, "POST", { files });
    await uploadBlobs(upload.uploadUrl, upload.uploadRequiredHashes ?? [], bundle.blobs);
    const finalized = await api(`${version.name}?updateMask=status`, "PATCH", { status: "FINALIZED" });
    assert(finalized.status === "FINALIZED", "Hosting version 마무리 실패");
    const origin = await createPreview(api, version.name, channel);
    const report = await smoke(origin, sha256(await readFile("dist/hosting/index.html")));
    assertBaseline(await liveRelease(api), base.name);
    await output({ status: "preview-verified", version: versionId(version.name), expectedLiveVersion: versionId(base.name), commit,
      previewUrl: origin, configHash: configHash(base.config), manifestHash: sha256(JSON.stringify(files)),
      newBytes: bundle.bytes, retainedAssetCount: Object.keys(files).length - Object.keys(bundle.files).length, ...report });
  } else {
    const target = versionName(process.env.TARGET_VERSION);
    const expected = versionName(process.env.EXPECTED_LIVE_VERSION);
    assertBaseline(baseline, expected);
    assert(target !== expected, "이미 운영 중인 version입니다.");
    const candidate = await api(target);
    assert(candidate.status === "FINALIZED", "FINALIZED version만 승격할 수 있습니다.");
    assertPinnedConfig(candidate.config);
    let origin;
    if (mode === "promote") {
      assert(candidate.labels?.["managed-by"] === "front-actions", "이 파이프라인이 만든 후보가 아닙니다.");
      assert(candidate.labels?.["base-version"] === versionId(expected), "오래된 운영 기준으로 만든 후보입니다.");
      assert(configHash(candidate.config) === configHash(base.config), "미리보기 이후 Hosting/BFF 설정 변경 감지");
      const channel = candidate.labels?.channel;
      assert(/^ci-\d+-\d+$/.test(channel ?? ""), "후보 channel이 유효하지 않습니다.");
      const state = await api(`${SITE}/channels/${channel}`);
      assert(state.release?.version?.name === target, "미리보기 version이 바뀌었거나 만료됐습니다.");
      origin = state.url;
    } else {
      // 과거 live에 실제 올라간 version만 복구 대상으로 허용한다.
      const history = await api(`${SITE}/channels/live/releases?pageSize=100`);
      assert(history.releases?.some((r) => r.version?.name === target && r.type !== "SITE_DISABLE"), "최근 운영 이력 100건에 없는 복구 대상");
      origin = await createPreview(api, target, `ci-${run}-${attempt}-rollback`);
    }
    const before = await smoke(origin);
    // 수동 복구는 현재 사이트가 고장 난 경우에도 실행할 수 있어야 한다.
    const prior = mode === "promote" ? await smoke(LIVE_ORIGIN) : null;
    await output({ status: "release-preflight", target: versionId(target), expectedLiveVersion: versionId(expected), previewUrl: origin });
    await promoteSafely({ api, target, expected, check: async () => {
      // 전파 지연에만 최대 3회 검증. 전환 POST는 반복하지 않는다.
      let last;
      for (let i = 0; i < 3; i++) {
        try {
          await smoke(LIVE_ORIGIN, before.indexHash);
          if (prior) await checkRetainedAssets(prior.assets);
          return;
        }
        catch (error) { last = error; if (i < 2) await new Promise((resolve) => setTimeout(resolve, 5000)); }
      }
      throw last;
    } }).catch(async (error) => {
      if (prior && (await liveRelease(api)).version.name === expected) await smoke(LIVE_ORIGIN, prior.indexHash);
      throw error;
    });
    await output({ status: "live-verified", version: versionId(target), previousVersion: versionId(expected), ...before, origin: LIVE_ORIGIN });
  }
}
