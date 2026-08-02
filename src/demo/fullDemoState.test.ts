import { describe, expect, it } from "vitest";
import { fullDemoSteps, fullDemoStatusLabel, isFullDemoRunning } from "./fullDemoState";

describe("3분 완성형 시연 상태", () => {
  it("0/2, 1/2, 2/2와 CAMEO 순서를 고정한다", () => {
    expect(fullDemoSteps("INITIAL_ANALYSIS").map((step) => step.state))
      .toEqual(["COMPLETED", "ACTIVE", "PENDING", "PENDING", "PENDING"]);
    expect(fullDemoSteps("INCIDENT_REANALYSIS")[2]).toMatchObject({
      state: "ACTIVE",
      detail: "합성 1/2 검증",
    });
    expect(fullDemoSteps("FINAL_ANALYSIS")[4]).toMatchObject({
      state: "ACTIVE",
      detail: "서버 규칙 실행",
    });
    expect(fullDemoSteps("COMPLETED").every((step) => step.state === "COMPLETED")).toBe(true);
    expect(fullDemoSteps("ERROR", "FACILITY_CONFIRMATION").map((step) => step.state))
      .toEqual(["COMPLETED", "COMPLETED", "COMPLETED", "ERROR", "PENDING"]);
  });

  it("완료와 오류에서는 실행 잠금을 해제한다", () => {
    expect(isFullDemoRunning("RECEIVING")).toBe(true);
    expect(isFullDemoRunning("COMPLETED")).toBe(false);
    expect(isFullDemoRunning("ERROR")).toBe(false);
    expect(fullDemoStatusLabel("COMPLETED")).toBe("통합 데모 완료");
  });
});
