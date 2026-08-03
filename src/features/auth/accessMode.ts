import type { UserFacingErrorInfo } from "../../api/client";
import type { DataMode } from "../../api/contracts";

export const DIRECT_ENTRY_DEFAULT_STATION = "현장대응본부";

export function resolveInitialStation(dataMode: DataMode, authEnabled: boolean, configuredName: string): string | null {
  if (authEnabled || (dataMode !== "LIVE_API" && dataMode !== "CACHED_API")) return null;
  return configuredName.trim() || DIRECT_ENTRY_DEFAULT_STATION;
}

export function adaptDirectEntryIssue(issue: UserFacingErrorInfo, authEnabled: boolean): UserFacingErrorInfo {
  if (authEnabled || issue.kind !== "SESSION_EXPIRED") return issue;
  return {
    ...issue,
    kind: "SERVICE_UNAVAILABLE",
    message: "BFF가 아직 인증 없는 직접 요청을 허용하지 않습니다. BE 배포 상태를 확인해주세요.",
    retryable: false,
  };
}
