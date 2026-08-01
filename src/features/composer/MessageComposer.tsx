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
    const composedValue = textarea?.value ?? value;

    if (!isComposing.current) {
      submit(composedValue);
      return;
    }

    // A pointer click can arrive before the browser has delivered the final
    // composition/input events. Keep the complete pre-blur value and clear it
    // only after those events have finished in the current task.
    textarea?.blur();
    if (deferredSubmitTimer.current !== null) {
      window.clearTimeout(deferredSubmitTimer.current);
    }
    deferredSubmitTimer.current = window.setTimeout(() => {
      deferredSubmitTimer.current = null;
      isComposing.current = false;
      submit(composedValue);
    }, 0);
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; }}
        onKeyDown={handleKeyDown}
        rows={2}
        className="min-h-[52px] flex-1 resize-none rounded-xl border border-border bg-input-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
        placeholder={mode === "collision" ? "신고 내용과 확인된 상황을 입력하세요…" : "물질명·CAS·화학식 또는 색·냄새·상태 입력…"}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={submitDisabled}
        className="grid h-[52px] w-[52px] place-items-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
        aria-label={mode === "collision" ? "사고 분석" : "물질 검색"}
      >
        {mode === "collision" ? <Send size={16} /> : <Search size={16} />}
      </button>
    </div>
  );
}
