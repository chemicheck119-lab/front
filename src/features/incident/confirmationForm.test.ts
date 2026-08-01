import { describe, expect, it } from "vitest";
import { confirmationDateTimeToIso, defaultConfirmationBasis, toConfirmationDateTimeInput } from "./confirmationForm";

describe("현장 확인 입력", () => {
  it("역할별로 가장 일반적인 현장 근거를 기본 선택한다", () => {
    expect(defaultConfirmationBasis("INCIDENT")).toBe("CONTAINER_LABEL");
    expect(defaultConfirmationBasis("FACILITY")).toBe("SITE_MSDS");
  });

  it("기기 현지 시각을 datetime-local 값으로 표시한다", () => {
    const localTime = new Date(2026, 7, 1, 12, 27, 45);
    expect(toConfirmationDateTimeInput(localTime)).toBe("2026-08-01T12:27");
  });

  it("입력한 현지 확인 시각을 API ISO 시각으로 변환한다", () => {
    const expected = new Date(2026, 7, 1, 12, 27).toISOString();
    expect(confirmationDateTimeToIso("2026-08-01T12:27")).toBe(expected);
    expect(confirmationDateTimeToIso("")).toBeNull();
    expect(confirmationDateTimeToIso("잘못된 시각")).toBeNull();
  });
});
