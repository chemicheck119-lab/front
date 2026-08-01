import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoMaterialSearch } from "../../fixtures/demo";
import { SubstanceResults } from "./SubstanceResults";

describe("물질검색 후보", () => {
  it("후보를 확정값과 구분하고 기존 사고의 확인 창으로만 전달한다", () => {
    const onUseCandidate = vi.fn();
    render(<SubstanceResults result={demoMaterialSearch} incidentAvailable onUseCandidate={onUseCandidate} />);

    expect(screen.getByText("AI 확정 아님")).toBeInTheDocument();
    expect(screen.getByText("상온 상태: 액체(휘발성)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /사고물질 확인 창으로 가져오기/ }));
    expect(onUseCandidate).toHaveBeenCalledWith(demoMaterialSearch.candidates[0]);
  });

  it("사고가 없으면 자동 확인 대신 접수 필요 상태로 막는다", () => {
    render(<SubstanceResults result={demoMaterialSearch} incidentAvailable={false} onUseCandidate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "사고 신고 접수 후 확인 가능" })).toBeDisabled();
  });
});
