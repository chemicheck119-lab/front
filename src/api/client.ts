import { apiConfig } from "./config";

export type ApiErrorKind =
  | "AUTH"
  | "VALIDATION"
  | "CONFLICT"
  | "NOT_READY"
  | "CONFIRMATION_REQUIRED"
  | "NO_EVIDENCE"
  | "NO_ROUTE"
  | "SERVICE_UNAVAILABLE"
  | "SERVER"
  | "NETWORK"
  | "TIMEOUT";

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly requestId?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorKind(status: number, code?: string): ApiErrorKind {
  if (status === 401 || status === 403) return "AUTH";
  if (code === "MODEL_TIMEOUT") return "TIMEOUT";
  if (code === "MODEL_SERVICE_UNAVAILABLE") return "SERVICE_UNAVAILABLE";
  if (code === "INCIDENT_REFERENCE_CONFLICT" || status === 409) return "CONFLICT";
  if (code === "MODEL_CONTRACT_VIOLATION") return "SERVER";
  if (code?.includes("CONFIRMATION")) return "CONFIRMATION_REQUIRED";
  if (code?.includes("EVIDENCE")) return "NO_EVIDENCE";
  if (code && ["ROUTE_UNAVAILABLE", "ROUTE_ENDPOINT_MISMATCH", "INCIDENT_LOCATION_REQUIRED", "RESPONDER_POSITION_REQUIRED", "POSITION_STALE"].includes(code)) return "NO_ROUTE";
  if (code?.includes("ARTIFACT") || code?.includes("INDEX_NOT_AVAILABLE") || code?.includes("PROFILE_INDEX")) return "NOT_READY";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  if (status === 504) return "TIMEOUT";
  return "SERVER";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiConfig.baseUrl) throw new ApiError("NETWORK", "BFF 주소가 설정되지 않았습니다.");

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: init.credentials ?? "include",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
    const body = await response.json().catch(() => ({}));
    const requestId = body.requestId ?? response.headers.get("x-request-id") ?? undefined;
    if (!response.ok) {
      const code = body.error?.code as string | undefined;
      throw new ApiError(errorKind(response.status, code), body.error?.message ?? "요청을 처리할 수 없습니다.", requestId, Boolean(body.error?.retryable));
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError("TIMEOUT", "요청 시간이 초과되었습니다.", undefined, true);
    throw new ApiError("NETWORK", "네트워크에 연결할 수 없습니다.", undefined, true);
  } finally {
    window.clearTimeout(timer);
  }
}

export function userFacingError(error: unknown): string {
  if (!(error instanceof ApiError)) return "요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.";
  const messages: Record<ApiErrorKind, string> = {
    AUTH: "로그인 또는 사고 접근 권한을 확인해주세요.",
    VALIDATION: "입력 내용을 확인해주세요.",
    CONFLICT: "사고 식별 정보가 현재 대응 기록과 일치하지 않습니다.",
    NOT_READY: "분석 자료가 아직 준비되지 않았습니다.",
    CONFIRMATION_REQUIRED: "사고물질과 시설물질의 현장 확인이 필요합니다.",
    NO_EVIDENCE: "공개 근거가 부족합니다. 현장 MSDS를 확인해주세요.",
    NO_ROUTE: "도로 경로를 불러올 수 없습니다.",
    SERVICE_UNAVAILABLE: "분석 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
    SERVER: "서버에서 요청을 처리하지 못했습니다.",
    NETWORK: "네트워크에 연결할 수 없습니다.",
    TIMEOUT: "응답 시간이 초과되었습니다. 다시 시도해주세요.",
  };
  return `${messages[error.kind]}${error.requestId ? ` (요청 ID: ${error.requestId})` : ""}`;
}
