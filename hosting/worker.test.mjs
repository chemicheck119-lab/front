import { describe, expect, it, vi } from "vitest";
import worker from "./worker.mjs";

function assetsWith(responses) {
  return {
    fetch: vi.fn(async (request) => responses.get(new URL(request.url).pathname) ?? new Response("missing", { status: 404 })),
  };
}

describe("Sites 정적 SPA worker", () => {
  it("존재하는 정적 파일을 그대로 제공한다", async () => {
    const assets = assetsWith(new Map([["/assets/app.js", new Response("app", { status: 200 })]]));
    const response = await worker.fetch(new Request("https://example.test/assets/app.js"), { ASSETS: assets });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("app");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(assets.fetch).toHaveBeenCalledOnce();
  });

  it("브라우저의 SPA 경로는 index.html로 되돌린다", async () => {
    const assets = assetsWith(new Map([["/index.html", new Response("dashboard", { status: 200 })]]));
    const request = new Request("https://example.test/incidents/INC-1", { headers: { accept: "text/html" } });
    const response = await worker.fetch(request, { ASSETS: assets });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("dashboard");
    expect(assets.fetch).toHaveBeenCalledTimes(2);
  });

  it("정적 파일 404를 HTML로 바꾸지 않는다", async () => {
    const assets = assetsWith(new Map());
    const response = await worker.fetch(new Request("https://example.test/assets/missing.js"), { ASSETS: assets });

    expect(response.status).toBe(404);
    expect(assets.fetch).toHaveBeenCalledOnce();
  });
});
