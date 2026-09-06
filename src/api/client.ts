import { apiConfig } from "./config";

export type ApiErrorKind =
  | "SESSION_EXPIRED"
  | "AUTH"
  | "SAFETY"
  | "VALIDATION"
  | "CONFLICT"
  | "NOT_READY"
  | "CONFIRMATION_REQUIRED"
  | "NO_EVIDENCE"
  | "NO_ROUTE"
  | "SPEECH_BUSY"
  | "SPEECH_UNAVAILABLE"
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
  if (code === "FAILED_SAFETY") return "SAFETY";
  if (status === 401) return "SESSION_EXPIRED";
  if (status === 403) return "AUTH";
  if (code === "MODEL_TIMEOUT") return "TIMEOUT";
  if (code === "MODEL_SERVICE_UNAVAILABLE") return "SERVICE_UNAVAILABLE";
  if (code === "SPEECH_BUSY") return "SPEECH_BUSY";
  if (code === "SPEECH_SERVICE_UNAVAILABLE") return "SPEECH_UNAVAILABLE";
  if (code === "SPEECH_CONTRACT_VIOLATION") return "SAFETY";
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

export interface ApiRequestPolicy {
  timeoutMs?: number;
  retry503?: boolean;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  policy: ApiRequestPolicy = {},
): Promise<T> {
  if (!apiConfig.baseUrl) throw new ApiError("NETWORK", "BFF 주소가 설정되지 않았습니다.");

  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromCaller();
  else externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, policy.timeoutMs ?? apiConfig.timeoutMs);
  try {
    const maximumAttempts = policy.retry503 === false ? 1 : 2;
    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      const response = await fetch(`${apiConfig.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        credentials: init.credentials ?? (apiConfig.authEnabled ? "include" : "omit"),
        headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
      });
      const body = await response.json().catch(() => ({}));
      const requestId = body.requestId ?? response.headers.get("x-request-id") ?? undefined;
      if (!response.ok) {
        const code = body.error?.code as string | undefined;
        const retryable = Boolean(body.error?.retryable);
        if (response.status === 503 && retryable && attempt + 1 < maximumAttempts) continue;
        throw new ApiError(errorKind(response.status, code), body.error?.message ?? "요청을 처리할 수 없습니다.", requestId, retryable);
      }
      return body as T;
    }
    throw new ApiError("SERVICE_UNAVAILABLE", "분석 서비스 재시도에 실패했습니다.", undefined, true);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError" && timedOut) throw new ApiError("TIMEOUT", "요청 시간이 초과되었습니다.", undefined, true);
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("NETWORK", "네트워크에 연결할 수 없습니다.", undefined, true);
  } finally {
    window.clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export interface UserFacingErrorInfo {
  message: string;
  requestId?: string;
  retryable: boolean;
  kind?: ApiErrorKind;
}

export function toUserFacingError(error: unknown): UserFacingErrorInfo {
  if (!(error instanceof ApiError)) return { message: "요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.", retryable: false };
  const messages: Record<ApiErrorKind, string> = {
    SESSION_EXPIRED: "로그인 세션이 만료되었거나 인증이 필요합니다.",
    AUTH: "이 사고에 접근할 권한이 없습니다.",
    SAFETY: "안전 검증에 실패했습니다. 결과 카드를 표시하지 않습니다.",
    VALIDATION: "입력 내용을 확인해주세요.",
    CONFLICT: "다른 요청에서 상태가 갱신되었습니다. 최신 결과를 다시 불러와주세요.",
    NOT_READY: "분석 자료가 아직 준비되지 않았습니다.",
    CONFIRMATION_REQUIRED: "사고물질과 시설물질의 현장 확인이 필요합니다.",
    NO_EVIDENCE: "공개 근거가 부족합니다. 현장 MSDS를 확인해주세요.",
    NO_ROUTE: "도로 경로를 불러올 수 없습니다.",
    SPEECH_BUSY: "음성 전사 요청이 많습니다. 잠시 후 직접 다시 시도해주세요.",
    SPEECH_UNAVAILABLE: "음성 전사 서비스를 사용할 수 없습니다. 직접 입력을 계속 사용할 수 있습니다.",
    SERVICE_UNAVAILABLE: "분석 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
    SERVER: "서버에서 요청을 처리하지 못했습니다.",
    NETWORK: "네트워크에 연결할 수 없습니다.",
    TIMEOUT: "응답 시간이 초과되었습니다. 다시 시도해주세요.",
  };
  return {
    message: messages[error.kind],
    requestId: error.requestId,
    retryable: error.retryable || error.kind === "CONFLICT",
    kind: error.kind,
  };
}

export function userFacingError(error: unknown): string {
  const info = toUserFacingError(error);
  return `${info.message}${info.requestId ? ` (요청 ID: ${info.requestId})` : ""}`;
}
