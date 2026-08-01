import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { apiConfig } from "../../api/config";
import { IncidentMap } from "./IncidentMap";

const originalMapStyleUrl = apiConfig.mapStyleUrl;
const mapStyles = readFileSync(path.resolve(process.cwd(), "src/styles/map.css"), "utf8");

describe("MapLibre 지도 컨테이너", () => {
  afterEach(() => {
    apiConfig.mapStyleUrl = originalMapStyleUrl;
  });

  it("MapLibre 기본 position 규칙이 덮어써도 전체 지도 높이를 유지한다", () => {
    apiConfig.mapStyleUrl = "";
    render(<IncidentMap
      context={null}
      isDark={false}
      gps={{ label: "GPS 수신 대기", detail: "현재 위치를 확인하고 있습니다", tone: "waiting", usableForRoute: false }}
    />);

    const region = screen.getByRole("region", { name: "전국 사고 및 출동 지도" });
    expect(region.querySelector(".chemicheck-map-canvas")).toHaveClass("absolute", "inset-0");
    expect(mapStyles).toMatch(/\.chemicheck-map-canvas\.maplibregl-map\s*\{[^}]*position:\s*absolute;[^}]*height:\s*100%;/s);
  });
});
