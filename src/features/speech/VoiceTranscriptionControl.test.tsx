import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeechTranscriptionResponse } from "../../api/contracts";
import { transcribeIncidentAudio } from "../../api/speech";
import { recordedBlobToPcmWav } from "./wav";
import { VoiceTranscriptionControl } from "./VoiceTranscriptionControl";

vi.mock("../../api/speech", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../api/speech")>();
  return { ...original, transcribeIncidentAudio: vi.fn() };
});

vi.mock("./wav", async (importOriginal) => {
  const original = await importOriginal<typeof import("./wav")>();
  return {
    ...original,
    recordedBlobToPcmWav: vi.fn().mockResolvedValue(
      new Blob([new Uint8Array(44)], { type: "audio/wav" }),
    ),
  };
});

const transcribeMock = vi.mocked(transcribeIncidentAudio);
const convertMock = vi.mocked(recordedBlobToPcmWav);

function successfulResponse(): SpeechTranscriptionResponse {
  return {
    schemaVersion: "chemicheck119-dashboard-bff-v1",
    requestId: "REQ-SPEECH-UI",
    incidentId: null,
    status: "TRANSCRIBED",
    abstained: false,
    requiresResponderReview: true,
    transcript: { text: "아세톤 누출 의심", segments: [], audioSeconds: 1, voicedSeconds: 1 },
    input: { mediaType: "audio/wav", channels: 1, sampleWidthBits: 16, sampleRateHz: 16000, durationSeconds: 1, audioRetained: false },
    runtime: { serviceVersion: "0.1.0", model: "small", actualDevice: "cpu", actualComputeType: "int8", processingSeconds: 0.2, realTimeFactor: 0.2, hotwordsUsed: false },
    safetyBoundary: { uncertaintyPreserved: true, qualitySignalsAreCalibratedProbabilities: false, chemicalIdentificationPerformed: false, casConfirmationPerformed: false, riskAssessmentPerformed: false, decisionSupportOnly: true },
  };
}

describe("Pad 음성 전사 control", () => {
  beforeEach(() => {
    transcribeMock.mockReset();
    convertMock.mockClear();
    transcribeMock.mockResolvedValue(successfulResponse());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("선택한 WAV를 자동 분석하지 않고 전사 callback으로만 전달한다", async () => {
    const onTranscribed = vi.fn();
    const onBusyChange = vi.fn();
    render(<VoiceTranscriptionControl disabled={false} incidentId={null}
      onBusyChange={onBusyChange} onTranscribed={onTranscribed} />);

    const file = new File([new Uint8Array(44)], "approved.wav", { type: "audio/wav" });
    fireEvent.change(screen.getByLabelText("PCM WAV 파일 선택"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(onTranscribed).toHaveBeenCalledWith("아세톤 누출 의심"));
    expect(transcribeMock).toHaveBeenCalledWith(file, null, expect.any(AbortSignal));
    expect(screen.getByRole("status")).toHaveTextContent("반드시 듣고 수정");
    expect(onBusyChange).toHaveBeenCalledWith(true);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it("Speech 기권 시 빈 전사문을 입력하지 않는다", async () => {
    transcribeMock.mockResolvedValue({
      ...successfulResponse(),
      status: "ABSTAINED_NO_TRANSCRIPT",
      abstained: true,
      transcript: { text: "", segments: [], audioSeconds: 1, voicedSeconds: 0 },
    });
    const onTranscribed = vi.fn();
    render(<VoiceTranscriptionControl disabled={false}
      onBusyChange={vi.fn()} onTranscribed={onTranscribed} />);

    fireEvent.change(screen.getByLabelText("PCM WAV 파일 선택"), {
      target: { files: [new File([new Uint8Array(44)], "silence.wav", { type: "audio/wav" })] },
    });

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("기권"));
    expect(onTranscribed).not.toHaveBeenCalled();
  });

  it("microphone 녹음 중지 후 track을 닫고 PCM WAV로 변환한다", async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });

    class FakeMediaRecorder {
      static isTypeSupported() { return true; }
      state: RecordingState = "inactive";
      mimeType = "audio/webm;codecs=opus";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["encoded"]) } as BlobEvent);
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    const onTranscribed = vi.fn();
    render(<VoiceTranscriptionControl disabled={false} incidentId="INC-1"
      onBusyChange={vi.fn()} onTranscribed={onTranscribed} />);

    fireEvent.click(screen.getByRole("button", { name: "음성 녹음 시작" }));
    await screen.findByRole("button", { name: "음성 녹음 중지" });
    fireEvent.click(screen.getByRole("button", { name: "음성 녹음 중지" }));

    await waitFor(() => expect(onTranscribed).toHaveBeenCalledWith("아세톤 누출 의심"));
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(convertMock).toHaveBeenCalledOnce();
    expect(transcribeMock).toHaveBeenCalledWith(expect.any(Blob), "INC-1", expect.any(AbortSignal));
  });
});
