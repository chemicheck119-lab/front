import { apiConfig } from "./config";
import { ApiError, apiRequest } from "./client";
import type { PhoneSessionResponse, PhoneTranscriptEvent, PhoneTranscriptReviewRequest } from "./contracts";
export type { PhoneTranscriptEvent } from "./contracts";

export type PhoneTranscriptPhase = "INTERIM" | "FINAL";
export type PhoneTranscriptReviewStatus = PhoneTranscriptEvent["reviewStatus"];

export interface PhoneTranscriptSubscription {
  close: () => void;
}

export function createPhoneSession(): Promise<PhoneSessionResponse> {
  return apiRequest<PhoneSessionResponse>("/api/c2guard/v1/phone-sessions", {
    method: "POST",
  });
}

export function reviewPhoneTranscript(
  incidentId: string,
  transcriptId: string,
  payload: PhoneTranscriptReviewRequest,
): Promise<PhoneTranscriptEvent> {
  return apiRequest<PhoneTranscriptEvent>(
    `/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/phone-transcripts/${encodeURIComponent(transcriptId)}/review`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function subscribeToPhoneTranscripts(
  incidentId: string,
  onTranscript: (event: PhoneTranscriptEvent) => void,
  onError?: () => void,
  onConnected?: () => void,
): PhoneTranscriptSubscription {
  if (!apiConfig.baseUrl || !apiConfig.authEnabled) {
    throw new ApiError("NOT_READY", "인증된 전화 transcript 스트림이 활성화되지 않았습니다.");
  }
  const stream = new EventSource(
    `${apiConfig.baseUrl}/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/phone-transcripts/stream`,
    { withCredentials: true },
  );
  const latestRevisionByTranscript = new Map<string, number>();
  const latestSegmentByCall = new Map<string, number>();
  const handleMessage = (message: MessageEvent<string>) => {
    try {
      const event = parsePhoneTranscriptEvent(message.data, incidentId);
      const knownRevision = latestRevisionByTranscript.get(event.transcriptId) ?? -1;
      if (event.revision <= knownRevision) return;
      if (event.revision === 0 && event.segmentIndex != null) {
        const knownSegment = latestSegmentByCall.get(event.callId) ?? -1;
        if (event.segmentIndex < knownSegment) return;
        latestSegmentByCall.set(event.callId, event.segmentIndex);
      }
      latestRevisionByTranscript.set(event.transcriptId, event.revision);
      onTranscript(event);
    } catch {
      onError?.();
    }
  };
  stream.addEventListener("phone.transcript", handleMessage);
  stream.onerror = () => onError?.();
  stream.onopen = () => onConnected?.();
  return {
    close: () => {
      stream.removeEventListener("phone.transcript", handleMessage);
      stream.close();
    },
  };
}

export function parsePhoneTranscriptEvent(payload: string, expectedIncidentId: string): PhoneTranscriptEvent {
  const value: unknown = JSON.parse(payload);
  if (!value || typeof value !== "object") throw new Error("invalid phone transcript event");
  const event = value as Partial<PhoneTranscriptEvent>;
  const statuses: PhoneTranscriptReviewStatus[] = ["INTERIM", "FINAL_PENDING_REVIEW", "REVIEWED", "ANALYZED"];
  if (
    event.incidentId !== expectedIncidentId
    || typeof event.eventId !== "string"
    || typeof event.transcriptId !== "string"
    || typeof event.callId !== "string"
    || typeof event.text !== "string"
    || typeof event.isFinal !== "boolean"
    || typeof event.revision !== "number"
    || !Number.isSafeInteger(event.revision)
    || event.revision < 0
    || !statuses.includes(event.reviewStatus as PhoneTranscriptReviewStatus)
    || event.eventId !== `${event.transcriptId}:r${event.revision}`
    || (event.reviewStatus === "INTERIM") === event.isFinal
  ) {
    throw new Error("invalid phone transcript event");
  }
  return event as PhoneTranscriptEvent;
}
