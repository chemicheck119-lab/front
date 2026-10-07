import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LocalSourceReference } from "./LocalSourceReference";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("hides unapproved bodies and reports a connection failure without demo fallback", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({
    status: "PENDING_HUMAN_REVIEW", rows: [{ body: "must stay hidden" }],
    candidate_counts: { input: 146, normal: 94, excluded: 52 }, collected_at: "2026-10-06",
  }) }).mockRejectedValueOnce(new Error("offline"));
  vi.stubGlobal("fetch", fetcher);
  render(<LocalSourceReference />);
  fireEvent.click(screen.getByRole("button", { name: "기준자료 조회" }));
  expect(await screen.findByRole("status")).toHaveTextContent("검토·승인 대기");
  expect(screen.queryByText("must stay hidden")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "기준자료 조회" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("자료 조회 연결");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("shows approved original text and its provenance", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    status: "AVAILABLE", version: "fixture-version", collected_at: "2026-10-06",
    candidate_counts: { input: 1, normal: 1, excluded: 0 },
    rows: [{ evidence_id: "fixture-id", cas_number: "67-56-1", title: "Fixture title", body: "Original fixture text" }],
  }) }));
  render(<LocalSourceReference />);
  fireEvent.click(screen.getByRole("button", { name: "기준자료 조회" }));
  expect(await screen.findByText("Fixture title")).toBeInTheDocument();
  expect(screen.getByText("Original fixture text")).toBeInTheDocument();
  expect(screen.getByText(/fixture-version/)).toBeInTheDocument();
});
