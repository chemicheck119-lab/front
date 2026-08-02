import { describe, expect, it } from "vitest";
import { KOSHA_MSDS_SEARCH_URL, resolveOfficialSourceUrl } from "./sourceLinks";

describe("공식 근거 링크 정규화", () => {
  it("HTTP(S) 링크만 그대로 허용한다", () => {
    expect(resolveOfficialSourceUrl("https://cameochemicals.noaa.gov/reactivity", "CAMEO"))
      .toBe("https://cameochemicals.noaa.gov/reactivity");
    expect(resolveOfficialSourceUrl("javascript:alert(1)", "CAMEO")).toBeNull();
  });

  it("KOSHA OpenAPI 설명 문자열은 실제 MSDS 검색 URL로 대체한다", () => {
    expect(resolveOfficialSourceUrl("KOSHA MSDS OpenAPI via data.go.kr", "KOSHA"))
      .toBe(KOSHA_MSDS_SEARCH_URL);
  });
});
