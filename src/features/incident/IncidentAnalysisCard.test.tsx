import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoAnalysis, makeDemoConfirmation, resetDemoSession } from "../../fixtures/demo";
import { IncidentAnalysisCard } from "./IncidentAnalysisCard";

describe("사고 분석 현장 확인 흐름", () => {
  beforeEach(() => resetDemoSession());
  afterEach(() => cleanup());

  it("두 CAS 확인과 충돌검토를 3단계로 보여주고 역할별 확인 동작을 구분한다", () => {
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} />);

    const workflow = screen.getByRole("region", { name: "현장 확인 3단계" });
    expect(workflow).toHaveTextContent("필수 CAS 0/2 확인");
    expect(workflow).toHaveTextContent("사고물질");
    expect(workflow).toHaveTextContent("시설물질");
    expect(workflow).toHaveTextContent("충돌검토");
    expect(screen.getByRole("button", { name: "사고물질 현장 확인" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "시설물질 현장 확인" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "시설 이력 현장 확인" })).toBeEnabled();
  });

  it("사고물질 확인 후 진행 수와 다음 시설 확인 상태를 갱신한다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} />);

    const workflow = screen.getByRole("region", { name: "현장 확인 3단계" });
    expect(workflow).toHaveTextContent("필수 CAS 1/2 확인");
    expect(screen.queryByRole("button", { name: "사고물질 현장 확인" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시설물질 현장 확인" })).toBeEnabled();
  });
});
