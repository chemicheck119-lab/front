import { apiConfig } from "./config";
import { ApiError, apiRequest } from "./client";
import type { SpeechTranscriptionResponse } from "./contracts";

export const MAX_SPEECH_AUDIO_BYTES = 16 * 1024 * 1024;

const WAV_TYPES = new Set(["audio/wav", "audio/x-wav", "audio/wave"]);

export function validateWavUpload(audio: Blob) {
  if (audio.size <= 0 || audio.size > MAX_SPEECH_AUDIO_BYTES) {
    throw new ApiError("VALIDATION", "음성 파일은 비어 있지 않아야 하며 16 MiB 이하여야 합니다.");
  }
  if (audio.type && !WAV_TYPES.has(audio.type.toLowerCase())) {
    throw new ApiError("VALIDATION", "PCM WAV 음성만 전사할 수 있습니다.");
  }
}

export function assertSafeTranscription(
  response: SpeechTranscriptionResponse,
): SpeechTranscriptionResponse {
  const safe = response.schemaVersion === "chemicheck119-dashboard-bff-v1"
    && response.requiresResponderReview === true
    && response.input.audioRetained === false
    && response.runtime.hotwordsUsed === false
    && response.safetyBoundary.uncertaintyPreserved === true
    && response.safetyBoundary.qualitySignalsAreCalibratedProbabilities === false
    && response.safetyBoundary.chemicalIdentificationPerformed === false
    && response.safetyBoundary.casConfirmationPerformed === false
    && response.safetyBoundary.riskAssessmentPerformed === false
    && response.safetyBoundary.decisionSupportOnly === true;
  const stateConsistent = response.status === "TRANSCRIBED"
    ? !response.abstained && response.transcript.text.trim().length > 0
    : response.status === "ABSTAINED_NO_TRANSCRIPT"
      && response.abstained && response.transcript.text.length === 0;
  if (!safe || !stateConsistent) {
    throw new ApiError(
      "SAFETY",
      "전사 응답의 안전 책임 경계가 일치하지 않습니다.",
      response.requestId,
      false,
    );
  }
  return response;
}

export async function transcribeIncidentAudio(
  audio: Blob,
  incidentId?: string | null,
  signal?: AbortSignal,
): Promise<SpeechTranscriptionResponse> {
  if (!apiConfig.speechEnabled) {
    throw new ApiError("NOT_READY", "인증된 Speech API가 활성화되지 않았습니다.");
  }
  validateWavUpload(audio);
  const path = incidentId
    ? `/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/transcriptions`
    : "/api/c2guard/v1/transcriptions";
  const response = await apiRequest<SpeechTranscriptionResponse>(path, {
    method: "POST",
    body: audio,
    headers: { "Content-Type": "audio/wav" },
    signal,
  }, {
    timeoutMs: apiConfig.speechTimeoutMs,
    retry503: false,
  });
  return assertSafeTranscription(response);
}
