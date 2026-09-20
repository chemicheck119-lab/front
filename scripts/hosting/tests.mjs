import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertBaseline, assertPinnedConfig, assertStorageBudget, assetPaths, collectBundle, configHash, hostingErrorDetail, mergeAssets, promoteSafely, reuseEquivalentAssets, sha256, SITE, smoke, versionId, versionName } from "./lib.mjs";

const oldVersion = versionName("aaaaaaaaaaaaaaaa"), newVersion = versionName("bbbbbbbbbbbbbbbb");
const config = { rewrites: [
  ...["/api/**", "/auth/**"].map(glob => ({ glob, run: { serviceId: "chemicheck119-be-staging", region: "asia-northeast3", tag: "candidate-fixed" } })),
  { glob: "**", path: "/index.html" },
] };
test("Hosting 오류는 제한된 설명만 기록하고 토큰·제어 문자를 제거한다", () => {
  assert.equal(hostingErrorDetail({ error: { message: "권한 부족\nBearer secret-token ya29.test.token", details: "hidden" } }), "권한 부족 Bearer [REDACTED] [REDACTED]");
  assert.equal(hostingErrorDetail({ error: { message: "x".repeat(1000) } }).length, 800);
  assert.equal(hostingErrorDetail(null), "");
  assert.equal(hostingErrorDetail({ error: { message: {} } }), "");
});
test("고정된 BFF·SPA 설정만 허용한다", () => assert.doesNotThrow(() => assertPinnedConfig(config)));
for (const field of ["tag", "region", "serviceId"]) test(`BFF ${field} 누락 차단`, () => {
  const bad = structuredClone(config); delete bad.rewrites[0].run[field];
  assert.throws(() => assertPinnedConfig(bad));
});
test("다른 site와 경로 삽입 거부", () => {
  assert.throws(() => versionName("../live"));
  assert.throws(() => versionId("sites/other/versions/aaaaaaaaaaaaaaaa"));
});
test("운영이 변경된 후보는 승격하지 않는다", () => {
  assert.throws(() => assertBaseline({ version: { name: newVersion } }, oldVersion));
});
test("이전 asset만 보존하고 index·임의 경로는 덮어쓰지 않는다", () => {
  const hash = sha256("old");
  const result = mergeAssets({ "/index.html": sha256("new") }, [
    { path: "/index.html", hash }, { path: "/assets/old.js", hash }, { path: "/assets/../secret", hash },
  ]);
  assert.equal(result["/index.html"], sha256("new"));
  assert.equal(result["/assets/old.js"], hash);
  assert.equal(Object.keys(result).length, 2);
});
test("immutable asset URL 충돌 거부", () => {
  assert.throws(() => mergeAssets({ "/assets/x.js": sha256("new") }, [{ path: "/assets/x.js", hash: sha256("old") }]));
});
test("gzip hash 차이는 원본이 같다고 확인한 경우에만 기존 blob 재사용", async () => {
  const bundle = { files: { "/assets/a.js": sha256("gzip-new") }, contentHashes: { "/assets/a.js": sha256("same") } };
  const previous = [{ path: "/assets/a.js", hash: sha256("gzip-old") }];
  const files = await reuseEquivalentAssets(bundle, previous, async () => "same");
  assert.equal(files["/assets/a.js"], previous[0].hash);
  await assert.rejects(reuseEquivalentAssets(bundle, previous, async () => "different"), /원본 내용 변경/);
});
test("파일 수 비용 상한 초과 차단", () => {
  assert.throws(() => mergeAssets(Object.fromEntries(Array.from({ length: 2001 }, (_, i) => [`/${i}`, sha256("x")])), []));
});
test("파일 크기를 확인할 수 없거나 보존 포함 128 MiB 초과 시 차단", () => {
  assert.throws(() => assertStorageBudget(undefined, 100));
  assert.throws(() => assertStorageBudget(128 * 1024 * 1024, 1));
  assert.doesNotThrow(() => assertStorageBudget(1000, 2000));
});
test("설정 객체의 키 순서는 동일성 판정에 영향을 주지 않는다", () => {
  assert.equal(configHash({ a: 1, b: { x: 2, y: 3 } }), configHash({ b: { y: 3, x: 2 }, a: 1 }));
});
test("HTML의 JS·CSS 참조 검사", () => {
  assert.deepEqual(assetPaths('<script src="/assets/a.js"></script><link href="/assets/a.css">'), ["/assets/a.js", "/assets/a.css"]);
  assert.throws(() => assetPaths("<html>error</html>"));
});
test("번들 SHA-256은 재현 가능하고 symlink·자격증명을 배포하지 않는다", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hosting-test-"));
  try {
    await writeFile(join(dir, "index.html"), "<html>test</html>");
    const a = await collectBundle(dir), b = await collectBundle(dir);
    assert.deepEqual(a.files, b.files);
    await writeFile(join(dir, "gha-creds-test.json"), "fake");
    await assert.rejects(collectBundle(dir), /자격증명/);
    await rm(join(dir, "gha-creds-test.json"));
    await symlink(join(dir, "index.html"), join(dir, "link"));
    await assert.rejects(collectBundle(dir), /symlink/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

function fakeApi(initial = oldVersion, lostResponse = false) {
  let live = initial;
  const writes = [];
  const api = async (path, method = "GET") => {
    if (method === "GET") return { releases: [{ version: { name: live } }] };
    live = new URL(path, "https://example.test/").searchParams.get("versionName");
    writes.push(live);
    if (lostResponse && live === newVersion) throw new Error("response lost");
    return {};
  };
  return { api, writes, setLive: (name) => { live = name; } };
}
test("검증 성공 시 한 번만 전환", async () => {
  const f = fakeApi();
  await promoteSafely({ api: f.api, target: newVersion, expected: oldVersion, check: async () => {} });
  assert.deepEqual(f.writes, [newVersion]);
});
test("승격 전 stale 감지는 운영 POST 0회", async () => {
  const f = fakeApi(newVersion);
  await assert.rejects(promoteSafely({ api: f.api, target: newVersion, expected: oldVersion, check: async () => {} }));
  assert.equal(f.writes.length, 0);
});
for (const lost of [false, true]) test(`smoke 실패 또는 응답 유실 시 복구 (응답 유실=${lost})`, async () => {
  const f = fakeApi(oldVersion, lost);
  await assert.rejects(promoteSafely({ api: f.api, target: newVersion, expected: oldVersion, check: async () => { throw new Error("smoke"); } }), /복구 확인/);
  assert.deepEqual(f.writes, [newVersion, oldVersion]);
});
test("외부에서 새 배포가 들어왔으면 복구로 덮어쓰지 않는다", async () => {
  const f = fakeApi();
  await assert.rejects(promoteSafely({ api: f.api, target: newVersion, expected: oldVersion, check: async () => {
    f.setLive(`${SITE}/versions/cccccccccccccccc`); throw new Error("changed");
  } }), /덮어쓰지 않았습니다/);
  assert.deepEqual(f.writes, [newVersion]);
});
for (const failure of ["none", "index", "asset", "catalog", "timeout"]) test(`HTTP smoke ${failure} 검증`, async (context) => {
  const html = '<script src="/assets/a.js"></script><link href="/assets/a.css">';
  context.mock.method(globalThis, "fetch", async (url) => {
    if (failure === "timeout") throw new Error("timeout");
    const path = new URL(url).pathname;
    if (path.endsWith("stations")) return Response.json(failure === "catalog" ? {} : { schemaVersion: "chemicheck119-fire-station-catalog-v1", regions: [{}] });
    if (path.startsWith("/assets/")) return new Response("asset", { headers: { "content-type": failure === "asset" ? "text/html" : path.endsWith("js") ? "text/javascript" : "text/css" } });
    return new Response(html);
  });
  const task = smoke("https://chemicheck119.site", failure === "index" ? "wrong" : sha256(html));
  if (failure === "none") assert.equal((await task).assets.length, 2);
  else await assert.rejects(task);
});
test("임의 도메인으로 smoke 요청을 전송하지 않는다", async () => {
  await assert.rejects(smoke("https://attacker.example"), /허용되지/);
});
