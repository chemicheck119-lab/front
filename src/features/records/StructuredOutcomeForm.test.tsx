import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  StructuredOutcomeForm,
  emptyStructuredOutcomeDraft,
  toStructuredOutcomeReport,
} from "./StructuredOutcomeForm";

afterEach(cleanup);

describe("구조화 대응 결과", () => {
  it("필수 선택 전에는 저장 계약을 만들지 않는다", () => {
    expect(toStructuredOutcomeReport(emptyStructuredOutcomeDraft("화학공장")))
      .toBeNull();
  });

  it("복수 대응과 추가 요인을 분석 코드로 변환한다", () => {
    const report = toStructuredOutcomeReport({
      facilityName: " 울산 화학공장 ",
      facilityAddress: " 울산광역시 남구 산업로 119 ",
      performedActions: ["ZONE_CONTROL", "LEAK_SOURCE_CONTROL"],
      briefApplicationStatus: "APPLIED",
      additionalFactors: ["ENCLOSED_SPACE", "ACTUAL_MIXING_CONFIRMED"],
      finalResponseOutcome: "SPREAD_CONTAINED",
    });

    expect(report).toEqual({
      facilityName: "울산 화학공장",
      facilityAddress: "울산광역시 남구 산업로 119",
      performedActions: ["ZONE_CONTROL", "LEAK_SOURCE_CONTROL"],
      briefApplicationStatus: "APPLIED",
      additionalFactors: ["ENCLOSED_SPACE", "ACTUAL_MIXING_CONFIRMED"],
      finalResponseOutcome: "SPREAD_CONTAINED",
    });
  });

  it("현장 대원이 선택할 항목과 서버 자동 저장 경계를 보여준다", () => {
    const onChange = vi.fn();
    render(<StructuredOutcomeForm value={emptyStructuredOutcomeDraft("울산 화학공장")} onChange={onChange} />);

    expect(screen.getByText(/사고물질·시설 내 충돌물질·위험은/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("울산 화학공장")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "경계·출입 통제" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      performedActions: ["ZONE_CONTROL"],
    }));
  });
});
