import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("상황실·현장 사용자 화면 경계", () => {
  const page = readFileSync(resolve(process.cwd(), "src/pages/IntegratedMainPage.tsx"), "utf8");
  const styles = readFileSync(resolve(process.cwd(), "src/styles/original-workspace.css"), "utf8");

  it("Agent 상세·지도·GPS를 사용자 화면에 다시 연결하지 않는다", () => {
    for (const internalUi of ["AgentPanel", "IncidentMap", "useResponderLocation", "integrated-map-card"]) {
      expect(page).not.toContain(internalUi);
    }
  });

  it("원래 헤더와 3개 패널을 유지하고 화면 전환 탭을 추가하지 않는다", () => {
    for (const label of ["현재 사고정보", "초기 대응 분석", "AI 현장 대응 지원", "/images/logonavy.jpg", "기록 저장", "대응 기록 조회"]) expect(page).toContain(label);
    expect(page).not.toContain('aria-label="업무 화면"');
    expect(page).not.toContain("focus-navigation");
    expect(styles).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(page.match(/classic-panel-scroll/g)?.length).toBe(3);
    expect(styles).toMatch(/\.classic-workspace \.classic-panel-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  });
});
