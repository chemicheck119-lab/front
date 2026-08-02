import { describe, expect, it } from "vitest";
import type { StyleSpecification } from "maplibre-gl";
import { resolveOperationalMapStyle } from "./mapStyle";

describe("운영 배경지도 스타일", () => {
  it("MapTiler Style URL을 동일 지도와 공개 키를 사용하는 Raster XYZ 스타일로 변환한다", () => {
    const result = resolveOperationalMapStyle(
      "https://api.maptiler.com/maps/streets-v2/style.json?key=PUBLIC_TEST_TOKEN",
    ) as StyleSpecification;

    expect(result.version).toBe(8);
    expect(result.sources["operational-basemap"]).toMatchObject({
      type: "raster",
      tiles: [
        "https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=PUBLIC_TEST_TOKEN",
      ],
      tileSize: 256,
    });
    expect(result.layers.some((layer) => layer.id === "operational-basemap-raster")).toBe(true);
  });

  it("자체 호스팅 및 다른 지도 사업자의 Style URL은 변경하지 않는다", () => {
    const styleUrl = "https://maps.example.test/operations/style.json";
    expect(resolveOperationalMapStyle(styleUrl)).toBe(styleUrl);
  });

  it("잘못된 URL은 MapLibre 오류 처리를 위해 원문을 유지한다", () => {
    expect(resolveOperationalMapStyle("not-a-style-url")).toBe("not-a-style-url");
  });
});
