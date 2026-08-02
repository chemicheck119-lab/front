import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { endAuthenticatedSession, getAuthenticatedSession } from "./auth";
import { apiConfig } from "./config";

const originalConfig = { ...apiConfig };

function successfulResponse() {
  return {
    ok: true,
    status: 204,
    headers: { get: vi.fn().mockReturnValue(null) },
    json: vi.fn().mockRejectedValue(new SyntaxError("No content")),
  } as unknown as Response;
}

function sessionResponse() {
  return {
    ok: true,
    status: 200,
    headers: { get: vi.fn().mockReturnValue(null) },
    json: vi.fn().mockResolvedValue({
      schemaVersion: "chemicheck119-dashboard-bff-v1",
      requestId: "REQ-SESSION-1",
      userId: "responder-1",
      stationId: "station-seoul-119",
      stationDisplayName: "서울 테스트 소방서",
      roles: ["RESPONDER"],
      incidentScopes: ["*"],
      issuedAt: "2026-08-01T12:00:00Z",
      expiresAt: "2026-08-01T20:00:00Z",
    }),
  } as unknown as Response;
}

describe("사용 종료 인증 연동", () => {
  beforeEach(() => {
    Object.assign(apiConfig, { ...originalConfig, baseUrl: "https://bff.example.test" });
  });

  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("인증 미사용 모드에서는 BE 로그아웃을 호출하지 않는다", async () => {
    apiConfig.authEnabled = false;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await endAuthenticatedSession();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("인증 모드에서는 세션 쿠키를 포함해 BE 로그아웃을 호출한다", async () => {
    apiConfig.authEnabled = true;
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    await endAuthenticatedSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("운영 진입 전에 BE가 검증한 사용자·소방서 세션을 조회한다", async () => {
    apiConfig.authEnabled = true;
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal("fetch", fetchMock);

    const session = await getAuthenticatedSession();

    expect(session).toMatchObject({
      userId: "responder-1",
      stationId: "station-seoul-119",
      stationDisplayName: "서울 테스트 소방서",
      roles: ["RESPONDER"],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/session",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });
});
