import { useEffect, useRef, type KeyboardEvent } from "react";
import { Search, Send } from "lucide-react";

type ComposerMode = "collision" | "substance";

interface MessageComposerProps {
  mode: ComposerMode;
  value: string;
  loading: boolean;
  unavailable: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function MessageComposer({
  mode,
  value,
  loading,
  unavailable,
  onChange,
  onSubmit,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const compositionText = useRef("");
  const deferredSubmitTimer = useRef<number | null>(null);
  const submitDisabled = !value.trim() || loading || unavailable;

  useEffect(() => () => {
    if (deferredSubmitTimer.current !== null) {
      window.clearTimeout(deferredSubmitTimer.current);
    }
  }, []);

  function submit(rawValue: string) {
    if (!rawValue.trim() || loading || unavailable) return;
    onSubmit(rawValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    // Enter first confirms the active Korean/Japanese/Chinese IME composition.
    // Submitting here would clear React state before compositionend writes the
    // final syllable, leaving that one character in the controlled textarea.
    if (event.nativeEvent.isComposing || isComposing.current) return;

    event.preventDefault();
    submit(event.currentTarget.value);
  }

  function handleButtonClick() {
    const textarea = textareaRef.current;

    if (!isComposing.current) {
      submit(textarea?.value ?? value);
      return;
    }

    // Safari/WebKit can dispatch the button click before the final Korean IME
    // input event. Blur first, then read the DOM after compositionend. Keep the
    // longest composed snapshot as a guard against a late event containing only
    // the final syllable.
    textarea?.blur();
    if (deferredSubmitTimer.current !== null) {
      window.clearTimeout(deferredSubmitTimer.current);
    }
    deferredSubmitTimer.current = window.setTimeout(() => {
      deferredSubmitTimer.current = null;
      isComposing.current = false;
      const candidates = [textarea?.value ?? "", compositionText.current, value];
      const completedValue = candidates.reduce((longest, candidate) => (
        candidate.length > longest.length ? candidate : longest
      ), "");
      compositionText.current = "";
      submit(completedValue);
    }, 0);
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          if (isComposing.current && event.target.value.length >= compositionText.current.length) {
            compositionText.current = event.target.value;
          }
          onChange(event.target.value);
        }}
        onCompositionStart={(event) => {
          isComposing.current = true;
          compositionText.current = event.currentTarget.value;
        }}
        onCompositionEnd={(event) => {
          isComposing.current = false;
          if (event.currentTarget.value.length >= compositionText.current.length) {
            compositionText.current = event.currentTarget.value;
          }
          if (deferredSubmitTimer.current === null) compositionText.current = "";
        }}
        onKeyDown={handleKeyDown}
        rows={2}
        className="min-h-[60px] flex-1 resize-none rounded-xl border border-border bg-input-background px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        placeholder={mode === "collision" ? "신고 내용과 확인된 상황을 입력하세요…" : "물질명·CAS·화학식 또는 색·냄새·상태 입력…"}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={submitDisabled}
        className="flex h-[60px] min-w-[112px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-40"
        aria-label={mode === "collision" ? "사고 분석" : "물질 검색"}
      >
        {mode === "collision" ? <><Send size={15} />분석 시작</> : <><Search size={15} />검색</>}
      </button>
    </div>
  );
}
