import { describe, expect, it } from "vitest";
import { mapStyleUrlWithPublicToken } from "./config";

describe("운영 지도 공개 토큰 결합", () => {
  it("MapTiler 스타일 URL에 브라우저용 공개 키를 결합한다", () => {
    expect(mapStyleUrlWithPublicToken(
      "https://api.maptiler.com/maps/dataviz-light/style.json",
      "PUBLIC_TEST_TOKEN",
    )).toBe("https://api.maptiler.com/maps/dataviz-light/style.json?key=PUBLIC_TEST_TOKEN");
  });

  it("이미 키가 포함된 스타일과 다른 사업자 URL은 변경하지 않는다", () => {
    expect(mapStyleUrlWithPublicToken(
      "https://api.maptiler.com/maps/dataviz-light/style.json?key=EXISTING",
      "PUBLIC_TEST_TOKEN",
    )).toContain("key=EXISTING");
    expect(mapStyleUrlWithPublicToken(
      "https://maps.example.test/style.json",
      "PUBLIC_TEST_TOKEN",
    )).toBe("https://maps.example.test/style.json");
  });

  it("공개 키가 없으면 스타일 URL만 유지한다", () => {
    expect(mapStyleUrlWithPublicToken(
      "https://api.maptiler.com/maps/dataviz-dark/style.json",
      "",
    )).toBe("https://api.maptiler.com/maps/dataviz-dark/style.json");
  });
});
