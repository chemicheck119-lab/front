import { describe, expect, it } from "vitest";
import { buildNaverMapSdkUrl } from "./naverMapLoader";

describe("네이버 지도 SDK URL", () => {
  it("도메인 제한 Client ID와 한글 언어 설정을 사용한다", () => {
    const result = new URL(buildNaverMapSdkUrl("PUBLIC CLIENT ID"));
    expect(result.origin).toBe("https://oapi.map.naver.com");
    expect(result.pathname).toBe("/openapi/v3/maps.js");
    expect(result.searchParams.get("ncpKeyId")).toBe("PUBLIC CLIENT ID");
    expect(result.searchParams.get("language")).toBe("ko");
    expect(result.searchParams.get("submodules")).toBe("geocoder");
  });
});
