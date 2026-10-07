// Deliberately limited to whitespace variants. Sound-alike words are never guessed.
const terms = ["차아염소산나트륨", "수산화나트륨", "염산", "황산"];
export type TermSuggestion = { start: number; end: number; original: string; candidate: string };

export function suggestTranscriptTerms(text: string): TermSuggestion[] {
  const suggestions: TermSuggestion[] = [];
  for (const term of terms) {
    const pattern = new RegExp(term.split("").join("[ \\t]*") +
      "(?=$|[\\s.,!?]|(?:입니다|에서|으로|이|가|을|를|은|는|에|의|과|와|도|로)(?=$|[\\s.,!?]))", "g");
    for (const match of text.matchAll(pattern)) {
      const start = match.index!;
      if (start > 0 && /[가-힣A-Za-z0-9]/.test(text[start - 1])) continue;
      if (match[0] === term || suggestions.some((item) => start < item.end && start + match[0].length > item.start)) continue;
      suggestions.push({ start, end: start + match[0].length, original: match[0], candidate: term });
    }
  }
  return suggestions.sort((a, b) => a.start - b.start);
}

export function applyTranscriptSuggestion(text: string, suggestion: TermSuggestion): string {
  if (text.slice(suggestion.start, suggestion.end) !== suggestion.original) return text;
  return text.slice(0, suggestion.start) + suggestion.candidate + text.slice(suggestion.end);
}

export function TranscriptTermReview({ original, draft, disabled, onChange }: {
  original: string; draft: string; disabled: boolean; onChange: (text: string) => void;
}) {
  const suggestions = suggestTranscriptTerms(draft);
  return <section aria-label="전사 용어 확인">
    <details><summary>수신한 원문 확인</summary><p style={{ whiteSpace: "pre-wrap" }}>{original}</p></details>
    {suggestions.length > 0 && <>
      <p>용어 띄어쓰기 후보입니다. 들은 내용과 일치할 때만 적용하세요. 물질 확정은 아닙니다.</p>
      {suggestions.map((suggestion) => <button key={suggestion.start} type="button" disabled={disabled}
        onClick={() => onChange(applyTranscriptSuggestion(draft, suggestion))}>
        {suggestion.original} → {suggestion.candidate} 적용
      </button>)}
    </>}
  </section>;
}
