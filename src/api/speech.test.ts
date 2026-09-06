import { afterEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "./config";
import type { SpeechTranscriptionResponse } from "./contracts";
import {
  assertSafeTranscription,
  MAX_SPEECH_AUDIO_BYTES,
  transcribeIncidentAudio,
  validateWavUpload,
} from "./speech";

const originalConfig = { ...apiConfig };

function response(overrides: Partial<SpeechTranscriptionResponse> = {}): SpeechTranscriptionResponse {
  return {
    schemaVersion: "chemicheck119-dashboard-bff-v1",
    requestId: "REQ-SPEECH-1",
    incidentId: null,
    status: "TRANSCRIBED",
    abstained: false,
    requiresResponderReview: true,
    transcript: {
      text: "아세톤 누출 의심",
      segments: [],
      audioSeconds: 1,
      voicedSeconds: 0.8,
    },
    input: {
      mediaType: "audio/wav",
      channels: 1,
      sampleWidthBits: 16,
      sampleRateHz: 16000,
      durationSeconds: 1,
      audioRetained: false,
    },
    runtime: {
      serviceVersion: "0.1.0",
      model: "faster-whisper-small",
      actualDevice: "cpu",
      actualComputeType: "int8",
      processingSeconds: 0.2,
      realTimeFactor: 0.2,
      hotwordsUsed: false,
    },
    safetyBoundary: {
      uncertaintyPreserved: true,
      qualitySignalsAreCalibratedProbabilities: false,
      chemicalIdentificationPerformed: false,
      casConfirmationPerformed: false,
      riskAssessmentPerformed: false,
      decisionSupportOnly: true,
    },
    ...overrides,
  };
}

function fetchResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: vi.fn().mockReturnValue(null) },
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("인증된 음성 전사 client", () => {
  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("사고 생성 전 WAV를 BFF에 한 번만 보내고 검토 필수 응답을 보존한다", async () => {
    Object.assign(apiConfig, {
      baseUrl: "https://bff.example.test",
      authEnabled: true,
      speechEnabled: true,
      speechTimeoutMs: 50000,
    });
    const fetchMock = vi.fn().mockResolvedValue(fetchResponse(200, response()));
    vi.stubGlobal("fetch", fetchMock);
    const wav = new Blob([new Uint8Array(44)], { type: "audio/wav" });

    const result = await transcribeIncidentAudio(wav);

    expect(result.requiresResponderReview).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://bff.example.test/api/c2guard/v1/transcriptions",
      expect.objectContaining({
        method: "POST",
        body: wav,
        credentials: "include",
        headers: expect.objectContaining({ "Content-Type": "audio/wav" }),
      }),
    );
  });

  it("사고 생성 후에는 encoded incident scope 경로를 사용한다", async () => {
    Object.assign(apiConfig, { baseUrl: "https://bff.example.test", speechEnabled: true });
    const fetchMock = vi.fn().mockResolvedValue(fetchResponse(200,
      response({ incidentId: "INC A/1" })));
    vi.stubGlobal("fetch", fetchMock);

    await transcribeIncidentAudio(
      new Blob([new Uint8Array(44)], { type: "audio/wav" }),
      "INC A/1",
    );

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://bff.example.test/api/c2guard/v1/incidents/INC%20A%2F1/transcriptions",
    );
  });

  it("전사는 retryable 503도 자동 재시도하지 않는다", async () => {
    Object.assign(apiConfig, { baseUrl: "https://bff.example.test", speechEnabled: true });
    const fetchMock = vi.fn().mockResolvedValue(fetchResponse(503, {
      requestId: "REQ-SPEECH-BUSY",
      error: { code: "SPEECH_SERVICE_UNAVAILABLE", message: "internal", retryable: true },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(transcribeIncidentAudio(
      new Blob([new Uint8Array(44)], { type: "audio/wav" }),
    )).rejects.toMatchObject({ kind: "SPEECH_UNAVAILABLE", retryable: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("위험 판단 또는 원본 저장을 주장하는 응답은 숨긴다", () => {
    expect(() => assertSafeTranscription(response({
      safetyBoundary: {
        ...response().safetyBoundary,
        riskAssessmentPerformed: true as false,
      },
    }))).toThrowError(expect.objectContaining({ kind: "SAFETY" }));

    expect(() => assertSafeTranscription(response({
      input: { ...response().input, audioRetained: true as false },
    }))).toThrowError(expect.objectContaining({ kind: "SAFETY" }));
  });

  it("파일 크기와 형식을 추론 요청 전에 검사한다", () => {
    expect(() => validateWavUpload(new Blob([], { type: "audio/wav" })))
      .toThrowError(expect.objectContaining({ kind: "VALIDATION" }));
    expect(() => validateWavUpload(new Blob(
      [new Uint8Array(MAX_SPEECH_AUDIO_BYTES + 1)], { type: "audio/wav" },
    ))).toThrowError(expect.objectContaining({ kind: "VALIDATION" }));
    expect(() => validateWavUpload(new Blob(["audio"], { type: "audio/webm" })))
      .toThrowError(expect.objectContaining({ kind: "VALIDATION" }));
  });
});
