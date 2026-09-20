import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoAnalysis, resetDemoSession } from "../fixtures/demo";
import IntegratedMainPage from "./IntegratedMainPage";

vi.mock("../api/config", () => ({
  apiConfig: { demoEnabled: true, recordEnabled: true, presentationScenarioEnabled: false, speechEnabled: false },
  runtimeDataMode: "DEMO_SIMULATION",
}));

describe("전화 신고에서 현장 확인까지", () => {
  beforeEach(() => resetDemoSession());
  afterEach(() => cleanup());

  it("최종 전사 승인과 두 CAS 확인을 거치고, 다음 통화에는 이전 결과를 넘기지 않는다", async () => {
    render(<MemoryRouter><IntegratedMainPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 시작" }));
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 종료" }));
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "사고시설" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "현장 도구" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "사고물질 합성 확인" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("합성 확인 1/2"));
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "시설물질 합성 확인" }));
    await screen.findByRole("region", { name: "충돌 검토 결과" });
    fireEvent.click(screen.getByRole("button", { name: "대응 기록" }));
    fireEvent.change(screen.getByRole("textbox", { name: "시설명 필수" }), { target: { value: "합성 시연시설" } });

    fireEvent.click(screen.getByRole("button", { name: "상황실 · 신고 접수" }));
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 시작" }));
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "시설명 필수" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(getDemoAnalysis().confirmationGate.allRequiredConfirmed).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "합성 통화 종료" }));
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    expect(screen.getByRole("status")).toHaveTextContent("합성 확인 0/2");
    fireEvent.click(screen.getByRole("button", { name: "대응 기록" }));
    expect(screen.getByRole("textbox", { name: "시설명 필수" })).toHaveValue("");
  });
});
