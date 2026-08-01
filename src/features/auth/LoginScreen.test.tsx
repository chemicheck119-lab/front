import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginScreen, normalizeAuthLoginUrl } from "./LoginScreen";

afterEach(cleanup);

describe("접속 모드 분리", () => {
  it("시연 모드에서만 지역·소방서 선택으로 접속한다", () => {
    const onDemoLogin = vi.fn();
    render(<LoginScreen isDark={false} dataMode="DEMO_SIMULATION" authLoginUrl="" onDemoLogin={onDemoLogin} />);

    fireEvent.change(screen.getByLabelText("지역"), { target: { value: "경기" } });
    fireEvent.change(screen.getByLabelText("소방서"), { target: { value: "수원소방서" } });
    fireEvent.click(screen.getByRole("button", { name: "시연 시스템 접속" }));

    expect(onDemoLogin).toHaveBeenCalledWith("경기 수원소방서");
    expect(screen.getByText(/실제 사용자 인증과 GPS가 아닙니다/)).toBeInTheDocument();
  });

  it("Live 모드에 인증 URL이 없으면 로컬 선택과 운영 접속을 제공하지 않는다", () => {
    render(<LoginScreen isDark={false} dataMode="LIVE_API" authLoginUrl="" onDemoLogin={vi.fn()} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/운영 인증 URL이 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it("Live 모드에서 검증된 http URL만 운영 로그인 링크로 제공한다", () => {
    render(<LoginScreen isDark={false} dataMode="LIVE_API" authLoginUrl="https://auth.example.test/login" onDemoLogin={vi.fn()} />);

    expect(screen.getByRole("link", { name: /운영 로그인 페이지로 이동/ })).toHaveAttribute("href", "https://auth.example.test/login");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("실행 가능한 스크립트 URL은 인증 링크로 사용하지 않는다", () => {
    render(<LoginScreen isDark={false} dataMode="LIVE_API" authLoginUrl="javascript:alert(1)" onDemoLogin={vi.fn()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/운영 인증 URL이 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it("BFF 미설정 상태에서는 연결 설정 안내만 표시한다", () => {
    render(<LoginScreen isDark={false} dataMode="UNAVAILABLE" authLoginUrl="https://auth.example.test/login" onDemoLogin={vi.fn()} />);

    expect(screen.getByText("서비스 연결 설정이 필요합니다")).toBeInTheDocument();
    expect(screen.getByText(/VITE_BFF_BASE_URL/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("인증 URL 검증", () => {
  it("상대 경로를 같은 origin의 안전한 URL로 정규화한다", () => {
    expect(normalizeAuthLoginUrl("/auth/login", "https://app.example.test"))
      .toBe("https://app.example.test/auth/login");
    expect(normalizeAuthLoginUrl("data:text/html,bad", "https://app.example.test")).toBeNull();
  });
});
