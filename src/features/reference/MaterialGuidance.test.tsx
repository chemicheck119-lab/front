import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MaterialGuidance, type Guidance } from "./MaterialGuidance";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const approved: Guidance = {
  status: "AVAILABLE", name: "Fixture", cas: "7647-01-0", version: "fixture-version",
  collected_at: "2026-10-07", source_url: "https://www.data.go.kr/data/15157612/openapi.do",
  sections: [
    { number: 5, label: "화재 시 참고사항", status: "AVAILABLE", items: [{ evidence_id: "fixture-id", title: "Fixture title", text: "Full text including a final DO NOT condition." }] },
    { number: 6, label: "누출 시 참고사항", status: "NO_INFORMATION", items: [] },
  ],
};
it("shows selected source text automatically, preserves its ending and distinguishes absent information", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => approved }));
  render(<MaterialGuidance query="7647-01-0" enabled searched />);
  expect(await screen.findByText("Full text including a final DO NOT condition.")).toBeVisible();
  expect(screen.getByText(/검색한 물질의 참고자료/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "누출 시 참고사항" }));
  expect(screen.getByText(/안전하다는 뜻이 아닙니다/)).toBeVisible();
});
it("hides any unapproved sections and does not substitute demo text after a connection failure", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ ...approved, status: "PENDING_HUMAN_REVIEW" }) }).mockRejectedValueOnce(new Error("offline"));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<MaterialGuidance query="7647-01-0" enabled />);
  expect(await screen.findByText(/현재 조회 가능한 승인 자료가 없습니다/)).toBeVisible();
  expect(screen.queryByText(/Full text/)).not.toBeInTheDocument();
  view.rerender(<MaterialGuidance query="7681-52-9" enabled />);
  expect(await screen.findByRole("alert")).toHaveTextContent("자료 연결을 확인할 수 없습니다");
});
it("aborts old requests when the material changes", async () => {
  let finishOld!: (value: unknown) => void;
  vi.stubGlobal("fetch", vi.fn().mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; })).mockResolvedValueOnce({ ok: true, json: async () => ({ ...approved, name: "New material" }) }));
  const view = render(<MaterialGuidance query="old" enabled />);
  view.rerender(<MaterialGuidance query="new" enabled />);
  expect(await screen.findByText(/New material/)).toBeVisible();
  finishOld({ ok: true, json: async () => approved });
  expect(screen.queryByText(/^Fixture ·/)).not.toBeInTheDocument();
});
