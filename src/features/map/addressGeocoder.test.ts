import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeIncidentAddress } from "./addressGeocoder";

afterEach(() => vi.unstubAllGlobals());

describe("사고 주소 지오코딩", () => {
  it("네이버 도로명 주소 좌표를 운영 입력 형식으로 변환한다", async () => {
    vi.stubGlobal("naver", {
      maps: {
        Map: function Map() {},
        Service: {
          Status: { OK: 200 },
          geocode: (_options: unknown, callback: (status: number, response: unknown) => void) => callback(200, {
            v2: { addresses: [{ roadAddress: "울산광역시 남구 삼산로 1", jibunAddress: "", x: "129.311", y: "35.538" }] },
          }),
        },
      },
    });

    await expect(geocodeIncidentAddress(" 울산 남구 삼산로 1 ", "client-id")).resolves.toMatchObject({
      query: "울산 남구 삼산로 1",
      displayAddress: "울산광역시 남구 삼산로 1",
      latitude: 35.538,
      longitude: 129.311,
      provider: "NAVER_MAPS_JS_V3",
    });
  });

  it("검색 결과가 없거나 국내 범위 밖이면 좌표를 사용하지 않는다", async () => {
    vi.stubGlobal("naver", {
      maps: {
        Map: function Map() {},
        Service: {
          Status: { OK: 200 },
          geocode: (_options: unknown, callback: (status: number, response: unknown) => void) => callback(200, {
            v2: { addresses: [{ roadAddress: "잘못된 결과", jibunAddress: "", x: "0", y: "0" }] },
          }),
        },
      },
    });

    await expect(geocodeIncidentAddress("없는 주소", "client-id")).rejects.toThrow("ADDRESS_NOT_FOUND");
  });
});
