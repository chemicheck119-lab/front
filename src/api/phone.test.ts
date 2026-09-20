import { describe, expect, it } from "vitest";
import { parsePhoneTranscriptEvent } from "./phone";

function event(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    eventId: "TRX-1:r0",
    incidentId: "INC-1",
    transcriptId: "TRX-1",
    callId: "CALL-1",
    text: "염소 누출 의심",
    language: "ko",
    isFinal: false,
    reviewStatus: "INTERIM",
    revision: 0,
    segmentIndex: 1,
    reviewedBy: null,
    reviewedAt: null,
    receivedAt: "2026-09-20T08:00:00Z",
    ...overrides,
  });
}

describe("phone transcript SSE validation", () => {
  it("accepts a coherent server event", () => {
    expect(parsePhoneTranscriptEvent(event(), "INC-1")).toMatchObject({
      eventId: "TRX-1:r0",
      reviewStatus: "INTERIM",
      revision: 0,
    });
  });

  it("rejects another incident and forged event id", () => {
    expect(() => parsePhoneTranscriptEvent(event(), "INC-OTHER")).toThrow();
    expect(() => parsePhoneTranscriptEvent(event({ eventId: "TRX-OTHER:r0" }), "INC-1")).toThrow();
  });

  it("rejects final content labeled as interim", () => {
    expect(() => parsePhoneTranscriptEvent(event({ isFinal: true }), "INC-1")).toThrow();
  });

  it("accepts reviewed final content with an exact revision id", () => {
    expect(parsePhoneTranscriptEvent(event({
      eventId: "TRX-1:r1",
      isFinal: true,
      reviewStatus: "REVIEWED",
      revision: 1,
      reviewedBy: "reviewer-1",
      reviewedAt: "2026-09-20T08:01:00Z",
    }), "INC-1").reviewStatus).toBe("REVIEWED");
  });
});
