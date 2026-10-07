import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhoneTranscriptEvent, SessionContextResponse } from "../api/contracts";
import { createPhoneSession, getPhoneSession, renewPhoneSession, cancelPhoneSession, subscribeToPhoneTranscripts, reviewPhoneTranscript } from "../api/phone";
import IntegratedMainPage from "./IntegratedMainPage";
import * as incidentApi from "../api/incidents";
import { getDemoAnalysis } from "../fixtures/demo";

vi.mock("../api/config", () => ({
  apiConfig: { demoEnabled: false, recordEnabled: true, presentationScenarioEnabled: false, speechEnabled: false },
  runtimeDataMode: "LIVE_API",
}));
vi.mock("../api/phone", () => ({
  createPhoneSession: vi.fn(), reviewPhoneTranscript: vi.fn(),
  getPhoneSession: vi.fn(), renewPhoneSession: vi.fn(), cancelPhoneSession: vi.fn(),
  subscribeToPhoneTranscripts: vi.fn(() => ({ close: vi.fn() })),
}));
const session: SessionContextResponse = {
  schemaVersion: "chemicheck119-dashboard-bff-v1", requestId: "REQ-1", userId: "test",
  stationId: "test", stationDisplayName: "테스트 소방서", stationLocation: null,
  roles: ["RESPONDER"], incidentScopes: ["*"],
  issuedAt: "2026-09-21T00:00:00Z", expiresAt: "2026-09-22T00:00:00Z",
};
const finalEvent: PhoneTranscriptEvent = {
  eventId: "TRX-1:r0", incidentId: "INC-PHONE-test", transcriptId: "TRX-1", callId: "CALL-1",
  text: "합성 신고문", language: "ko", isFinal: true, reviewStatus: "FINAL_PENDING_REVIEW",
  revision: 0, segmentIndex: 2, reviewedBy: null, reviewedAt: null, receivedAt: "2026-09-21T01:00:00Z",
};
function CurrentUrl() { return <output aria-label="주소">{useLocation().search}</output>; }
function renderPage(url = "/main") {
  return render(<MemoryRouter initialEntries={[url]}><IntegratedMainPage session={session} /><CurrentUrl /></MemoryRouter>);
}
describe("실통화 전사 복원", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it("복원 주소는 서버 전사를 다시 구독하며 승인 전 분석하지 않는다", () => {
    renderPage("/main?phoneIncident=INC-PHONE-test");
    expect(subscribeToPhoneTranscripts).toHaveBeenCalledWith("INC-PHONE-test", expect.any(Function), expect.any(Function), expect.any(Function));
    const [, receive, failed, connected] = vi.mocked(subscribeToPhoneTranscripts).mock.calls[0];
    act(() => { failed?.(); });
    expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("전사 재연결 중");
    act(() => { connected?.(); receive(finalEvent); });
    expect(screen.getByRole("textbox", { name: "최종 전사 확인" })).toHaveValue("합성 신고문");
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    expect(createPhoneSession).not.toHaveBeenCalled();
  });

  it("새 접수 준비 실패 시 기존 전사와 수정 내용을 보존한다", async () => {
    vi.mocked(createPhoneSession).mockRejectedValueOnce(new Error("준비 실패"));
    renderPage("/main?phoneIncident=INC-PHONE-test");
    act(() => vi.mocked(subscribeToPhoneTranscripts).mock.calls[0][1](finalEvent));
    fireEvent.change(screen.getByRole("textbox", { name: "최종 전사 확인" }), { target: { value: "검토 중 수정문" } });
    fireEvent.click(screen.getByRole("button", { name: "새 전화 접수" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("textbox", { name: "최종 전사 확인" })).toHaveValue("검토 중 수정문");
    expect(screen.getByLabelText("주소")).toHaveTextContent("phoneIncident=INC-PHONE-test");
  });

  it("수신 원문을 보존하고 사용자 선택 후 수정문만 정확한 revision으로 승인한다", async () => {
    const analyze = vi.spyOn(incidentApi, "analyzeIncident").mockResolvedValue(getDemoAnalysis());
    const incoming = { ...finalEvent, text: "염 산이 누출됐습니다." };
    vi.mocked(reviewPhoneTranscript).mockResolvedValueOnce({ ...incoming,
      text: "염산이 누출됐습니다.", revision: 1, eventId: "TRX-1:r1", reviewStatus: "REVIEWED" });
    renderPage("/main?phoneIncident=INC-PHONE-test");
    act(() => vi.mocked(subscribeToPhoneTranscripts).mock.calls[0][1](incoming));
    expect(screen.getByRole("textbox", { name: "최종 전사 확인" })).toHaveValue(incoming.text);
    expect(reviewPhoneTranscript).not.toHaveBeenCalled();
    expect(analyze).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "사고 분석" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "염 산 → 염산 적용" }));
    expect(screen.getByRole("textbox", { name: "최종 전사 확인" })).toHaveValue("염산이 누출됐습니다.");
    expect(screen.getByText(incoming.text, { selector: "p" })).toBeInTheDocument();
    expect(reviewPhoneTranscript).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "이 내용으로 승인" }));
    await waitFor(() => expect(reviewPhoneTranscript).toHaveBeenCalledWith("INC-PHONE-test", "TRX-1", {
      text: "염산이 누출됐습니다.", expectedRevision: 0,
    }));
    expect(await screen.findByRole("button", { name: "사고 분석" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "승인된 신고 내용" })).toHaveValue("염산이 누출됐습니다.");
    fireEvent.click(screen.getByRole("button", { name: "사고 분석" }));
    await waitFor(() => expect(analyze).toHaveBeenCalledWith(expect.objectContaining({
      incidentId: "INC-PHONE-test", text: "염산이 누출됐습니다.",
      phoneTranscriptId: "TRX-1", phoneTranscriptRevision: 1,
    })));
  });

  it("준비가 성공한 뒤에만 복원 주소를 기록한다", async () => {
    vi.mocked(createPhoneSession).mockResolvedValueOnce({
      requestId: "REQ-1", incidentId: "INC-PHONE-new", stationId: "test", stationDisplayName: "테스트 소방서",
      status: "WAITING_FOR_CALL", createdAt: "2026-09-21T01:00:00Z",
    });
    renderPage();
    expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("접수 준비 필요");
    fireEvent.click(screen.getByRole("button", { name: "전화 접수 준비" }));
    await waitFor(() => expect(screen.getByLabelText("주소")).toHaveTextContent("phoneIncident=INC-PHONE-new"));
  });

  it("유효하지 않은 복원 주소로는 구독하지 않는다", () => {
    renderPage("/main?phoneIncident=not-a-phone-incident");
    expect(subscribeToPhoneTranscripts).not.toHaveBeenCalled();
  });

  it("접수 대기를 갱신하며 15분 뒤에도 같은 사고를 유지한다", async () => {
    vi.useFakeTimers();
    const waiting = { requestId: "REQ-1", incidentId: "INC-PHONE-test", stationId: "test",
      stationDisplayName: "테스트 소방서", status: "WAITING_FOR_CALL" as const,
      createdAt: new Date().toISOString(), waitingExpiresAt: new Date(Date.now() + 90_000).toISOString() };
    vi.mocked(getPhoneSession).mockResolvedValue(waiting);
    vi.mocked(renewPhoneSession).mockImplementation(async () => ({ ...waiting,
      waitingExpiresAt: new Date(Date.now() + 90_000).toISOString() }));
    renderPage("/main?phoneIncident=INC-PHONE-test");
    await act(async () => {});
    expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("전화 접수 대기 중");
    await act(async () => { await vi.advanceTimersByTimeAsync(16 * 60_000); });
    expect(renewPhoneSession).toHaveBeenCalledWith("INC-PHONE-test");
    expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("전화 접수 대기 중");
    expect(createPhoneSession).not.toHaveBeenCalled();
  });

  it("갱신 실패·만료 시 수신 가능하다고 표시하지 않는다", async () => {
    vi.useFakeTimers();
    vi.mocked(getPhoneSession).mockResolvedValue({ requestId: "REQ-1", incidentId: "INC-PHONE-test", stationId: "test",
      stationDisplayName: "테스트 소방서", status: "WAITING_FOR_CALL", createdAt: new Date().toISOString(),
      waitingExpiresAt: new Date(Date.now() + 90_000).toISOString() });
    vi.mocked(renewPhoneSession).mockRejectedValue(new Error("offline"));
    renderPage("/main?phoneIncident=INC-PHONE-test");
    await act(async () => { await vi.advanceTimersByTimeAsync(100_000); });
    expect(screen.getByLabelText("전화 연결 상태")).not.toHaveTextContent("전화 접수 대기 중");
    expect(screen.getByRole("button", { name: "전화 접수 준비" })).toBeEnabled();
  });

  it("대기 종료 후 다시 통화 대기로 복원하지 않는다", async () => {
    const waiting = { requestId: "REQ-1", incidentId: "INC-PHONE-test", stationId: "test",
      stationDisplayName: "테스트 소방서", status: "WAITING_FOR_CALL" as const,
      createdAt: new Date().toISOString(), waitingExpiresAt: new Date(Date.now() + 90_000).toISOString() };
    vi.mocked(getPhoneSession).mockResolvedValue(waiting);
    vi.mocked(cancelPhoneSession).mockResolvedValue({ ...waiting, status: "CANCELED", waitingExpiresAt: null });
    renderPage("/main?phoneIncident=INC-PHONE-test");
    fireEvent.click(await screen.findByRole("button", { name: "대기 종료" }));
    await waitFor(() => expect(screen.getByLabelText("전화 연결 상태")).toHaveTextContent("전화 대기 종료"));
    expect(cancelPhoneSession).toHaveBeenCalledWith("INC-PHONE-test");
  });
});
