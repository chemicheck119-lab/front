import { afterEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "./config";
import { cancelConfirmation } from "./confirmations";

const originalConfig = { ...apiConfig };

describe("현장 확인 취소 client", () => {
  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("encoded incident·confirmation ID와 역할을 DELETE 경로로 보낸다", async () => {
    Object.assign(apiConfig, {
      baseUrl: "https://bff.example.test",
      authEnabled: true,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: vi.fn().mockReturnValue("REQ-CANCEL-1") },
      json: vi.fn().mockResolvedValue({
        schemaVersion: "chemicheck119-dashboard-bff-v1",
        requestId: "REQ-CANCEL-1",
        incidentId: "INC A/1",
        confirmationId: "CFM A/1",
        role: "FACILITY",
        status: "CANCELLED",
        cancelledAt: "2026-09-08T00:00:00Z",
        reanalyzeRequired: true,
      }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelConfirmation("INC A/1", "FACILITY", "CFM A/1"))
      .resolves.toMatchObject({ status: "CANCELLED", reanalyzeRequired: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/incidents/INC%20A%2F1/confirmations/FACILITY/CFM%20A%2F1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
