import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDemoAnalysis, resetDemoSession } from "../fixtures/demo";
import IntegratedMainPage from "./IntegratedMainPage";
import * as incidentApi from "../api/incidents";

vi.mock("../api/config", () => ({
  apiConfig: { demoEnabled: true, recordEnabled: true, presentationScenarioEnabled: false, speechEnabled: false },
  runtimeDataMode: "DEMO_SIMULATION",
}));

describe("전화 신고에서 현장 확인까지", () => {
  beforeEach(() => resetDemoSession());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("최종 전사 승인과 두 CAS 확인을 거치고, 다음 통화에는 이전 결과를 넘기지 않는다", async () => {
    render(<MemoryRouter><IntegratedMainPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 시작" }));
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 종료" }));
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "최종 전사 확인" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("분석 완료");
    expect(screen.getByRole("textbox", { name: "승인된 신고 내용" })).toHaveAttribute("readonly");
    for (const name of ["현재 사고정보", "초기 대응 분석", "AI 현장 대응 지원"]) expect(screen.getByRole("region", { name })).toBeVisible();
    expect(screen.queryByRole("region", { name: "사고시설" })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "현장 도구" })).not.toBeVisible();
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "사고물질 합성 확인" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("합성 확인 1/2"));
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "시설물질 합성 확인" }));
    await screen.findByRole("region", { name: "충돌 검토 결과" });
    fireEvent.click(screen.getByRole("button", { name: "기록 저장" }));
    fireEvent.change(screen.getByRole("textbox", { name: "시설명 필수" }), { target: { value: "합성 시연시설" } });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 시작" }));
    expect(screen.queryByRole("region", { name: "충돌 검토 결과" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "시설명 필수" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "시설명" })).toHaveValue("");
    expect(getDemoAnalysis().confirmationGate.allRequiredConfirmed).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "합성 통화 종료" }));
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    expect(screen.getByRole("status")).toHaveTextContent("합성 확인 0/2");
    fireEvent.click(screen.getByRole("button", { name: "기록 저장" }));
    expect(screen.getByRole("textbox", { name: "시설명 필수" })).toHaveValue("");
  });

  it("기존 사고 입력 항목을 수동 신고와 함께 보내고 확인 재요청에도 같은 신고를 쓴다", async () => {
    const analyze = vi.spyOn(incidentApi, "analyzeIncident");
    render(<MemoryRouter><IntegratedMainPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "누출" }));
    fireEvent.change(screen.getByRole("textbox", { name: "시설명" }), { target: { value: "합성시설" } });
    fireEvent.change(screen.getByRole("textbox", { name: "사고 위치" }), { target: { value: "시연 보관구역" } });
    fireEvent.click(screen.getByRole("button", { name: "연기" }));
    fireEvent.change(screen.getByPlaceholderText("신고 내용과 확인된 상황을 입력하세요…"), { target: { value: "용기 누출 신고" } });
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    const text = "용기 누출 신고\n사고 유형: 누출\n시설명: 합성시설\n사고 위치: 시연 보관구역\n현장 관찰: 연기";
    expect(analyze).toHaveBeenLastCalledWith(expect.objectContaining({ inputType: "MANUAL_TEXT", text }));
    fireEvent.click(screen.getByRole("button", { name: "사고물질 합성 확인" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1/2"));
    expect(analyze).toHaveBeenLastCalledWith(expect.objectContaining({ text }));
  });

  it("전화 분석에는 별도 입력한 기록용 시설정보를 섞지 않고 승인문만 보낸다", async () => {
    const analyze = vi.spyOn(incidentApi, "analyzeIncident");
    render(<MemoryRouter><IntegratedMainPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 시작" }));
    expect(screen.getByRole("button", { name: "누출" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "합성 통화 종료" }));
    fireEvent.change(screen.getByRole("textbox", { name: "최종 전사 확인" }), { target: { value: "담당자가 확인한 합성 신고문" } });
    fireEvent.change(screen.getByRole("textbox", { name: "시설명" }), { target: { value: "기록용 시설" } });
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await screen.findByRole("button", { name: "사고물질 합성 확인" });
    expect(analyze).toHaveBeenLastCalledWith(expect.objectContaining({ inputType: "PHONE_TRANSCRIPT", text: "담당자가 확인한 합성 신고문" }));
  });
});
