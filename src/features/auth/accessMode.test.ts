import { describe, expect, it } from "vitest";
import type { UserFacingErrorInfo } from "../../api/client";
import { adaptDirectEntryIssue, DIRECT_ENTRY_DEFAULT_STATION, resolveInitialStation } from "./accessMode";

describe("인증 미사용 직접 진입", () => {
  it("Live API에서 인증을 사용하지 않으면 로그인 화면 없이 지정된 현장 화면으로 진입한다", () => {
    expect(resolveInitialStation("LIVE_API", false, "공모전 현장대응본부")).toBe("공모전 현장대응본부");
    expect(resolveInitialStation("LIVE_API", false, "")).toBe(DIRECT_ENTRY_DEFAULT_STATION);
  });

  it("시연 선택 화면과 향후 인증 모드는 기존 진입 절차를 유지한다", () => {
    expect(resolveInitialStation("DEMO_SIMULATION", false, "현장대응본부")).toBeNull();
    expect(resolveInitialStation("LIVE_API", true, "현장대응본부")).toBeNull();
    expect(resolveInitialStation("UNAVAILABLE", false, "현장대응본부")).toBeNull();
  });

  it("인증 미사용 환경의 401은 로그인 UI가 아니라 BE 배포 상태 오류로 안내한다", () => {
    const issue: UserFacingErrorInfo = {
      kind: "SESSION_EXPIRED",
      message: "로그인 세션이 만료됐습니다.",
      requestId: "REQ-DIRECT-401",
      retryable: false,
    };

    expect(adaptDirectEntryIssue(issue, false)).toEqual({
      kind: "SERVICE_UNAVAILABLE",
      message: "BFF가 아직 인증 없는 직접 요청을 허용하지 않습니다. BE 배포 상태를 확인해주세요.",
      requestId: "REQ-DIRECT-401",
      retryable: false,
    });
  });
});
