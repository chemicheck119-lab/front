import { describe, expect, it } from "vitest";
import { shouldResetAfterSave } from "./records";

describe("대응 기록 저장", () => {
  it("서버가 resetAllowed=true를 반환한 성공 응답에서만 초기화를 허용한다", () => {
    expect(shouldResetAfterSave({ resetAllowed: true })).toBe(true);
    expect(shouldResetAfterSave({ resetAllowed: false as true })).toBe(false);
  });
});
