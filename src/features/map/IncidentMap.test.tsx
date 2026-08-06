import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { apiConfig } from "../../api/config";
import { IncidentMap } from "./IncidentMap";
import type { MapContext } from "../../api/contracts";

const originalMapStyleUrl = apiConfig.mapStyleUrl;
const originalNaverMapClientId = apiConfig.naverMapClientId;
const mapStyles = readFileSync(path.resolve(process.cwd(), "src/styles/map.css"), "utf8");

describe("MapLibre 지도 컨테이너", () => {
  afterEach(() => {
    cleanup();
    apiConfig.mapStyleUrl = originalMapStyleUrl;
    apiConfig.naverMapClientId = originalNaverMapClientId;
  });

  it("MapLibre 기본 position 규칙이 덮어써도 전체 지도 높이를 유지한다", () => {
    apiConfig.mapStyleUrl = "";
    apiConfig.naverMapClientId = "";
    render(<IncidentMap
      context={null}
      isDark={false}
      gps={{ label: "GPS 수신 대기", detail: "현재 위치를 확인하고 있습니다", tone: "waiting", usableForRoute: false }}
    />);

    const region = screen.getByRole("region", { name: "전국 사고 및 출동 지도" });
    expect(region.querySelector(".chemicheck-map-canvas")).toHaveClass("absolute", "inset-0");
    expect(mapStyles).toMatch(/\.chemicheck-map-canvas\.maplibregl-map\s*\{[^}]*position:\s*absolute;[^}]*height:\s*100%;/s);
  });

  it("경로 요약 카드는 우측 하단 확대 컨트롤과 겹치지 않도록 간격을 둔다", () => {
    apiConfig.mapStyleUrl = "";
    apiConfig.naverMapClientId = "";
    render(<IncidentMap
      context={null}
      isDark={false}
      gps={{ label: "GPS 수신 대기", detail: "현재 위치를 확인하고 있습니다", tone: "waiting", usableForRoute: false }}
    />);

    expect(screen.getByTestId("map-route-summary")).toHaveClass("right-16", "w-[270px]");
  });

  it("합성 사고에 실 API 도로 경로를 쓸 때 두 데이터 경계를 함께 표시한다", () => {
    apiConfig.mapStyleUrl = "";
    apiConfig.naverMapClientId = "";
    const context: MapContext = {
      coverageScope: "NATIONWIDE_KOREA",
      incidentPosition: {
        latitude: 37.52,
        longitude: 127.05,
        observedAt: "2026-08-06T10:00:00Z",
        source: "DEMO_SIMULATION",
        label: "공개 합성 사고지점",
        isSimulation: true,
      },
      route: {
        status: "AVAILABLE",
        provider: "NAVER_DIRECTIONS_5",
        providerMode: "LIVE_API",
        geometry: { type: "LineString", coordinates: [[127.04, 37.51], [127.05, 37.52]] },
        progressRatioIsProbability: false,
        message: "서버에서 확인한 도로 경로입니다.",
      },
      hazardOverlayStatus: "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL",
    };

    render(<IncidentMap
      context={context}
      isDark={false}
      gps={{ label: "소방서 출동 기준", detail: "차량 이동은 합성", tone: "demo", usableForRoute: true }}
    />);

    expect(screen.getByText("공개 합성 사고·차량 · NAVER 실도로 경로")).toBeInTheDocument();
  });
});
