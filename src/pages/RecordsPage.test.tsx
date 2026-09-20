import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { makeDemoRecordDetail, makeDemoRecordList } from "../fixtures/demo";
import RecordsPage from "./RecordsPage";

const listIncidentRecords = vi.fn();
const getIncidentRecord = vi.fn();

vi.mock("../api/records", () => ({
  listIncidentRecords: (...args: unknown[]) => listIncidentRecords(...args),
  getIncidentRecord: (...args: unknown[]) => getIncidentRecord(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <RecordsPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe("대응 기록 화면", () => {
  it("목록을 불러와 건수와 한글 대응 결과를 보여준다", async () => {
    listIncidentRecords.mockResolvedValue(makeDemoRecordList());
    renderPage();

    expect(screen.getByText("불러오는 중입니다...")).toBeInTheDocument();
    expect(await screen.findByText("2건")).toBeInTheDocument();
    expect(screen.getByText(/울산 화학공장 · 확산 통제 완료/)).toBeInTheDocument();
  });

  it("기록을 누르면 상세를 불러와 조치·결과를 한글로 보여주고 목록으로 돌아온다", async () => {
    const list = makeDemoRecordList();
    listIncidentRecords.mockResolvedValue(list);
    getIncidentRecord.mockResolvedValue(makeDemoRecordDetail(list[0].recordId));
    renderPage();

    fireEvent.click(await screen.findByText(/울산 화학공장 · 확산 통제 완료/));

    await waitFor(() => expect(getIncidentRecord).toHaveBeenCalledWith(list[0].recordId));
    const detail = await screen.findByText(/수행된 조치: 경계·출입 통제, 누출원 차단/);
    expect(detail.textContent).toContain("최종 대응 결과: 확산 통제 완료");
    expect(detail.textContent).toContain("(전문 검수 전 정보입니다.)");
    expect(detail.textContent).toContain("대원: 차아염소산나트륨 저장탱크 누출");

    fireEvent.click(screen.getByText("← 대응 기록 목록"));
    expect(await screen.findByText("2건")).toBeInTheDocument();
  });

  it("기록이 없으면 빈 상태 안내를 보여준다", async () => {
    listIncidentRecords.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("저장된 대응 기록이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("0건")).toBeInTheDocument();
  });

  it("세션 만료 등 조회 오류는 서버 메시지를 그대로 보여준다", async () => {
    listIncidentRecords.mockRejectedValue(new ApiError("SESSION_EXPIRED", "로그인 세션이 만료되었거나 인증이 필요합니다.", "REQ-1"));
    renderPage();

    expect(await screen.findByText("로그인 세션이 만료되었거나 인증이 필요합니다.")).toBeInTheDocument();
  });
});
