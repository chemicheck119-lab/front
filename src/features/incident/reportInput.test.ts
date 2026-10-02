import { describe, expect, it } from "vitest";
import { composeManualReport } from "./reportInput";

describe("기존 수동 사고정보 입력", () => {
  it("작성한 정보만 포함하고 빈 항목을 추정하지 않는다", () => {
    expect(composeManualReport("  합성 신고  ", { incidentType: "", facilityName: " ", facilityAddress: "", observations: [] })).toBe("합성 신고");
  });
  it("사고 유형·시설·위치·관찰정보를 명시적으로 구분한다", () => {
    expect(composeManualReport("합성 신고", { incidentType: "누출", facilityName: "시설 A", facilityAddress: "보관구역", observations: ["연기", "냄새"] })).toBe("합성 신고\n사고 유형: 누출\n시설명: 시설 A\n사고 위치: 보관구역\n현장 관찰: 연기, 냄새");
  });
});
