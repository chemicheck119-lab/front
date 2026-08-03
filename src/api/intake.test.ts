import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "./config";
import {
  confirmSyntheticReplaySubstance,
  parseIncidentReplayEnvelope,
  parseIncidentReplaySse,
  parseSyntheticReplayConfirmation,
  receiveContestIncident,
} from "./intake";

const originalConfig = { ...apiConfig };
const envelope = {
  schemaVersion: "chemicheck119-incident-envelope-v1",
  incidentId: "INC-PUBLIC-1",
  sourceEventId: "SYNTHETIC-DISPATCH-1",
  idempotencyKey: "PUBLIC-REPLAY:1",
  receivedAt: "2026-08-02T03:04:05.678Z",
  occurredAt: "2026-08-02T03:03:20.678Z",
  stationId: "STATION-PUBLIC-DEMO",
  stationDisplayName: "공개 시연 소방서",
  facilityName: "공개 합성 사업장",
  addressText: "경기도 화성시 팔탄면",
  location: { latitude: 37.159, longitude: 126.904 },
  reportText: "차아염소산나트륨 저장탱크 누출 의심, 인접 저장고에 염산 표기",
  sourceType: "SYNTHETIC_DISPATCH_REPLAY",
  dataClassification: "PUBLIC_SYNTHETIC",
  sourceProvider: "CHEMICHECK119_PUBLIC_REPLAY",
  sourceSchemaVersion: "public-replay-v1",
  requestId: "REQ-REPLAY-1",
  containsPersonalInformation: false,
  disclosure: "실제 119 신고가 아닌 개인정보 없는 공개 합성 지령입니다.",
  datasetReferences: [{ name: "소방안전 빅데이터 플랫폼", url: "https://bigdata-119.kr/", usage: "공개 데이터 구조 참고" }],
} as const;

function response(body: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: vi.fn().mockReturnValue("REQ-REPLAY-1") },
    text: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

const syntheticConfirmation = {
  schemaVersion: "chemicheck119-synthetic-replay-confirmation-v1",
  requestId: "REQ-SYNTHETIC-CONFIRM-1",
  incidentId: "INC-PUBLIC-1",
  confirmationId: "CFM-SYNTHETIC-1",
  role: "INCIDENT",
  casNumber: "7681-52-9",
  displayName: "차아염소산나트륨",
  dataClassification: "PUBLIC_SYNTHETIC",
  confirmationType: "SYNTHETIC_DEMO_CONFIRMATION",
  createdAt: "2026-08-02T03:04:06Z",
  confirmedCount: 1,
  allRequiredConfirmed: false,
  reanalyzeRequired: true,
  disclosure: "실제 대원 확인이 아닌 공개 합성 시연용 현장 확인입니다.",
} as const;

describe("공개 합성 지령 SSE", () => {
  beforeEach(() => {
    Object.assign(apiConfig, { ...originalConfig, baseUrl: "https://bff.example.test", authEnabled: false });
  });

  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("incident.accepted event의 공개 합성 경계를 검증한다", () => {
    const parsed = parseIncidentReplaySse(
      `id:SYNTHETIC-DISPATCH-1\nevent:incident.accepted\nretry:5000\ndata:${JSON.stringify(envelope)}\n\n`,
    );

    expect(parsed.sourceEventId).toBe("SYNTHETIC-DISPATCH-1");
    expect(parsed.dataClassification).toBe("PUBLIC_SYNTHETIC");
    expect(parsed.containsPersonalInformation).toBe(false);
  });

  it("공식 지령 또는 개인정보 포함 응답처럼 보이는 envelope를 차단한다", () => {
    expect(() => parseIncidentReplayEnvelope({
      ...envelope,
      sourceType: "AUTHORIZED_DISPATCH",
      dataClassification: "AUTHORIZED_OPERATIONAL",
      containsPersonalInformation: true,
    })).toThrow(/출처·개인정보 경계/);
  });

  it("BE SSE endpoint에서 지령을 수신하고 인증 미사용 환경에서는 쿠키를 보내지 않는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(
      `event:incident.accepted\ndata:${JSON.stringify(envelope)}\n\n`,
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(receiveContestIncident()).resolves.toMatchObject({
      incidentId: "INC-PUBLIC-1",
      dataClassification: "PUBLIC_SYNTHETIC",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/intake/replay-stream/CONTEST-LIVE-CHEMICAL-001",
      expect.objectContaining({
        method: "GET",
        credentials: "omit",
        headers: { Accept: "text/event-stream" },
      }),
    );
  });

  it("replay가 비활성화된 404를 가짜 local 성공으로 바꾸지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("", 404)));

    await expect(receiveContestIncident()).rejects.toMatchObject({ kind: "NOT_READY" });
  });

  it("본문 없이 replay incident와 역할만 보내 합성 확인을 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: vi.fn().mockReturnValue("REQ-SYNTHETIC-CONFIRM-1") },
      json: vi.fn().mockResolvedValue(syntheticConfirmation),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(confirmSyntheticReplaySubstance("INC-PUBLIC-1", "INCIDENT"))
      .resolves.toMatchObject({ casNumber: "7681-52-9", confirmedCount: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/intake/replays/INC-PUBLIC-1/confirmations/INCIDENT",
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
      }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("body");
  });

  it("서버가 역할에 맞지 않는 CAS 또는 공식 확인처럼 보이는 값을 보내면 차단한다", () => {
    expect(() => parseSyntheticReplayConfirmation({
      ...syntheticConfirmation,
      casNumber: "50-00-0",
      confirmationType: "OFFICIAL_FIELD_CONFIRMATION",
    }, "INC-PUBLIC-1", "INCIDENT")).toThrow(/incident·물질·출처 경계/);
  });
});
