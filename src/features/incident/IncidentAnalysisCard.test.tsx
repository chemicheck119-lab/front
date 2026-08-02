import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoAnalysis, makeDemoConfirmation, resetDemoSession } from "../../fixtures/demo";
import { IncidentAnalysisCard } from "./IncidentAnalysisCard";

describe("사고 분석 현장 확인 흐름", () => {
  beforeEach(() => resetDemoSession());
  afterEach(() => cleanup());

  it("신고문만 입력하면 후보와 출처를 표시하되 충돌 규칙은 실행하지 않는다", () => {
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} />);

    const workflow = screen.getByRole("region", { name: "현장 확인 3단계" });
    expect(workflow).toHaveTextContent("필수 CAS 0/2 확인");
    expect(workflow).toHaveTextContent("사고물질");
    expect(workflow).toHaveTextContent("시설물질");
    expect(workflow).toHaveTextContent("충돌검토");
    const fieldSummary = screen.getByRole("region", { name: "현장 핵심 정보" });
    expect(fieldSummary).toHaveTextContent("차아염소산나트륨");
    expect(fieldSummary).toHaveTextContent("염산");
    expect(fieldSummary).toHaveTextContent("검토 잠김");
    expect(fieldSummary).toHaveTextContent("임의 판단 금지");
    expect(screen.getByRole("button", { name: "사고물질 현장 확인" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "시설물질 현장 확인" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "시설 이력 현장 확인" })).toBeEnabled();
    expect(screen.getByText("소방안전 빅데이터 기반 후보")).toBeInTheDocument();
    expect(screen.getByText("ICIS·PRTR 과거 취급 이력")).toBeInTheDocument();
    expect(screen.getByText("KOSHA MSDS 근거")).toBeInTheDocument();
    expect(screen.getByText("현장 확인 필요")).toBeInTheDocument();
    expect(screen.queryByText("NOAA CAMEO 충돌 규칙")).not.toBeInTheDocument();
  });

  it("사고물질 CAS만 확인하면 시설물질 확인을 기다리고 충돌 규칙은 실행하지 않는다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} />);

    const workflow = screen.getByRole("region", { name: "현장 확인 3단계" });
    expect(workflow).toHaveTextContent("필수 CAS 1/2 확인");
    expect(screen.queryByRole("button", { name: "사고물질 현장 확인" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "시설물질 현장 확인" })).toBeEnabled();
    expect(screen.queryByText("NOAA CAMEO 충돌 규칙")).not.toBeInTheDocument();
  });

  it("두 CAS를 모두 확인한 뒤에만 CAMEO 충돌 규칙과 위험·근거·최종 판단을 공개한다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    makeDemoConfirmation("FACILITY", "7647-01-0");
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} />);

    const workflow = screen.getByRole("region", { name: "현장 확인 3단계" });
    expect(workflow).toHaveTextContent("필수 CAS 2/2 확인");
    expect(screen.getByText("NOAA CAMEO 충돌 규칙")).toBeInTheDocument();
    expect(screen.queryByText("현장 확인 필요")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "현장 핵심 정보" })).toHaveTextContent("높음");
    expect(screen.getByRole("region", { name: "충돌 검토 결과" })).toHaveTextContent("높음");
    expect(screen.getByRole("region", { name: "충돌 검토 결과" })).toHaveTextContent("현장 지휘관 판단");
  });

  it("공개 합성 시연 확인을 실제 현장 확인으로 표시하지 않는다", () => {
    makeDemoConfirmation("INCIDENT", "7681-52-9");
    makeDemoConfirmation("FACILITY", "7647-01-0");
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} confirmationMode="PUBLIC_SYNTHETIC" />);

    expect(screen.getByRole("region", { name: "현장 확인 3단계" })).toHaveTextContent("공개 합성 확인 게이트");
    expect(screen.getByRole("region", { name: "현장 확인 3단계" })).toHaveTextContent("필수 CAS 2/2 합성 확인");
    expect(screen.getAllByText("합성 확인 완료").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("현장 확인됨")).not.toBeInTheDocument();
  });

  it("공개 합성 시연의 잠금 안내와 다음 행동을 운영 현장 기록처럼 표현하지 않는다", () => {
    render(<IncidentAnalysisCard analysis={getDemoAnalysis()} onConfirm={vi.fn()} confirmingRole={null} confirmationMode="PUBLIC_SYNTHETIC" />);

    expect(screen.getByText("합성 확인 게이트 검증 단계입니다.")).toBeInTheDocument();
    expect(screen.getByText("합성 QA 다음 단계")).toBeInTheDocument();
    expect(screen.getByText(/공개 합성 사고물질 확인 API/)).toBeInTheDocument();
    expect(screen.queryByText("대원이 해야 할 일")).not.toBeInTheDocument();
  });
});
