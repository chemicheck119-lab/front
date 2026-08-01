import { afterEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "./config";
import { analyzeIncident, normalizeIncidentAnalyzeRequest } from "./incidents";

const originalConfig = { ...apiConfig };

describe("Demo와 Live API 경계", () => {
  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("명시적인 Demo 모드에서만 fixture를 사용한다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(apiConfig, { demoEnabled: true, baseUrl: "" });

    const response = await analyzeIncident({ incidentId: "INC-DEMO-TEST", text: "시연 신고" });

    expect(response.incidentId).toBe("INC-DEMO-TEST");
    expect(response.agent?.mapContext.route.status).toBe("DEMO_SIMULATION");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Live API 장애를 Demo fixture로 자동 대체하지 않는다", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(apiConfig, { demoEnabled: false, baseUrl: "https://bff.example.test" });

    await expect(analyzeIncident({ incidentId: "INC-LIVE-TEST", text: "실제 신고" }))
      .rejects.toMatchObject({ kind: "NETWORK" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("화면 입력을 고정 OpenAPI의 필수 기본값이 있는 요청으로 정규화한다", () => {
    expect(normalizeIncidentAnalyzeRequest({ text: "신고 내용" })).toEqual({
      text: "신고 내용",
      inputType: "MANUAL_TEXT",
      evidenceTopK: 5,
    });
  });
});
