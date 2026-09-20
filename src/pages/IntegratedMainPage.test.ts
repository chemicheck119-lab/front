import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("상황실·현장 사용자 화면 경계", () => {
  const page = readFileSync(resolve(process.cwd(), "src/pages/IntegratedMainPage.tsx"), "utf8");
  const styles = readFileSync(resolve(process.cwd(), "src/styles/integrated-main.css"), "utf8");

  it("Agent 상세·지도·GPS를 사용자 화면에 다시 연결하지 않는다", () => {
    for (const internalUi of ["AgentPanel", "IncidentMap", "useResponderLocation", "integrated-map-card"]) {
      expect(page).not.toContain(internalUi);
    }
  });

  it("상황실과 현장 대응을 분리하고 각 영역 안에서 스크롤한다", () => {
    expect(page).toContain("상황실");
    expect(page).toContain("현장 대응");
    expect(page.match(/integrated-workstream-scroll/g)?.length).toBe(2);
    expect(styles).toMatch(/\.integrated-workstream-scroll\s*\{[^}]*overflow-y:\s*auto/s);
    expect(styles).toMatch(/\.integrated-main-grid\s*\{[^}]*overflow:\s*hidden/s);
  });
});
