import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GroundedRagResult } from "../../api/contracts";
import { GroundedEvidenceAccordion, getRagPresentation } from "./GroundedEvidenceAccordion";

describe("대응 근거 카드", () => {
  it("문장 sourceIds와 일치하는 원문 링크만 연결한다", () => {
    const rag: GroundedRagResult = {
      status: "COMPLETED",
      statements: [{ text: "공식 근거에 연결된 대응 문장", sourceIds: ["SRC-1"] }],
      citations: [
        { sourceId: "SRC-1", title: "CAMEO 원문", sourceUrls: ["https://cameo.example/source"] },
        { sourceId: "SRC-2", title: "사용하지 않은 근거", sourceUrls: ["https://example.test/unused"] },
      ],
      riskDecisionSource: "DETERMINISTIC_CAMEO_RULE_ENGINE",
    };

    render(<GroundedEvidenceAccordion rag={rag} />);

    expect(screen.getByText("공식 근거에 연결된 대응 문장")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CAMEO 원문/ })).toHaveAttribute("href", "https://cameo.example/source");
    expect(screen.queryByRole("link", { name: /사용하지 않은 근거/ })).not.toBeInTheDocument();
  });

  it("확인 전 상태를 위험 결과가 아닌 잠금 안내로 표시한다", () => {
    expect(getRagPresentation("NOT_RUN_REQUIRES_CONFIRMED_PAIR").title).toBe("대응 근거 잠김");
  });
});
