import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

export const PROJECT = "chemi-check";
export const SITE = "sites/chemi-check";
export const LIVE_ORIGIN = "https://chemicheck119.site";
export const API = "https://firebasehosting.googleapis.com/v1beta1/";
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function configHash(value) {
  const ordered = (v) => Array.isArray(v) ? v.map(ordered)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((key) => [key, ordered(v[key])])) : v;
  return sha256(JSON.stringify(ordered(value)));
}
export function assert(value, message) { if (!value) throw new Error(message); }
export function versionName(id) {
  assert(/^[a-z0-9]{8,64}$/.test(id ?? ""), "유효한 Hosting version ID가 필요합니다.");
  return `${SITE}/versions/${id}`;
}
export function versionId(name) {
  const id = name?.split("/").at(-1);
  assert(versionName(id) === name, "다른 사이트의 version은 사용할 수 없습니다.");
  return id;
}
export function assertPinnedConfig(config) {
  for (const path of ["/api/**", "/auth/**"]) {
    const run = config?.rewrites?.find((rule) => rule.glob === path)?.run;
    assert(run?.serviceId === "chemicheck119-be-staging" && run.region === "asia-northeast3"
      && /^[a-z0-9-]+$/.test(run.tag ?? ""), "현재 BFF rewrite의 고정 tag를 확인할 수 없습니다.");
  }
  assert(config.rewrites.some((r) => r.glob === "**" && r.path === "/index.html"), "SPA fallback이 필요합니다.");
}
export function assertBaseline(live, expected) {
  assert(live.version?.name === expected, "운영 버전이 변경됐습니다. 최신 운영 기준으로 다시 준비하세요.");
}
export function mergeAssets(current, previous) {
  const files = { ...current };
  for (const file of previous) {
    if (!/^\/assets\/[A-Za-z0-9_./-]+$/.test(file.path) || file.path.includes("..")) continue;
    assert(/^[a-f0-9]{64}$/.test(file.hash), "기존 asset hash가 유효하지 않습니다.");
    assert(!files[file.path] || files[file.path] === file.hash, "같은 asset URL의 내용 변경을 차단했습니다.");
    files[file.path] = file.hash;
  }
  assert(Object.keys(files).length <= 2000, "보존 파일 2,000개 한도 초과: 보존 정책을 검토하세요.");
  return files;
}
export async function reuseEquivalentAssets(bundle, previous, fetchBytes = async (path) => {
  const response = await fetch(`${LIVE_ORIGIN}${path}`, { signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store" });
  assert(response.ok, "기존 asset 내용 확인 실패");
  return new Uint8Array(await response.arrayBuffer());
}) {
  const files = { ...bundle.files };
  for (const file of previous) {
    if (!/^\/assets\/[A-Za-z0-9_./-]+$/.test(file.path) || file.path.includes("..") || !files[file.path] || files[file.path] === file.hash) continue;
    // gzip 라이브러리·설정이 다르면 같은 원본도 압축 hash가 다를 수 있다.
    // 원본 hash가 같을 때만 서버가 이미 가진 압축 파일을 재사용한다.
    assert(sha256(await fetchBytes(file.path)) === bundle.contentHashes[file.path], "같은 asset URL의 원본 내용 변경을 차단했습니다.");
    files[file.path] = file.hash;
  }
  return files;
}
export function assertStorageBudget(baseBytes, newBytes) {
  assert(Number.isFinite(Number(baseBytes)) && Number(baseBytes) >= 0
    && Number(baseBytes) + newBytes <= 128 * 1024 * 1024, "보존 포함 번들 128 MiB 상한 초과 또는 크기 미확인");
}

export async function collectBundle(directory) {
  const files = {}, contentHashes = {}, blobs = new Map();
  let bytes = 0;
  async function visit(dir, prefix = "") {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), "배포 디렉터리의 symlink는 허용하지 않습니다.");
      assert(!entry.name.startsWith(".") && !/^(gha-creds-|firebase-debug)/.test(entry.name)
        && !entry.name.endsWith(".map"), "자격증명·숨김 파일·source map은 배포하지 않습니다.");
      const path = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await visit(join(dir, entry.name), path);
      else {
        const raw = await readFile(join(dir, entry.name));
        bytes += raw.length;
        assert(bytes <= 64 * 1024 * 1024, "새 번들 64 MiB 한도 초과");
        const gzip = gzipSync(raw, { level: 9 });
        const hash = sha256(gzip);
        files[path] = hash;
        contentHashes[path] = sha256(raw);
        blobs.set(hash, gzip);
      }
    }
  }
  await visit(directory);
  assert(files["/index.html"], "dist/hosting/index.html이 없습니다.");
  assert(Object.keys(files).length <= 1000, "새 번들 파일 수 한도 초과");
  return { files, contentHashes, blobs, bytes };
}

