import { describe, expect, it } from "vitest";
import { contestLiveScenario } from "./presentationScenario";

describe("공모전 Live 합성 신고", () => {
  it("합성 입력과 실제 처리 경계를 명시한다", () => {
    expect(contestLiveScenario.dataClassification).toBe("PUBLIC_SYNTHETIC");
    expect(contestLiveScenario.sourceType).toBe("SYNTHETIC_DISPATCH_REPLAY");
    expect(contestLiveScenario.processingPath).toBe("LIVE_BFF_AI");
    expect(contestLiveScenario.disclosure).toContain("공개 합성 신고");
    expect(contestLiveScenario.disclosure).toContain("실제 배포된 BE·AI");
  });

  it("실제 사람·기관을 사고 당사자로 오인할 식별자를 사용하지 않는다", () => {
    expect(contestLiveScenario.facilityName).toBe("공개 합성 사업장");
    expect(contestLiveScenario.scenarioId).toMatch(/^CONTEST-LIVE-/);
    expect(contestLiveScenario.text.length).toBeGreaterThan(10);
  });
});
