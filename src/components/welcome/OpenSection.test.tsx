import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import WelcomePage from "../../pages/WelcomePage";
import { PHONE_ENTRY } from "./phoneEntry";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Destination() {
  const { state } = useLocation();
  return <p>{state.region} {state.station} 직접 입력 화면</p>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/main" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("전화 중심 메인페이지", () => {
  it("주 CTA는 시범 전화이며 실제 119 신고와 검증 중인 연결을 구분한다", () => {
    renderHome();
    const call = screen.getByRole("link", { name: `전화로 체험하기 ${PHONE_ENTRY.display}` });
    expect(call).toHaveAttribute("href", PHONE_ENTRY.href);
    expect(call).toHaveAccessibleDescription(/실제 긴급 신고는 119/);
    expect(call).toHaveAccessibleDescription(/전화→화면 연결은 검증 중/);
    expect(screen.getByRole("link", { name: "대응 화면 열기" })).toHaveAttribute("href", "#station-entry");
    for (const link of screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("tel:"))) {
      expect(link).toHaveAttribute("href", PHONE_ENTRY.href);
    }
  });

  it("번호 복사 성공을 알린다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "번호 복사" }));
    expect(writeText).toHaveBeenCalledWith(PHONE_ENTRY.display);
    expect(await screen.findByText("전화번호를 복사했습니다.")).toHaveAttribute("role", "status");
  });

  it.each(["denied", "unavailable"])("클립보드 %s 시 직접 입력을 안내하고 전화 링크를 유지한다", async (failure) => {
    vi.stubGlobal("navigator", failure === "denied" ? {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    } : {});
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "번호 복사" }));
    expect(await screen.findByText("복사할 수 없습니다. 위 번호를 직접 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `전화로 체험하기 ${PHONE_ENTRY.display}` })).toHaveAttribute("href", PHONE_ENTRY.href);
  });

  it("브리프 제목·본문·검토 안내를 별도 블록으로 제공하고 예시를 실제 결과로 표시하지 않는다", () => {
    renderHome();
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(within(preview).getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(preview.children[1].tagName).toBe("P");
    expect(within(preview).getByText(/전사 초안은/).tagName).toBe("SPAN");
    expect(screen.getByText("화면 예시 · 실제 분석 결과 아님")).toBeInTheDocument();
    expect(within(preview).getByText(/신고문을 입력하면 확인할 사항/)).toBeInTheDocument();
    expect(screen.queryByText("LIVE PREVIEW")).not.toBeInTheDocument();
    expect(screen.getByText(/두 물질의 CAS를 각각 확인하기 전/)).toBeInTheDocument();
  });

  it("상황실·소방대원 진입과 지역·소방서 선택을 브리프 위에 항상 보여준다", () => {
    renderHome();
    const entry = screen.getByRole("region", { name: "지역과 소방서를 선택하세요." });
    expect(within(entry).getByLabelText("지역")).toBeVisible();
    expect(within(entry).getByLabelText("소방서")).toBeVisible();
    expect(entry.closest("details")).toBeNull();
    expect(within(entry).getByText(/상황실은 신고·전사를 검토하고, 소방대원은 대응 근거를 확인합니다/)).toBeInTheDocument();
    expect(within(entry).getByText(/로그인·권한 확인이나 실시간 전화 연결을 대신하지 않습니다/)).toBeInTheDocument();
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(entry.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("전화 체험은 왼쪽 소개 아래, 소방서 선택과 브리프는 오른쪽에 분리한다", () => {
    const { container } = renderHome();
    const content = container.querySelector(".home-entry-layout");
    expect(content).not.toBeNull();
    const intro = container.querySelector(".home-entry-intro");
    const panel = container.querySelector(".home-entry-panel");
    const phone = screen.getByRole("region", { name: "시범 신고 전화" });
    const station = screen.getByRole("region", { name: "지역과 소방서를 선택하세요." });
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(Array.from(content!.children)).toEqual([intro, panel]);
    expect(phone.parentElement).toBe(intro);
    expect(phone.previousElementSibling).toHaveClass("home-entry-description");
    expect(phone.nextElementSibling).toHaveClass("home-entry-actions");
    expect(panel).not.toContainElement(phone);
    expect(screen.getAllByRole("region", { name: "시범 신고 전화" })).toHaveLength(1);
    expect(Array.from(panel!.querySelector(".home-entry-controls")!.children)).toEqual([station]);
    expect(panel).toContainElement(preview);
    expect(station.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector(".home-content")).toBeNull();
    expect(container.querySelector(".hero-response-column")).toBeNull();
    expect(within(station).getByRole("button", { name: "대응 화면 열기" }).parentElement).toBe(
      station.querySelector(".home-entry-fields"),
    );
  });

  it("선택하지 않은 상태에서는 폼을 직접 제출해도 이동하지 않는다", () => {
    renderHome();
    fireEvent.submit(screen.getByRole("form", { name: "지역·소방서 선택" }));
    expect(screen.getByRole("region", { name: "지역과 소방서를 선택하세요." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "대응 화면 열기" })).toBeDisabled();
  });

  it("대응 화면 진입은 지역·소방서 선택 후 기존 경로와 선택 정보를 유지한다", () => {
    renderHome();
    const start = screen.getByRole("button", { name: "대응 화면 열기" });
    expect(start).toBeDisabled();
    expect(screen.getByLabelText("소방서")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("지역"), { target: { value: "경기도" } });
    fireEvent.change(screen.getByLabelText("소방서"), { target: { value: "수원소방서" } });
    expect(start).toBeEnabled();
    expect(screen.getByText("경기도 · 수원소방서")).toHaveAttribute("role", "status");
    fireEvent.change(screen.getByLabelText("지역"), { target: { value: "서울특별시" } });
    expect(screen.getByLabelText("소방서")).toHaveValue("");
    expect(start).toBeDisabled();
    fireEvent.change(screen.getByLabelText("소방서"), { target: { value: "강남소방서" } });
    fireEvent.click(start);
    expect(screen.getByText("서울특별시 강남소방서 직접 입력 화면")).toBeInTheDocument();
  });
});
