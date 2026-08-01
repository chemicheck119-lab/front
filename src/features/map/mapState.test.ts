import { describe, expect, it } from "vitest";
import { canRenderRoute, formatDistance, formatEta, getLocationPresentation } from "./mapState";

describe("지도 위치·경로 상태", () => {
  it("5분이 지난 GPS는 오래된 위치로 표시하고 경로 갱신에 사용하지 않는다", () => {
    const now = new Date("2026-08-01T12:10:01Z").getTime();
    const result = getLocationPresentation("ACTIVE", "2026-08-01T12:05:00Z", 12, now);
    expect(result.label).toBe("오래된 위치");
    expect(result.usableForRoute).toBe(false);
  });

  it("권한 거부와 낮은 정확도를 서로 다른 상태로 표시한다", () => {
    expect(getLocationPresentation("DENIED").label).toBe("위치 권한 거부");
    expect(getLocationPresentation("ACTIVE", new Date().toISOString(), 180).label).toBe("낮은 정확도");
  });

  it("실제 또는 명시적 시연 GeoJSON 경로만 렌더링한다", () => {
    expect(canRenderRoute({ status: "AVAILABLE", geometry: { type: "LineString", coordinates: [[126, 37], [127, 37]] }, progressRatioIsProbability: false, message: "ok" })).toBe(true);
    expect(canRenderRoute({ status: "ROUTE_UNAVAILABLE", progressRatioIsProbability: false, message: "none" })).toBe(false);
    expect(formatEta(480)).toBe("8분");
    expect(formatDistance(4000)).toBe("4.0km");
  });
});
