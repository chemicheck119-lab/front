import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../../fixtures/demo";
import { AgentPanel, PHASE_LABELS } from "./AgentPanel";

describe("현장대응 에이전트 패널", () => {
  it("계약의 phase와 다음 행동을 사람이 이해할 수 있게 표시한다", () => {
    render(<AgentPanel agent={demoAnalysis.agent} />);
    expect(screen.getByText(PHASE_LABELS.EN_ROUTE_TRIAGE)).toBeInTheDocument();
    expect(screen.getByText(/용기 라벨 또는 현장 MSDS/)).toBeInTheDocument();
    expect(screen.getByText("절차 조율")).toBeInTheDocument();
  });
});
