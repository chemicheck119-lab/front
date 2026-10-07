import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { LocalSourceReference } from "./LocalSourceReference.baseline";
import { MaterialGuidance, type Guidance } from "../MaterialGuidance";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

// Same synthetic source, query and fire-section task in both UIs. No chemical approval.
const body = "합성 실습 원문: 첫 문장.\n가운데 조건을 그대로 확인합니다.\n마지막 제한 조건: 현장 대응 지침으로 사용하지 마세요.";
const id = "SYNTHETIC:SECTION-5";
const title = "합성 화재 항목";
const guidance: Guidance = {
  status: "AVAILABLE", cas: "67-56-1", name: "합성 실습 자료",
  version: "synthetic-measurement-v1", collected_at: "2026-10-07",
  source_url: "https://www.data.go.kr/data/15157612/openapi.do",
  sections: [{ number: 5, label: "화재 시 참고사항", status: "AVAILABLE",
    items: [{ evidence_id: id, title, text: body }] }],
};

it("compares post-lookup disclosure actions against the archived UI and retains identical source text", async () => {
  const trials: Array<{ repetition: number; before_disclosure_actions: number;
    after_disclosure_actions: number; before_text_matches: boolean;
    after_text_matches: boolean; after_visible_items: number }> = [];
  for (let repetition = 1; repetition <= 3; repetition++) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      status: "AVAILABLE", collected_at: guidance.collected_at, version: guidance.version,
      candidate_counts: { input: 1, normal: 1, excluded: 0 },
      rows: [{ evidence_id: id, cas_number: guidance.cas, title, body }],
    }) }));
    render(<LocalSourceReference />);
    // Lookup itself is explicitly outside the metric; compare only after lookup succeeds.
    fireEvent.click(screen.getByRole("button", { name: "기준자료 조회" }));
    const summary = await screen.findByText(title);
    const detail = summary.closest("details")!;
    expect(detail).not.toHaveAttribute("open");
    expect(screen.getByText(body, { exact: true, normalizer: (text) => text })).not.toBeVisible();
    fireEvent.click(summary);
    await waitFor(() => expect(detail).toHaveAttribute("open"));
    const oldText = screen.getByText(body, { exact: true, normalizer: (text) => text });
    expect(oldText).toBeVisible();
    expect(oldText.textContent).toBe(body);
    cleanup();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => guidance }));
    render(<MaterialGuidance query="67-56-1" enabled searched />);
    const newText = await screen.findByText(body, { exact: true, normalizer: (text) => text });
    expect(newText).toBeVisible();
    expect(newText.textContent).toBe(body);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    trials.push({ repetition, before_disclosure_actions: 1, after_disclosure_actions: 0,
      before_text_matches: true, after_text_matches: true, after_visible_items: 1 });
    cleanup();
  }
  const directory = join(tmpdir(), "chemicheck119-outcome-measurement");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "ui-disclosure.json"), JSON.stringify({
    measured_at: new Date().toISOString(), scope: "AUTOMATED_SYNTHETIC_COMPONENT_ONLY",
    baseline_commit: "1e575ca", baseline_path: "src/features/reference/LocalSourceReference.tsx",
    current_component: "src/features/reference/MaterialGuidance.tsx",
    input_sha256: createHash("sha256").update(body).digest("hex"),
    metric: "additional disclosure actions after successful lookup for default fire section",
    excluded: ["lookup submission", "typing", "human reading time", "network latency", "approval time"],
    trials, human_time_measured: false, field_effectiveness_measured: false,
  }, null, 2) + "\n");
});
