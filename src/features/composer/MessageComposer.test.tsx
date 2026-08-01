import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageComposer } from "./MessageComposer";

afterEach(cleanup);

function ComposerHarness({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <MessageComposer
      mode="substance"
      value={value}
      loading={false}
      unavailable={false}
      onChange={setValue}
      onSubmit={(submitted) => {
        onSubmit(submitted);
        setValue("");
      }}
    />
  );
}

describe("한글 IME 입력 제출", () => {
  it("조합을 확정하는 Enter에서는 검색하지 않고 다음 Enter에서 전체 문장을 제출한다", () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("물질명·CAS·화학식 또는 색·냄새·상태 입력…");

    fireEvent.compositionStart(textarea);
    fireEvent.change(textarea, { target: { value: "하얀색" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("하얀색");

    fireEvent.compositionEnd(textarea);
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("하얀색");
    expect(textarea).toHaveValue("");
  });

  it("조합 중 검색 버튼을 눌러도 마지막 글자를 남기지 않고 전체 문장을 제출한다", async () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText("물질명·CAS·화학식 또는 색·냄새·상태 입력…");

    fireEvent.compositionStart(textarea);
    fireEvent.change(textarea, { target: { value: "하얀색" } });
    fireEvent.click(screen.getByRole("button", { name: "물질 검색" }));

    // Safari/WebKit 계열에서 click 뒤에 늦게 도착하는 마지막 조합 입력을 재현합니다.
    fireEvent.compositionEnd(textarea);
    fireEvent.change(textarea, { target: { value: "색" } });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("하얀색"));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(textarea).toHaveValue("");
  });
});
