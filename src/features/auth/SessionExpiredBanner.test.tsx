import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SessionExpiredBanner } from "./SessionExpiredBanner";

afterEach(cleanup);

describe("세션 만료 경계", () => {
  it("진행 중 사고를 유지하고 인증을 새 창에서 수행하도록 안내한다", () => {
    render(<SessionExpiredBanner authLoginUrl="https://auth.example.test/login" hasIncident requestId="REQ-AUTH-1" />);

    expect(screen.getByRole("alert", { name: "로그인 세션 만료" })).toHaveTextContent("현재 사고·후보·현장 확인 기록은 이 화면에 유지됩니다");
    expect(screen.getByRole("link", { name: /새 창에서 다시 로그인/ })).toHaveAttribute("href", "https://auth.example.test/login");
    expect(screen.getByRole("link", { name: /새 창에서 다시 로그인/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: /REQ-AUTH-1 복사/ })).toBeInTheDocument();
  });

  it("인증 URL이 없거나 안전하지 않으면 임의 링크를 만들지 않는다", () => {
    render(<SessionExpiredBanner authLoginUrl="javascript:alert(1)" hasIncident={false} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("운영 인증 URL 설정 필요")).toBeInTheDocument();
  });

  it("공개 파일럿은 비밀번호 로그인 대신 POST 재시작 버튼을 제공한다", () => {
    render(<SessionExpiredBanner authLoginUrl="https://chemicheck119.site/auth/staging/pilot" hasIncident={false} />);

    const button = screen.getByRole("button", { name: /파일럿 세션 다시 시작/ });
    const form = button.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "https://chemicheck119.site/auth/staging/pilot");
    expect(form).toHaveAttribute("target", "_blank");
  });
});
