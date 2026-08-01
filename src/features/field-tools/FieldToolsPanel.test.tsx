import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoAnalysis } from "../../fixtures/demo";
import {
  countUnsavedRecordItems,
  FieldToolsPanel,
  normalizePhoneHref,
  type FieldRecordMessage,
} from "./FieldToolsPanel";

const messages: FieldRecordMessage[] = [
  { messageId: "M-1", role: "SYSTEM", text: "신고 대기", createdAt: "2026-08-01T12:00:00+09:00" },
  { messageId: "M-2", role: "USER", text: "저장탱크 누출 의심", createdAt: "2026-08-01T12:01:00+09:00" },
];

afterEach(cleanup);

function renderPanel(overrides: Partial<React.ComponentProps<typeof FieldToolsPanel>> = {}) {
  const props: React.ComponentProps<typeof FieldToolsPanel> = {
    station: "경기 수원소방서",
    dispatchContact: { name: "경기 상황실", phone: "" },
    dataMode: "DEMO_SIMULATION",
    gpsLabel: "시연 위치",
    gpsDetail: "실제 GPS가 아닙니다",
    analysis: null,
    incidentId: null,
    messages,
    analysisIds: [],
    confirmationIds: [],
    canSave: false,
    recordAvailable: true,
    onRequestSave: vi.fn(),
    onContactAttempt: vi.fn(),
    ...overrides,
  };
  render(<FieldToolsPanel {...props} />);
  return props;
}

describe("좌측 현장 도구", () => {
  it("상황실 번호가 없을 때 가짜 전화 링크 대신 설정 필요 상태를 표시한다", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /상황실 연결/ }));

    expect(screen.getByRole("dialog", { name: "상황실 연결" })).toBeInTheDocument();
    expect(screen.getByText("연락처 미설정")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /전화 연결/ })).not.toBeInTheDocument();
  });

  it("대화상자를 열면 닫기에 초점을 두고 Escape 후 호출 버튼으로 돌아간다", async () => {
    renderPanel();
    const trigger = screen.getByRole("button", { name: /상황실 연결/ });
    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "상황실 연결" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("상황실 번호가 설정되면 안전한 tel 링크와 연결 시도 기록 callback을 제공한다", () => {
    const onContactAttempt = vi.fn();
    renderPanel({ dispatchContact: { name: "경기 상황실", phone: "031-123-4567" }, onContactAttempt });
    fireEvent.click(screen.getByRole("button", { name: /상황실 연결/ }));

    const callLink = screen.getByRole("link", { name: /전화 연결/ });
    expect(callLink).toHaveAttribute("href", "tel:0311234567");
    callLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(callLink);
    expect(onContactAttempt).toHaveBeenCalledOnce();
  });

  it("분석 후보 CAS를 확정 상태와 구분해 공식 자료 링크로 연결한다", () => {
    renderPanel({ analysis: demoAnalysis, incidentId: demoAnalysis.incidentId });
    fireEvent.click(screen.getByRole("button", { name: /공식 화학자료/ }));

    expect(screen.getByRole("dialog", { name: "공식 화학자료" })).toBeInTheDocument();
    expect(screen.getByText("CAS 7681-52-9")).toBeInTheDocument();
    expect(screen.getByText("CAS 7647-01-0")).toBeInTheDocument();
    expect(screen.getAllByText("후보·확인 필요")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /KOSHA/ })).toHaveLength(2);
  });

  it("현재 사고의 미저장 건수와 저장 동작을 제공한다", () => {
    const onRequestSave = vi.fn();
    renderPanel({ incidentId: "INC-1", analysisIds: ["ANL-1"], canSave: true, onRequestSave });
    fireEvent.click(screen.getByRole("button", { name: /현재 사고 기록/ }));

    expect(screen.getAllByText("미저장 2건")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "현재 대응 기록 저장" }));
    expect(onRequestSave).toHaveBeenCalledOnce();
  });

  it("record API가 준비되지 않아도 내역 조회는 유지하고 저장만 명시적으로 막는다", () => {
    renderPanel({ incidentId: "INC-1", analysisIds: ["ANL-1"], canSave: false, recordAvailable: false });
    fireEvent.click(screen.getByRole("button", { name: /현재 사고 기록/ }));

    expect(screen.getByText(/서버 기록저장 API가 배포되면/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록 저장 API 준비 중" })).toBeDisabled();
  });
});

describe("현장 도구 상태 계산", () => {
  it("전화번호에서 통화에 필요하지 않은 문자를 제거한다", () => {
    expect(normalizePhoneHref("031-123-4567")).toBe("tel:0311234567");
    expect(normalizePhoneHref("+82 (31) 123-4567")).toBe("tel:+82311234567");
    expect(normalizePhoneHref("031+123-4567")).toBe("tel:0311234567");
    expect(normalizePhoneHref("  ")).toBeNull();
  });

  it("초기 안내를 제외한 대화·분석·확인을 미저장 건수로 계산한다", () => {
    expect(countUnsavedRecordItems(messages, ["ANL-1"], ["CONF-1"])).toBe(3);
  });
});
