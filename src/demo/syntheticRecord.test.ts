import { describe, expect, it } from "vitest";
import type { IncidentReplayEnvelope } from "../api/intake";
import { buildPublicSyntheticRecord, publicSyntheticRecordFileName } from "./syntheticRecord";

const replay = {
  incidentId: "INC/DEMO 1",
  sourceEventId: "EVENT-1",
  facilityName: "공개 합성 사업장",
  addressText: "경기도 화성시",
  reportText: "공개 합성 신고",
  receivedAt: "2026-08-02T12:00:00+09:00",
} as IncidentReplayEnvelope;

describe("공개 합성 기록 내보내기", () => {
  it("운영 기록이 아니라는 경계와 필요한 감사 ID를 포함한다", () => {
    const record = buildPublicSyntheticRecord(
      replay,
      [{ messageId: "M-1", role: "SYSTEM", text: "시연", createdAt: replay.receivedAt }],
      ["ANL-1"],
      ["CONF-1", "CONF-2"],
      "2026-08-02T12:05:00+09:00",
    );

    expect(record).toMatchObject({
      dataClassification: "PUBLIC_SYNTHETIC",
      operationalRecord: false,
      generatedAt: "2026-08-02T12:05:00+09:00",
      analysisIds: ["ANL-1"],
      confirmationIds: ["CONF-1", "CONF-2"],
    });
    expect(record.disclosure).toContain("서버에 저장되지 않습니다");
    expect(publicSyntheticRecordFileName(replay.incidentId)).toBe("chemicheck119-INC-DEMO-1-public-synthetic.json");
  });
});
