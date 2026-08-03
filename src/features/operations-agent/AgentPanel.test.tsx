import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../../fixtures/demo";
import { AgentPanel, getAgentMilestones, PHASE_LABELS } from "./AgentPanel";

describe("현장대응 에이전트 패널", () => {
  it("계약의 phase와 다음 행동을 사람이 이해할 수 있게 표시한다", () => {
    const { container } = render(<AgentPanel agent={demoAnalysis.agent} />);
    const panel = within(container).getByRole("region", { name: "에이전트 진행 현황" });
    const timeline = within(panel).getByRole("list", { name: "에이전트 작업 진행" });
    expect(within(panel).getByText(PHASE_LABELS.EN_ROUTE_TRIAGE)).toBeInTheDocument();
    expect(within(panel).getByText("최신 단계 반영")).toBeInTheDocument();
    expect(within(timeline).getByText("신고문 구조화")).toHaveClass("text-emerald-700");
    fireEvent.click(within(panel).getByRole("button", { name: "다음 행동·도구 실행 기록" }));
    expect(within(panel).getByText(/용기 라벨 또는 현장 MSDS/)).toBeInTheDocument();
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
    const { container } = render(<AgentPanel agent={demoAnalysis.agent} syntheticMode />);
    expect(within(container).getByText("통합 데모 에이전트")).toBeInTheDocument();
    expect(within(container).getByText("합성 확인 게이트")).toBeInTheDocument();
  });

  it("첫 분석 응답 전에도 현재 처리 단계와 후속 대기를 표시한다", () => {
    const { container } = render(<AgentPanel agent={null} loading />);
    const timeline = within(container).getByRole("list", { name: "에이전트 작업 진행" });
    expect(within(container).getByText("서버 검증 중")).toBeInTheDocument();
    expect(within(timeline).getByText("분석 요청 전송")).toHaveClass("text-blue-700");
    expect(within(timeline).getByText("신고문 구조화")).toBeInTheDocument();
    expect(within(timeline).getByText("RuleEngine 실행 조건 검사")).toBeInTheDocument();
  });
});
