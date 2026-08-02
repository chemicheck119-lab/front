import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginScreen, isPublicPilotAccessUrl, normalizeAuthLoginUrl } from "./LoginScreen";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("접속 모드 분리", () => {
  it("시연 모드에서만 지역·소방서 선택으로 접속한다", () => {
    const onDemoLogin = vi.fn();
    render(<LoginScreen dataMode="DEMO_SIMULATION" authLoginUrl="" onDemoLogin={onDemoLogin} />);

    fireEvent.change(screen.getByLabelText("지역"), { target: { value: "경기" } });
    fireEvent.change(screen.getByLabelText("소방서"), { target: { value: "수원소방서" } });
    fireEvent.click(screen.getByRole("button", { name: "시연 시스템 접속" }));

    expect(onDemoLogin).toHaveBeenCalledWith("경기 수원소방서");
    expect(screen.getByText(/실제 사용자 인증과 GPS가 아닙니다/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "케미체크119 화학재난대응지원시스템" })).toBeInTheDocument();
  });

  it("Live 모드에 인증 URL이 없으면 로컬 선택과 운영 접속을 제공하지 않는다", () => {
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="" onDemoLogin={vi.fn()} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/운영 인증 URL이 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it("Live 모드에서 검증된 http URL만 운영 로그인 링크로 제공한다", () => {
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="https://auth.example.test/login" onDemoLogin={vi.fn()} />);

    expect(screen.getByRole("link", { name: /운영 로그인 페이지로 이동/ })).toHaveAttribute("href", "https://auth.example.test/login");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("공개 파일럿 URL은 지역·소방서 선택 후 stationId를 POST한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        schemaVersion: "chemicheck119-fire-station-catalog-v1",
        sourceName: "소방청_전국소방서 좌표현황(XY좌표)",
        sourceUrl: "https://www.data.go.kr/data/15138232/fileData.do",
        sourceDate: "2024-09-01",
        regions: [{
          regionName: "서울",
          stations: [{
            stationId: "nfa-0985",
            region: "서울",
            stationName: "강남소방서",
            address: "서울특별시 강남구 테헤란로 629",
            latitude: 37.5102929,
            longitude: 127.06684,
          }],
        }],
      }),
    }));
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="https://chemicheck119.site/auth/staging/pilot" onDemoLogin={vi.fn()} />);

    await waitFor(() => expect(screen.queryByText("전체 소방서 목록을 확인하고 있습니다.")).not.toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("지역"), { target: { value: "서울" } });
    fireEvent.change(screen.getByLabelText("소방서"), { target: { value: "nfa-0985" } });

    const button = screen.getByRole("button", { name: "선택한 소방서로 시작" });
    const form = button.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "https://chemicheck119.site/auth/staging/pilot");
    expect(screen.getByLabelText("소방서")).toHaveAttribute("name", "stationId");
    expect(screen.getByLabelText("소방서")).toHaveValue("nfa-0985");
    expect(button).toBeEnabled();
    expect(screen.getByText(/소방청 공개 좌표 자료/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /운영 로그인/ })).not.toBeInTheDocument();
  });

  it("운영 세션 확인 중에는 로그인 이동 대신 차단 화면을 표시한다", () => {
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="https://auth.example.test/login" sessionChecking onDemoLogin={vi.fn()} />);

    expect(screen.getByText("접속 정보를 확인하고 있습니다")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("세션 확인 실패 후 사용자가 다시 조회할 수 있다", () => {
    const onRetrySession = vi.fn();
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="https://auth.example.test/login" sessionError={{ message: "세션 확인 실패", retryable: true }} onRetrySession={onRetrySession} onDemoLogin={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "세션 다시 확인" }));
    expect(onRetrySession).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("세션 확인 실패");
  });

  it("실행 가능한 스크립트 URL은 인증 링크로 사용하지 않는다", () => {
    render(<LoginScreen dataMode="LIVE_API" authLoginUrl="javascript:alert(1)" onDemoLogin={vi.fn()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/운영 인증 URL이 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it("BFF 미설정 상태에서는 연결 설정 안내만 표시한다", () => {
    render(<LoginScreen dataMode="UNAVAILABLE" authLoginUrl="https://auth.example.test/login" onDemoLogin={vi.fn()} />);

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
    expect(isPublicPilotAccessUrl("https://app.example.test/auth/staging/pilot")).toBe(true);
    expect(isPublicPilotAccessUrl("https://app.example.test/auth/login")).toBe(false);
  });
});
