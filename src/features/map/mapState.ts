import type { RouteSnapshot } from "../../api/contracts";

export type LocationState = "WAITING" | "ACTIVE" | "STALE" | "LOW_ACCURACY" | "DENIED" | "UNAVAILABLE" | "ERROR" | "DEMO";

export interface LocationPresentation {
  label: string;
  detail: string;
  tone: "good" | "waiting" | "bad" | "demo";
  usableForRoute: boolean;
}

export function getLocationPresentation(
  state: LocationState,
  observedAt?: string | null,
  accuracyM?: number | null,
  now = Date.now(),
): LocationPresentation {
  if (state === "DEMO") return { label: "시연 위치", detail: "실제 GPS가 아닙니다", tone: "demo", usableForRoute: true };
  if (state === "DENIED") return { label: "위치 권한 거부", detail: "브라우저 설정에서 위치 권한을 허용해주세요", tone: "bad", usableForRoute: false };
  if (state === "UNAVAILABLE") return { label: "GPS 사용 불가", detail: "이 기기에서 위치를 확인할 수 없습니다", tone: "bad", usableForRoute: false };
  if (state === "ERROR") return { label: "GPS 오류", detail: "위치 신호를 다시 확인합니다", tone: "bad", usableForRoute: false };
  if (state === "WAITING" || !observedAt) return { label: "GPS 수신 대기", detail: "현재 위치를 확인하고 있습니다", tone: "waiting", usableForRoute: false };

  const ageMs = now - new Date(observedAt).getTime();
  if (state === "STALE" || ageMs > 5 * 60 * 1000) {
    return { label: "오래된 위치", detail: `${Math.max(1, Math.floor(ageMs / 60000))}분 전 수신`, tone: "bad", usableForRoute: false };
  }
  if (state === "LOW_ACCURACY" || (accuracyM ?? 0) > 100) {
    return { label: "낮은 정확도", detail: `오차 약 ${Math.round(accuracyM ?? 0)}m`, tone: "waiting", usableForRoute: true };
  }
  return { label: "GPS 정상", detail: accuracyM ? `오차 약 ${Math.round(accuracyM)}m` : "방금 갱신", tone: "good", usableForRoute: true };
}

export function canRenderRoute(route: RouteSnapshot): boolean {
  return (route.status === "AVAILABLE" || route.status === "DEMO_SIMULATION")
    && route.geometry?.type === "LineString"
    && route.geometry.coordinates.length >= 2;
}

export function formatEta(seconds?: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  if (seconds < 60) return "1분 미만";
  return `${Math.ceil(seconds / 60)}분`;
}

export function formatDistance(meters?: number | null): string {
  if (meters == null || meters < 0) return "—";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}
