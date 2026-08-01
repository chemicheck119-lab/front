import { describe, expect, it } from "vitest";
import { demoAnalysis, getDemoAnalysis, resetDemoSession, makeDemoConfirmation } from "../../fixtures/demo";
import { analysisStateLabel, canShowRisk, getConfirmationWorkflow } from "./analysisState";

describe("현장 확인 게이트", () => {
  it("물질 확인 전에는 충돌 위험을 표시하지 않는다", () => {
    resetDemoSession();
    expect(canShowRisk(demoAnalysis)).toBe(false);
    expect(analysisStateLabel(demoAnalysis.state)).toBe("물질 확인 대기");
  });

  it("사고·시설 CAS 두 개가 확인되고 규칙이 실행된 뒤에만 위험을 표시한다", () => {
    resetDemoSession();
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    expect(canShowRisk(getDemoAnalysis())).toBe(false);
    makeDemoConfirmation("FACILITY", "7647-01-0");
    expect(canShowRisk(getDemoAnalysis())).toBe(true);
    resetDemoSession();
  });

  it("하위 규칙 결과가 완료돼도 응답 최상위 공개 플래그가 닫혀 있으면 숨긴다", () => {
    resetDemoSession();
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    makeDemoConfirmation("FACILITY", "7647-01-0");
    const response = getDemoAnalysis();
    response.riskDisplayAllowed = false;

    expect(canShowRisk(response)).toBe(false);
    resetDemoSession();
  });

  it("사고물질 → 시설물질 → 충돌검토 순서의 현장 체크포인트를 계산한다", () => {
    resetDemoSession();
    expect(getConfirmationWorkflow(getDemoAnalysis()).map((step) => step.status)).toEqual(["CURRENT", "CURRENT", "LOCKED"]);

    makeDemoConfirmation("INCIDENT", "7681-52-9");
    expect(getConfirmationWorkflow(getDemoAnalysis()).map((step) => step.status)).toEqual(["COMPLETED", "CURRENT", "LOCKED"]);

    makeDemoConfirmation("FACILITY", "7647-01-0");
    expect(getConfirmationWorkflow(getDemoAnalysis()).map((step) => step.status)).toEqual(["COMPLETED", "COMPLETED", "COMPLETED"]);
    resetDemoSession();
  });
});
