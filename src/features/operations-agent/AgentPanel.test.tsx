import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../../fixtures/demo";
import { AgentPanel, getAgentMilestones, PHASE_LABELS } from "./AgentPanel";

describe("현장대응 에이전트 패널", () => {
  it("계약의 phase와 다음 행동을 사람이 이해할 수 있게 표시한다", () => {
    render(<AgentPanel agent={demoAnalysis.agent} />);
    expect(screen.getByText(PHASE_LABELS.EN_ROUTE_TRIAGE)).toBeInTheDocument();
    expect(screen.getByText(/용기 라벨 또는 현장 MSDS/)).toBeInTheDocument();
    expect(screen.getByText("절차 조율")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "에이전트 4단계 진행" })).toBeInTheDocument();
  });

  it("서버 workflow를 신고 분석부터 충돌 검토까지 4단계로 축약한다", () => {
    const milestones = getAgentMilestones(demoAnalysis.agent!);

    expect(milestones.map(({ label, status }) => [label, status])).toEqual([
      ["신고 분석", "COMPLETED"],
      ["후보 탐색", "COMPLETED"],
      ["현장 확인", "IN_PROGRESS"],
      ["충돌 검토", "BLOCKED"],
    ]);
  });

  it("공개 시연에서는 완료된 합성 확인을 현장 확인으로 오인시키지 않는다", () => {
    render(<AgentPanel agent={demoAnalysis.agent} syntheticMode />);
    expect(screen.getByText("통합 데모 에이전트")).toBeInTheDocument();
    expect(screen.getByText("합성 확인")).toBeInTheDocument();
  });
});
