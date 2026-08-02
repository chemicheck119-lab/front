import { ApiError } from "./client";
import { apiConfig } from "./config";

export interface IncidentReplayEnvelope {
  schemaVersion: "chemicheck119-incident-envelope-v1";
  incidentId: string;
  sourceEventId: string;
  idempotencyKey: string;
  receivedAt: string;
  occurredAt: string;
  stationId: string;
  stationDisplayName: string;
  facilityName: string;
  addressText: string;
  location: { latitude: number; longitude: number };
  reportText: string;
  sourceType: "SYNTHETIC_DISPATCH_REPLAY";
  dataClassification: "PUBLIC_SYNTHETIC";
  sourceProvider: "CHEMICHECK119_PUBLIC_REPLAY";
  sourceSchemaVersion: "public-replay-v1";
  requestId: string;
  containsPersonalInformation: false;
  disclosure: string;
  datasetReferences: Array<{ name: string; url: string; usage: string }>;
}

const CONTEST_REPLAY_PATH =
  "/api/c2guard/v1/intake/replay-stream/CONTEST-LIVE-CHEMICAL-001";

function requiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseIncidentReplayEnvelope(value: unknown): IncidentReplayEnvelope {
  if (!value || typeof value !== "object") {
    throw new ApiError("SAFETY", "지령 envelope 형식이 아닙니다.");
  }
  const envelope = value as Partial<IncidentReplayEnvelope>;
  const safeBoundary = envelope.schemaVersion === "chemicheck119-incident-envelope-v1"
    && envelope.sourceType === "SYNTHETIC_DISPATCH_REPLAY"
    && envelope.dataClassification === "PUBLIC_SYNTHETIC"
    && envelope.sourceProvider === "CHEMICHECK119_PUBLIC_REPLAY"
    && envelope.containsPersonalInformation === false;
  const requiredValues = [
    envelope.incidentId,
    envelope.sourceEventId,
    envelope.idempotencyKey,
    envelope.receivedAt,
    envelope.occurredAt,
    envelope.stationId,
    envelope.stationDisplayName,
    envelope.facilityName,
    envelope.addressText,
    envelope.reportText,
    envelope.requestId,
    envelope.disclosure,
  ];
  const latitude = envelope.location?.latitude;
  const longitude = envelope.location?.longitude;
  const validLocation = Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude! >= -90 && latitude! <= 90
    && longitude! >= -180 && longitude! <= 180;
  if (!safeBoundary || !requiredValues.every(requiredString) || !validLocation) {
    throw new ApiError(
      "SAFETY",
      "공개 합성 지령의 출처·개인정보 경계를 검증할 수 없습니다.",
      envelope.requestId,
    );
  }
  return envelope as IncidentReplayEnvelope;
}

export function parseIncidentReplaySse(body: string): IncidentReplayEnvelope {
  const eventBlocks = body.split(/\r?\n\r?\n/).filter(Boolean);
  for (const block of eventBlocks) {
    const lines = block.split(/\r?\n/);
    const eventName = lines.find((line) => line.startsWith("event:"))
      ?.slice("event:".length).trim();
    if (eventName !== "incident.accepted") continue;
    const data = lines.filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart())
      .join("\n");
    try {
      return parseIncidentReplayEnvelope(JSON.parse(data));
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("SAFETY", "지령 event JSON을 검증할 수 없습니다.");
    }
  }
  throw new ApiError("SAFETY", "incident.accepted 지령 event가 없습니다.");
}

function responseError(status: number, requestId?: string) {
  if (status === 401) return new ApiError("SESSION_EXPIRED", "지령 수신 인증이 필요합니다.", requestId);
  if (status === 403) return new ApiError("AUTH", "지령 수신 권한이 없습니다.", requestId);
  if (status === 404) return new ApiError("NOT_READY", "공개 합성 지령 replay가 준비되지 않았습니다.", requestId);
  if (status === 503) return new ApiError("SERVICE_UNAVAILABLE", "지령 replay 서비스가 준비되지 않았습니다.", requestId, true);
  return new ApiError("SERVER", "지령 replay 요청을 처리할 수 없습니다.", requestId);
}

export async function receiveContestIncident(signal?: AbortSignal): Promise<IncidentReplayEnvelope> {
  if (!apiConfig.baseUrl) throw new ApiError("NETWORK", "BFF 주소가 설정되지 않았습니다.");

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, apiConfig.timeoutMs);

  try {
    const response = await fetch(`${apiConfig.baseUrl}${CONTEST_REPLAY_PATH}`, {
      method: "GET",
      headers: { Accept: "text/event-stream" },
      credentials: apiConfig.authEnabled ? "include" : "omit",
      signal: controller.signal,
    });
    const requestId = response.headers.get("x-request-id") ?? undefined;
    if (!response.ok) throw responseError(response.status, requestId);
    return parseIncidentReplaySse(await response.text());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError" && timedOut) {
      throw new ApiError("TIMEOUT", "지령 수신 시간이 초과되었습니다.", undefined, true);
    }
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("NETWORK", "지령 스트림에 연결할 수 없습니다.", undefined, true);
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
