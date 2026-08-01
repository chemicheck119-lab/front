import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, userFacingError } from "./client";
import { apiConfig } from "./config";

const originalConfig = { ...apiConfig };

function failedResponse(status: number, code: string, requestId = "REQ-TEST-001") {
  return {
    ok: false,
    status,
    headers: { get: vi.fn().mockReturnValue(null) },
    json: vi.fn().mockResolvedValue({
      requestId,
      error: { code, message: "서버 상세 메시지", retryable: status >= 500 },
    }),
  } as unknown as Response;
}

describe("BFF 오류 매핑", () => {
  beforeEach(() => {
    Object.assign(apiConfig, { ...originalConfig, baseUrl: "https://bff.example.test" });
  });

  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it.each([
    [401, "UNAUTHORIZED", "AUTH"],
    [422, "CONFIRMATION_REQUIRED", "CONFIRMATION_REQUIRED"],
    [503, "INSUFFICIENT_EVIDENCE", "NO_EVIDENCE"],
    [503, "ROUTE_UNAVAILABLE", "NO_ROUTE"],
    [503, "PROFILE_INDEX_NOT_AVAILABLE", "NOT_READY"],
    [422, "INVALID_REQUEST", "VALIDATION"],
  ] as const)("HTTP %s / %s를 %s 상태로 구분한다", async (status, code, kind) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failedResponse(status, code)));

    await expect(apiRequest("/test")).rejects.toMatchObject({ kind, requestId: "REQ-TEST-001" });
  });

  it("사용자 메시지에는 내부 상세 대신 안전한 문구와 request ID만 표시한다", () => {
    const message = userFacingError(new ApiError("NO_ROUTE", "provider secret failure", "REQ-MAP-9"));

    expect(message).toBe("도로 경로를 불러올 수 없습니다. (요청 ID: REQ-MAP-9)");
    expect(message).not.toContain("secret");
  });
});
