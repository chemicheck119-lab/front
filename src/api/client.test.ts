import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, toUserFacingError, userFacingError } from "./client";
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

function successfulResponse(body: unknown = { ok: true }) {
  return {
    ok: true,
    status: 200,
    headers: { get: vi.fn().mockReturnValue(null) },
    json: vi.fn().mockResolvedValue(body),
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
    [401, "UNAUTHORIZED", "SESSION_EXPIRED"],
    [403, "FORBIDDEN", "AUTH"],
    [422, "CONFIRMATION_REQUIRED", "CONFIRMATION_REQUIRED"],
    [503, "INSUFFICIENT_EVIDENCE", "NO_EVIDENCE"],
    [503, "ROUTE_UNAVAILABLE", "NO_ROUTE"],
    [503, "PROFILE_INDEX_NOT_AVAILABLE", "NOT_READY"],
    [422, "INVALID_REQUEST", "VALIDATION"],
    [409, "INCIDENT_REFERENCE_CONFLICT", "CONFLICT"],
    [422, "MODEL_CONTRACT_VIOLATION", "SERVER"],
    [503, "MODEL_SERVICE_UNAVAILABLE", "SERVICE_UNAVAILABLE"],
    [504, "MODEL_TIMEOUT", "TIMEOUT"],
    [504, "ROUTE_UNAVAILABLE", "NO_ROUTE"],
  ] as const)("HTTP %s / %s를 %s 상태로 구분한다", async (status, code, kind) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failedResponse(status, code)));

    await expect(apiRequest("/test")).rejects.toMatchObject({ kind, requestId: "REQ-TEST-001" });
  });

  it("인증 사용 환경의 BFF 요청에 사용자 세션 쿠키 전송을 명시한다", async () => {
    apiConfig.authEnabled = true;
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/test", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenCalledWith("https://bff.example.test/test", expect.objectContaining({
      credentials: "include",
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
  });

  it("인증 미사용 환경의 BFF 요청은 브라우저 인증 정보를 보내지 않는다", async () => {
    apiConfig.authEnabled = false;
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/test", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenCalledWith("https://bff.example.test/test", expect.objectContaining({
      credentials: "omit",
      method: "POST",
    }));
  });

  it("호출부가 명시한 credentials 설정은 덮어쓰지 않는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/public", { credentials: "omit" });

    expect(fetchMock).toHaveBeenCalledWith("https://bff.example.test/public", expect.objectContaining({ credentials: "omit" }));
  });

  it("사용자 메시지에는 내부 상세 대신 안전한 문구와 request ID만 표시한다", () => {
    const message = userFacingError(new ApiError("NO_ROUTE", "provider secret failure", "REQ-MAP-9"));

    expect(message).toBe("도로 경로를 불러올 수 없습니다. (요청 ID: REQ-MAP-9)");
    expect(message).not.toContain("secret");
  });

  it("BFF timeout과 일시 장애를 사용자 행동이 가능한 문구로 구분한다", () => {
    expect(userFacingError(new ApiError("TIMEOUT", "internal timeout", "REQ-TIME-1", true)))
      .toBe("응답 시간이 초과되었습니다. 다시 시도해주세요. (요청 ID: REQ-TIME-1)");
    expect(userFacingError(new ApiError("SERVICE_UNAVAILABLE", "upstream unavailable", "REQ-UP-1", true)))
      .toBe("분석 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요. (요청 ID: REQ-UP-1)");
  });

  it("retryable 503은 한 번만 자동 재시도하고 request ID를 보존한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(failedResponse(503, "MODEL_SERVICE_UNAVAILABLE", "REQ-RETRY-1"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/retry-test")).rejects.toMatchObject({ kind: "SERVICE_UNAVAILABLE", requestId: "REQ-RETRY-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("안전 검증 실패는 결과 비공개 오류로 변환한다", () => {
    const issue = toUserFacingError(new ApiError("SAFETY", "internal details", "REQ-SAFE-1"));

    expect(issue.message).toContain("결과 카드를 표시하지 않습니다");
    expect(issue.requestId).toBe("REQ-SAFE-1");
    expect(issue.message).not.toContain("internal details");
  });

  it("401은 진행 화면을 보존해야 하는 세션 만료 상태로 구분한다", () => {
    const issue = toUserFacingError(new ApiError("SESSION_EXPIRED", "internal auth details", "REQ-AUTH-1"));

    expect(issue.kind).toBe("SESSION_EXPIRED");
    expect(issue.message).toContain("세션이 만료");
    expect(issue.requestId).toBe("REQ-AUTH-1");
    expect(issue.retryable).toBe(false);
  });
});
