import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import WelcomePage from "../../pages/WelcomePage";
import { PHONE_ENTRY } from "./phoneEntry";
import type { HTMLAttributes } from "react";

const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({
  useReducedMotion: () => motionPreference.reduced,
  motion: {
    div: ({ initial, animate, transition, ...props }: HTMLAttributes<HTMLDivElement> & {
      initial?: unknown; animate?: unknown; transition?: unknown;
    }) => <div {...props} data-motion={JSON.stringify({ initial, animate, transition })} />,
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  motionPreference.reduced = false;
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
  it("연결 검증 안내는 생략하고 시범 전화와 실제 119 긴급 신고는 구분한다", () => {
    renderHome();
    const call = screen.getByRole("link", { name: `전화로 체험하기 ${PHONE_ENTRY.display}` });
    expect(call).toHaveAttribute("href", PHONE_ENTRY.href);
    expect(call).toHaveAccessibleDescription(/실제 긴급 신고는 119/);
    expect(call).toHaveAccessibleDescription(/시범 서비스/);
    expect(screen.queryByText(/전화→화면 연결은 검증 중입니다/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "대응 화면 열기" }).map((link) => link.getAttribute("href"))).toEqual(["/onboarding", "#station-entry"]);
    for (const link of screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("tel:"))) {
      expect(link).toHaveAttribute("href", PHONE_ENTRY.href);
    }
  });

  it("브리프 제목·본문을 별도 블록으로 제공하고 중복 설명을 늘리지 않는다", () => {
    renderHome();
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(within(preview).getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(preview.children[1].tagName).toBe("P");
    expect(preview.children).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "번호 복사" })).not.toBeInTheDocument();
    expect(screen.queryByText(/PC에서는 휴대전화로/)).not.toBeInTheDocument();
    expect(screen.queryByText(/상황실은 신고·전사를 검토하고/)).not.toBeInTheDocument();
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
    expect(within(entry).getByText("상황실 모니터링 · 소방대원 대응 지원")).toBeInTheDocument();
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(entry.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("기존 왼쪽 소개와 오른쪽 통합 카드를 유지하고 전화 강조 영역을 선택 폼 위에 둔다", () => {
    const { container } = renderHome();
    const content = container.querySelector(".first-slide-content");
    expect(content).not.toBeNull();
    const intro = container.querySelector(".first-slide-heading");
    const panel = container.querySelector(".hero-mvp");
    const phone = screen.getByRole("region", { name: "시범 신고 전화" });
    const station = screen.getByRole("region", { name: "지역과 소방서를 선택하세요." });
    const preview = screen.getByRole("region", { name: "사고 브리프 미리보기" });
    expect(Array.from(content!.children)).toEqual([intro, panel]);
    expect(intro).not.toContainElement(phone);
    expect(panel).toContainElement(phone);
    expect(phone).toHaveClass("phone-entry-accent");
    expect(phone.parentElement).toBe(station.parentElement);
    expect(phone.compareDocumentPosition(station) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(phone).getByText("시범 전화 신고 · 확인 후 분석")).toBeInTheDocument();
    expect(screen.getAllByRole("region", { name: "시범 신고 전화" })).toHaveLength(1);
    expect(panel).toContainElement(preview);
    expect(station.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector(".home-content")).toBeNull();
    expect(container.querySelector(".hero-response-column")).toBeNull();
    expect(within(station).getByRole("button", { name: "대응 화면 열기" }).parentElement).toBe(
      station.querySelector(".home-entry-fields"),
    );
  });

  it("기존 0.65초 등장과 오른쪽 카드의 지연을 유지한다", () => {
    const { container } = renderHome();
    for (const [selector, y, delay] of [[".first-slide-heading", 12, undefined], [".hero-mvp", 18, 0.15]] as const) {
      const motion = JSON.parse(container.querySelector(selector)!.getAttribute("data-motion")!);
      expect(motion.initial).toEqual({ opacity: 0, y });
      expect(motion.animate).toEqual({ opacity: 1, y: 0 });
      expect(motion.transition).toEqual({ duration: 0.65, ...(delay === undefined ? {} : { delay }) });
    }
  });

  it("동작 줄이기 설정에서는 기다리거나 이동하지 않고 바로 표시한다", () => {
    motionPreference.reduced = true;
    const { container } = renderHome();
    for (const selector of [".first-slide-heading", ".hero-mvp"]) {
      const motion = JSON.parse(container.querySelector(selector)!.getAttribute("data-motion")!);
      expect(motion.initial).toBe(false);
      expect(motion.transition.duration).toBe(0);
      expect(motion.transition.delay ?? 0).toBe(0);
    }
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
