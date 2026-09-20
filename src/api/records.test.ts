import { afterEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "./config";
import { makeDemoRecordDetail, makeDemoRecordList } from "../fixtures/demo";
import { getIncidentRecord, listIncidentRecords, shouldResetAfterSave } from "./records";

const originalConfig = { ...apiConfig };

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: vi.fn().mockReturnValue("REQ-RECORDS-1") },
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => {
  Object.assign(apiConfig, originalConfig);
  vi.unstubAllGlobals();
});

describe("대응 기록 저장", () => {
  it("서버가 resetAllowed=true를 반환한 성공 응답에서만 초기화를 허용한다", () => {
    expect(shouldResetAfterSave({ resetAllowed: true })).toBe(true);
    expect(shouldResetAfterSave({ resetAllowed: false as true })).toBe(false);
  });
});

describe("대응 기록 조회", () => {
  it("목록은 GET /records를 세션 쿠키와 함께 호출하고 records 배열만 돌려준다", async () => {
    Object.assign(apiConfig, { baseUrl: "https://bff.example.test", authEnabled: true, demoEnabled: false });
    const records = [{ recordId: "REC-1", incidentId: "INC-1", facilityName: null, incidentSubstanceName: null, briefApplicationStatus: "APPLIED", finalResponseOutcome: "LEAK_STOPPED", savedAt: "2026-09-16T21:08:00Z" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ schemaVersion: "chemicheck119-dashboard-bff-v1", requestId: "REQ-RECORDS-1", records }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listIncidentRecords()).resolves.toEqual(records);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/records",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("상세는 recordId를 인코딩해 GET /records/{recordId}로 호출한다", async () => {
    Object.assign(apiConfig, { baseUrl: "https://bff.example.test", authEnabled: true, demoEnabled: false });
    const detail = { recordId: "REC A/1", messages: [] };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detail));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getIncidentRecord("REC A/1")).resolves.toEqual(detail);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/records/REC%20A%2F1",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("데모 모드에서는 네트워크 호출 없이 데모 기록을 돌려준다", async () => {
    Object.assign(apiConfig, { demoEnabled: true });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const list = await listIncidentRecords();
    expect(list.length).toBeGreaterThan(0);
    const detail = await getIncidentRecord(list[0].recordId);
    expect(detail.recordId).toBe(list[0].recordId);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("데모 상세는 선택한 목록 행과 같은 물질·CAS·시설을 돌려준다", () => {
    const expectedCas: Record<string, string> = { "REC-DEMO-0001": "7681-52-9", "REC-DEMO-0002": "7647-01-0" };
    for (const summary of makeDemoRecordList()) {
      const detail = makeDemoRecordDetail(summary.recordId);
      expect(detail.recordId).toBe(summary.recordId);
      expect(detail.facilityName).toBe(summary.facilityName);
      expect(detail.incidentSubstanceName).toBe(summary.incidentSubstanceName);
      expect(detail.incidentSubstanceCas).toBe(expectedCas[summary.recordId]);
      if (detail.conflictRisk) expect(detail.conflictRisk.incidentCas).toBe(detail.incidentSubstanceCas);
    }
  });
});
