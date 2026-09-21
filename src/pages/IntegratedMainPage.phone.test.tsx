import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhoneTranscriptEvent, SessionContextResponse } from "../api/contracts";
import { createPhoneSession, subscribeToPhoneTranscripts } from "../api/phone";
import IntegratedMainPage from "./IntegratedMainPage";

vi.mock("../api/config", () => ({
  apiConfig: { demoEnabled: false, recordEnabled: true, presentationScenarioEnabled: false, speechEnabled: false },
  runtimeDataMode: "LIVE_API",
}));
vi.mock("../api/phone", () => ({
  createPhoneSession: vi.fn(), reviewPhoneTranscript: vi.fn(),
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
  afterEach(cleanup);

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
});