export function hostingErrorDetail(body) {
  // Google의 오류 설명만 한 줄로 제한한다. 요청 헤더·자격증명·전체 응답은 기록하지 않는다.
  const message = body?.error?.message;
  if (typeof message !== "string") return "";
  return message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/ya29\.[A-Za-z0-9._~-]+/g, "[REDACTED]")
    .replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 800);
}

export function hostingClient() {
  // 토큰을 파일·콘솔에 출력하지 않는다. WIF 자격증명은 setup-gcloud가 연결한다.
  const token = execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  return async function api(path, method = "GET", body) {
    const url = new URL(path, API);
    assert(url.origin === new URL(API).origin && url.pathname.startsWith("/v1beta1/sites/chemi-check/"), "허용되지 않은 Hosting 경로");
    const response = await fetch(url, {
      method, headers: { Authorization: `Bearer ${token}`, "x-goog-user-project": PROJECT, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect: "error",
    });
    if (!response.ok) {
      const detail = hostingErrorDetail(await response.json().catch(() => null));
      throw new Error(`Hosting API ${method} ${url.pathname}: HTTP ${response.status}${detail ? ` — ${detail}` : ""}`);
    }
    return response.json();
  };
}
export async function uploadBlobs(uploadUrl, hashes, blobs) {
  assert(new URL(uploadUrl).origin === "https://upload-firebasehosting.googleapis.com"
    && new URL(uploadUrl).pathname.startsWith("/upload/sites/chemi-check/versions/"), "잘못된 upload URL");
  const token = execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  for (let i = 0; i < hashes.length; i += 4) {
    await Promise.all(hashes.slice(i, i + 4).map(async (hash) => {
      assert(/^[a-f0-9]{64}$/.test(hash) && blobs.has(hash), "기존 asset을 재사용할 수 없습니다. 운영 전환 없이 중단합니다.");
      const response = await fetch(`${uploadUrl}/${hash}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "x-goog-user-project": PROJECT },
        body: blobs.get(hash), signal: AbortSignal.timeout(60000), redirect: "error",
      });
      assert(response.ok, `asset 업로드 실패: HTTP ${response.status}`);
    }));
  }
}
export async function liveRelease(api) {
  const data = await api(`${SITE}/channels/live/releases?pageSize=1`);
  const release = data.releases?.[0];
  assert(release?.version?.name && release.type !== "SITE_DISABLE", "현재 운영 release가 없습니다.");
  return release;
}
export async function allFiles(api, version) {
  versionId(version);
  const files = [];
  let next = "";
  do {
    const page = await api(`${version}/files?status=ACTIVE&pageSize=1000${next ? `&pageToken=${encodeURIComponent(next)}` : ""}`);
    files.push(...(page.files ?? []));
    assert(files.length <= 2000, "기존 파일 보존 한도 초과");
    next = page.nextPageToken;
  } while (next);
  return files;
}
export async function createPreview(api, version, channel) {
  assert(/^ci-[0-9]+-[0-9]+(?:-rollback)?$/.test(channel), "CI 실행별 고유 channel ID가 필요합니다.");
  const created = await api(`${SITE}/channels?channelId=${channel}`, "POST", { ttl: "604800s" });
  await api(`${SITE}/channels/${channel}/releases?versionName=${encodeURIComponent(version)}`, "POST", { message: `CI preview ${versionId(version)}` });
  const url = new URL(created.url);
  assert(url.protocol === "https:" && /^chemi-check--[a-z0-9-]+\.web\.app$/.test(url.hostname), "미리보기 origin이 유효하지 않습니다.");
  return url.origin;
}
export function assetPaths(html) {
  const paths = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
  assert(paths.some((p) => p.endsWith(".js")) && paths.some((p) => p.endsWith(".css")), "JS/CSS asset 참조가 없는 HTML");
  return [...new Set(paths)];
}
export async function smoke(origin, expectedHash) {
  const url = new URL(origin);
  assert(origin === LIVE_ORIGIN || (url.protocol === "https:" && /^chemi-check--[a-z0-9-]+\.web\.app$/.test(url.hostname)), "허용되지 않은 smoke origin");
  const get = async (path) => {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store" });
    assert(response.ok, `smoke ${path}: HTTP ${response.status}`);
    return response;
  };
  const index = await (await get("/")).text();
  const indexHash = sha256(index);
  if (expectedHash) assert(indexHash === expectedHash, "공개 HTML이 검증한 버전과 다릅니다.");
  for (const path of ["/features", "/public-data", "/trends"]) {
    assert(sha256(await (await get(path)).text()) === indexHash, `${path} SPA fallback 불일치`);
  }
  for (const path of assetPaths(index)) {
    assert(/^\/assets\/[A-Za-z0-9_.-]+$/.test(path), "잘못된 asset 경로");
    const response = await get(path);
    const type = response.headers.get("content-type") ?? "";
    assert(path.endsWith(".js") ? /javascript/.test(type) : /text\/css/.test(type), "asset 요청에 HTML 등이 반환됐습니다.");
    await response.arrayBuffer();
  }
  const catalog = await (await get("/auth/staging/pilot/stations")).json();
  assert(catalog.schemaVersion === "chemicheck119-fire-station-catalog-v1" && catalog.regions?.length > 0, "소방서 조회 BFF 계약 불일치");
  return { origin, indexHash, assets: assetPaths(index), checkedAt: new Date().toISOString(), scope: "HTTP·정적 asset·SPA·소방서 GET만 검증; 로그인·지도·전사 E2E 제외" };
}

// 새 채널 생성 직후의 전파 지연만 기다린다. 배포 POST·검증 기준은 바꾸지 않는다.
export async function smokePreview(origin, expectedHash, {
  check = smoke,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  const url = new URL(origin);
  assert(url.protocol === "https:" && /^chemi-check--[a-z0-9-]+\.web\.app$/.test(url.hostname), "새 미리보기에만 전파 대기를 허용합니다.");
  const delays = [2000, 4000, 8000, 16000, 30000];
  for (let attempt = 0; ; attempt++) {
    try {
      return { ...await check(origin, expectedHash), previewAttempts: attempt + 1 };
    } catch (error) {
      if (attempt >= delays.length || !/^smoke (?:\/|\/assets\/[A-Za-z0-9_.-]+): HTTP (?:404|503)$/.test(error.message ?? "")) throw error;
      await wait(delays[attempt]);
    }
  }
}

export async function checkRetainedAssets(paths) {
  for (const path of paths) {
    assert(/^\/assets\/[A-Za-z0-9_.-]+$/.test(path), "기존 asset 경로가 유효하지 않습니다.");
    const response = await fetch(`${LIVE_ORIGIN}${path}`, { method: "HEAD", signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store" });
    assert(response.ok && !(response.headers.get("content-type") ?? "").includes("text/html"), "이미 열린 화면의 이전 asset을 제공할 수 없습니다.");
  }
}

export async function promoteSafely({ api, target, expected, check }) {
  assertBaseline(await liveRelease(api), expected);
  let switched = false;
  try {
    // POST 재시도 금지. 응답 유실 시에도 실제 live를 읽고 복구 여부를 판정한다.
    await api(`${SITE}/channels/live/releases?versionName=${encodeURIComponent(target)}`, "POST", { message: `승인 배포 ${versionId(target)}` });
    switched = true;
    await check();
    assertBaseline(await liveRelease(api), target);
  } catch (error) {
    const now = await liveRelease(api);
    if (now.version.name === target) {
      await api(`${SITE}/channels/live/releases?versionName=${encodeURIComponent(expected)}`, "POST", { message: `검증 실패 복구 ${versionId(expected)}` });
      assertBaseline(await liveRelease(api), expected);
      throw new Error(`배포 검증 실패, 이전 version 복구 확인. 원인: ${error.message}`);
    }
    throw new Error(`${switched ? "배포 후" : "전환 중"} 실패. 다른 운영 version을 덮어쓰지 않았습니다: ${error.message}`);
  }
}
