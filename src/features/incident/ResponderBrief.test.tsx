import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoAnalysis, makeDemoConfirmation, resetDemoSession } from "../../fixtures/demo";
import { ResponderBrief } from "./ResponderBrief";

beforeEach(resetDemoSession);
afterEach(cleanup);

function renderBrief(overrides: Partial<React.ComponentProps<typeof ResponderBrief>> = {}) {
  const props: React.ComponentProps<typeof ResponderBrief> = {
    analysis: getDemoAnalysis(), busy: false, synthetic: false, confirmedMaterials: {}, confirmationIds: {}, onConfirm: vi.fn(), onCancel: vi.fn(), ...overrides,
  };
  render(<ResponderBrief {...props} />);
  return props;
}

function completeAnalysis() {
  makeDemoConfirmation("INCIDENT", "7681-52-9");
  makeDemoConfirmation("FACILITY", "7647-01-0");
  return getDemoAnalysis();
}

describe("현장 중심의 단순 브리프", () => {
  it("확인 전에는 물질 2개와 다음 확인만 보여주고 결과·근거 요약을 숨긴다", () => {
    const props = renderBrief();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("물질 2개를 확인하세요");
    expect(screen.getByRole("status")).toHaveTextContent("0/2");
    expect(screen.getByText(/아래는 물질 후보/)).toBeVisible();
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    expect(screen.queryByText("대응 근거")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "사고물질 현장 확인" }));
    expect(props.onConfirm).toHaveBeenCalledExactlyOnceWith("INCIDENT", "7681-52-9", "차아염소산나트륨");
  });

  it("한쪽만 확인해도 위험은 잠기고 남은 물질이 제목에 표시된다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    renderBrief({ analysis: getDemoAnalysis(), confirmedMaterials: { INCIDENT: { casNumber: "7681-52-9", displayName: "차아염소산나트륨" } } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("시설물질을 확인하세요");
    expect(screen.queryByRole("button", { name: "사고물질 현장 확인" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시설물질 현장 확인" })).toBeEnabled();
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
  });

  it("두 확인과 서버 검토 완료 후에는 위험·다음 행동에 집중하고 상세를 접는다", () => {
    renderBrief({ analysis: completeAnalysis(), confirmedMaterials: { INCIDENT: { casNumber: "7681-52-9", displayName: "차아염소산나트륨" }, FACILITY: { casNumber: "7647-01-0", displayName: "염산" } } });
    expect(screen.getByRole("region", { name: "충돌 검토 결과" })).toHaveTextContent("높음");
    expect(screen.getByLabelText("반응 검토 물질")).toHaveTextContent("차아염소산나트륨 × 염산");
    expect(screen.getByRole("region", { name: "충돌 검토 결과" })).toHaveTextContent("안전을 보장하지 않습니다");
    const actions = screen.getByRole("region", { name: "다음 현장 확인" });
    expect(within(actions).getAllByRole("listitem")).toHaveLength(3);
    expect(actions).toHaveTextContent("최종 판단은 현장 지휘관");
    expect(screen.getByRole("group", { name: "근거와 제한사항" })).not.toHaveAttribute("open");
    expect(screen.getByRole("group", { name: "확인한 물질" })).not.toHaveAttribute("open");
  });

  it("allRequiredConfirmed와 개별 확인값이 모순이면 결과를 노출하지 않는다", () => {
    const analysis = completeAnalysis();
    analysis.confirmationGate.facilityConfirmed = false;
    renderBrief({ analysis });
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    expect(screen.queryByText("높음")).not.toBeInTheDocument();
    expect(screen.queryByText("대응 근거")).not.toBeInTheDocument();
  });

  it.each(["VERIFY_REQUIRED", "UNCLASSIFIED", "CAMEO_GROUP_SCREENING_ONLY"] as const)("%s는 확인 완료와 구분하고 위험 등급을 만들지 않는다", (state) => {
    const analysis = completeAnalysis();
    analysis.state = state;
    analysis.riskDisplayAllowed = false;
    analysis.conflictReview = { executed: true, status: state, riskDisplayAllowed: false, result: { kind: "INCONCLUSIVE_RESULT", reason: "공식 근거와 현장 조건을 추가로 확인해주세요." } };
    renderBrief({ analysis });
    expect(screen.getByRole("heading", { name: "안전하다는 뜻이 아닙니다" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
  });

  it("여러 후보가 있으면 첫 후보를 자동 선택하지 않는다", () => {
    const analysis = getDemoAnalysis();
    analysis.substanceCandidates[0].candidates.push({ casNumber: "10043-52-4", rankingScoreIsProbability: false });
    const props = renderBrief({ analysis });
    expect(screen.getByRole("button", { name: "사고물질 현장 확인" })).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "사고물질 CAS 선택" }), { target: { value: "10043-52-4" } });
    fireEvent.click(screen.getByRole("button", { name: "사고물질 현장 확인" }));
    expect(props.onConfirm).toHaveBeenCalledExactlyOnceWith("INCIDENT", "10043-52-4", "차아염소산나트륨");
  });

  it("확인된 물질은 후보의 첫 순위가 아니라 실제 선택 기록으로 보여준다", () => {
    makeDemoConfirmation("INCIDENT", "10043-52-4");
    const props = renderBrief({ analysis: getDemoAnalysis(), confirmedMaterials: { INCIDENT: { casNumber: "10043-52-4", displayName: "확인한 다른 후보" } }, confirmationIds: { INCIDENT: "CFM-2" } });
    const material = screen.getByRole("region", { name: "사고물질 확인" });
    expect(material).toHaveTextContent("10043-52-4");
    expect(material).not.toHaveTextContent("7681-52-9");
    fireEvent.click(within(material).getByRole("button", { name: "확인 취소·다시 확인" }));
    expect(props.onCancel).toHaveBeenCalledExactlyOnceWith("INCIDENT", "CFM-2");
  });

  it("과거 시설 이력은 현재 보관 사실로 표시하지 않는다", () => {
    const analysis = getDemoAnalysis();
    analysis.substanceCandidates = analysis.substanceCandidates.filter((item) => item.role !== "FACILITY");
    renderBrief({ analysis });
    expect(screen.getByRole("region", { name: "시설물질 확인" })).toHaveTextContent("과거 취급 이력입니다. 현재 보관 여부를 확인하세요.");
  });

  it("합성 확인은 실제 현장 확인으로 표현하지 않는다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    renderBrief({ analysis: getDemoAnalysis(), synthetic: true, confirmationIds: { INCIDENT: "DEMO" } });
    expect(screen.getByText("합성 확인 완료")).toBeVisible();
    expect(screen.getByRole("button", { name: "시설물질 합성 확인" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "확인 취소·다시 확인" })).not.toBeInTheDocument();
  });
});
