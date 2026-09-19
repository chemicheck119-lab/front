import { apiConfig } from "./config";
import { ApiError } from "./client";

export type PhoneTranscriptPhase = "INTERIM" | "FINAL";
export type PhoneTranscriptReviewStatus = "INTERIM" | "PENDING_REVIEW";

export interface PhoneTranscriptEvent {
  eventId: number;
  incidentId: string;
  transcriptId: string;
  callId: string;
  text: string;
  language?: string | null;
  isFinal: boolean;
  reviewStatus: PhoneTranscriptReviewStatus;
  receivedAt: string;
}

export interface PhoneTranscriptSubscription {
  close: () => void;
}

export function subscribeToPhoneTranscripts(
  incidentId: string,
  onTranscript: (event: PhoneTranscriptEvent) => void,
  onError?: () => void,
): PhoneTranscriptSubscription {
  if (!apiConfig.baseUrl || !apiConfig.authEnabled) {
    throw new ApiError("NOT_READY", "인증된 전화 transcript 스트림이 활성화되지 않았습니다.");
  }
  const stream = new EventSource(
    `${apiConfig.baseUrl}/api/c2guard/v1/incidents/${encodeURIComponent(incidentId)}/phone-transcripts/stream`,
    { withCredentials: true },
  );
  const handleMessage = (message: MessageEvent<string>) => {
    try {
      onTranscript(JSON.parse(message.data) as PhoneTranscriptEvent);
    } catch {
      onError?.();
    }
  };
  stream.addEventListener("phone.transcript", handleMessage);
  stream.onerror = () => onError?.();
  return {
    close: () => {
      stream.removeEventListener("phone.transcript", handleMessage);
      stream.close();
    },
  };
}

