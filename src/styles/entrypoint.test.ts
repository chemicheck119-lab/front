import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("공통 스타일 진입점", () => {
  it("분석·근거·현장 도구의 Tailwind와 테마를 랜딩 스타일보다 먼저 로드한다", () => {
    const entrypoint = readFileSync(resolve(process.cwd(), "src/main.tsx"), "utf8");
    const sharedStyles = entrypoint.indexOf('import "./styles/index.css"');
    const globalStyles = entrypoint.indexOf('import "./styles/global.css"');
    const landingStyles = entrypoint.indexOf('import "./styles/landing-system.css"');

    expect(sharedStyles).toBeGreaterThanOrEqual(0);
    expect(globalStyles).toBeGreaterThan(sharedStyles);
    expect(landingStyles).toBeGreaterThan(globalStyles);
  });

  it("공통 스타일에는 사용자 화면에 필요한 유틸리티·테마만 유지한다", () => {
    const stylesheet = readFileSync(resolve(process.cwd(), "src/styles/index.css"), "utf8");
    for (const dependency of ["tailwind.css", "theme.css"]) {
      expect(stylesheet).toContain(`@import './${dependency}'`);
    }
    expect(stylesheet).not.toContain("map.css");
  });
});
