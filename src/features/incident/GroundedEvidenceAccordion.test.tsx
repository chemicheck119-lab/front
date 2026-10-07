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
    expect(screen.getByText("공식 근거에 연결된 대응 문장").closest("details")).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: /CAMEO 원문/ })).toHaveAttribute("href", "https://cameo.example/source");
    expect(screen.queryByRole("link", { name: /사용하지 않은 근거/ })).not.toBeInTheDocument();
  });

  it("확인 전 상태를 위험 결과가 아닌 잠금 안내로 표시한다", () => {
    expect(getRagPresentation("NOT_RUN_REQUIRES_CONFIRMED_PAIR").title).toBe("대응 근거 잠김");
  });
  it("혼합 규칙만 있으면 물질별 대응 자료가 없음을 구분한다", () => {
    const { container } = render(<GroundedEvidenceAccordion rag={{
      status: "FALLBACK_EXTRACTIVE",
      statements: [{ text: "혼합 규칙 결과", sourceIds: ["RULE_RESULT"] }],
      citations: [{ sourceId: "RULE_RESULT", title: "규칙 근거", sourceUrls: ["https://cameochemicals.noaa.gov/reactivity"] }],
      riskDecisionSource: "DETERMINISTIC_CAMEO_RULE_ENGINE",
    }} />);
    expect(screen.getByText("혼합 위험 참고정보")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("물질별 대응 자료는 연결되지 않았습니다.");
    expect(container).not.toHaveTextContent("물질별 대응 참고정보");
  });

  it("노출 경로와 자료 누락 안내를 숨기지 않는다", () => {
    const { container } = render(<GroundedEvidenceAccordion rag={{
      status: "FALLBACK_EXTRACTIVE",
      statements: [{ text: "보호구 참고자료", sourceIds: ["PPE"] }],
      citations: [{ sourceId: "PPE", title: "보호구", sourceUrls: ["https://www.data.go.kr/data/15157612/openapi.do"] }],
      limitations: ["자료 확인: 노출 경로를 확인해주세요.", "자료 확인: 응급조치 자료가 연결되지 않았습니다."],
    }} />);
    expect(container).toHaveTextContent("노출 경로를 확인해주세요.");
    expect(container).toHaveTextContent("응급조치 자료가 연결되지 않았습니다.");
  });

});
