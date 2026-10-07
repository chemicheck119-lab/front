import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applyTranscriptSuggestion, suggestTranscriptTerms } from "./TranscriptTermReview";

it("only suggests exact whitespace variants and leaves uncertain, negated and compound words intact", () => {
  expect(suggestTranscriptTerms("염 선인지 모릅니다. 수소인지 산소인지 모릅니다.")).toEqual([]);
  expect(suggestTranscriptTerms("염산이 아닙니다. 염 산화 반응" )).toEqual([]);
  const text = "염 산이 아니라 황 산입니다. 차아 염소산 나트륨은 없습니다.";
  const suggestions = suggestTranscriptTerms(text);
  expect(suggestions.map((item) => item.candidate)).toEqual(["염산", "황산", "차아염소산나트륨"]);
  let corrected = text;
  for (const suggestion of [...suggestions].reverse()) corrected = applyTranscriptSuggestion(corrected, suggestion);
  expect(corrected).toBe("염산이 아니라 황산입니다. 차아염소산나트륨은 없습니다.");
  expect(applyTranscriptSuggestion("내용이 바뀌었습니다.", suggestions[0])).toBe("내용이 바뀌었습니다.");
});

it("records paired synthetic formatting cases without claiming ASR improvement", () => {
  const cases = [
    { input: "염 산이 누출됐습니다.", expected: "염산이 누출됐습니다.", suggestions: 1 },
    { input: "황 산입니다.", expected: "황산입니다.", suggestions: 1 },
    { input: "차아 염소산 나트륨은 없습니다.", expected: "차아염소산나트륨은 없습니다.", suggestions: 1 },
    { input: "염산이 아닙니다.", expected: "염산이 아닙니다.", suggestions: 0 },
    { input: "염 선인지 모릅니다.", expected: "염 선인지 모릅니다.", suggestions: 0 },
    { input: "수소인지 산소인지 모릅니다.", expected: "수소인지 산소인지 모릅니다.", suggestions: 0 },
  ];
  const results = cases.map((item, index) => {
    const candidates = suggestTranscriptTerms(item.input);
    expect(candidates).toHaveLength(item.suggestions);
    let reviewed = item.input;
    // Simulated operator selection, not automatic model output or a real user measurement.
    for (const candidate of [...candidates].reverse()) reviewed = applyTranscriptSuggestion(reviewed, candidate);
    expect(reviewed).toBe(item.expected);
    return { case_id: index + 1, candidate_count: candidates.length,
      before_exact_match: item.input === item.expected, after_simulated_selection_exact_match: reviewed === item.expected,
      input_unchanged: item.input === cases[index].input };
  });
  const directory = join(tmpdir(), "chemicheck119-transcript-review");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "paired-results.json"), JSON.stringify({
    measured_at: new Date().toISOString(), scope: "SYNTHETIC_TEXT_POSTPROCESSING_ONLY",
    method: "explicit whitespace suggestions with simulated operator selection",
    cases_sha256: createHash("sha256").update(JSON.stringify(cases)).digest("hex"),
    results, real_audio_tested: false, model_trained: false, human_time_measured: false,
    wer_cer_improvement_claimed: false,
  }, null, 2) + "\n");
});
