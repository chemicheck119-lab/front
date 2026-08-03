import type { DataMode } from "./contracts";

const normalizedBaseUrl = (import.meta.env.VITE_BFF_BASE_URL ?? "").replace(/\/$/, "");
const demoEnabled = import.meta.env.VITE_ENABLE_DEMO_MODE === "true";
const authEnabled = import.meta.env.VITE_ENABLE_AUTH === "true";
const mapPublicToken = import.meta.env.VITE_MAP_PUBLIC_TOKEN?.trim() ?? "";

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function mapStyleUrlWithPublicToken(styleUrl: string | undefined, publicToken: string): string {
  const normalizedStyleUrl = styleUrl?.trim() ?? "";
  if (!normalizedStyleUrl || !publicToken) return normalizedStyleUrl;

  try {
    const parsed = new URL(normalizedStyleUrl);
    if (parsed.hostname !== "api.maptiler.com" || parsed.searchParams.has("key")) return normalizedStyleUrl;
    parsed.searchParams.set("key", publicToken);
    return parsed.toString();
  } catch {
    return normalizedStyleUrl;
  }
}

export const apiConfig = {
  baseUrl: normalizedBaseUrl,
  timeoutMs: positiveNumber(import.meta.env.VITE_API_TIMEOUT_MS, 20000),
  locationUpdateIntervalMs: positiveNumber(import.meta.env.VITE_LOCATION_UPDATE_INTERVAL_MS, 5000),
  mapStyleUrl: mapStyleUrlWithPublicToken(import.meta.env.VITE_MAP_STYLE_URL, mapPublicToken),
  mapDarkStyleUrl: mapStyleUrlWithPublicToken(import.meta.env.VITE_MAP_DARK_STYLE_URL, mapPublicToken),
  naverMapClientId: import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim() ?? "",
  authLoginUrl: import.meta.env.VITE_AUTH_LOGIN_URL?.trim() ?? "",
  authEnabled,
  defaultStationName: import.meta.env.VITE_DEFAULT_STATION_NAME?.trim() ?? "",
  dispatchCenterName: import.meta.env.VITE_DISPATCH_CENTER_NAME?.trim() ?? "",
  dispatchCenterPhone: import.meta.env.VITE_DISPATCH_CENTER_PHONE?.trim() ?? "",
  demoEnabled,
  presentationScenarioEnabled: !demoEnabled
    && normalizedBaseUrl.length > 0
    && import.meta.env.VITE_ENABLE_PRESENTATION_SCENARIO === "true",
  movementEnabled: demoEnabled || import.meta.env.VITE_ENABLE_MOVEMENT_API === "true",
  recordEnabled: demoEnabled || import.meta.env.VITE_ENABLE_RECORD_API === "true",
};

export const runtimeDataMode: DataMode = apiConfig.demoEnabled ? "DEMO_SIMULATION" : apiConfig.baseUrl ? "LIVE_API" : "UNAVAILABLE";
