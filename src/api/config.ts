import type { DataMode } from "./contracts";

const normalizedBaseUrl = (import.meta.env.VITE_BFF_BASE_URL ?? "").replace(/\/$/, "");

export const apiConfig = {
  baseUrl: normalizedBaseUrl,
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000),
  locationUpdateIntervalMs: Number(import.meta.env.VITE_LOCATION_UPDATE_INTERVAL_MS ?? 5000),
  mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL ?? "",
  mapDarkStyleUrl: import.meta.env.VITE_MAP_DARK_STYLE_URL ?? "",
  dispatchCenterName: import.meta.env.VITE_DISPATCH_CENTER_NAME?.trim() ?? "",
  dispatchCenterPhone: import.meta.env.VITE_DISPATCH_CENTER_PHONE?.trim() ?? "",
  demoEnabled: import.meta.env.VITE_ENABLE_DEMO_MODE === "true",
};

export const runtimeDataMode: DataMode = apiConfig.demoEnabled ? "DEMO_SIMULATION" : apiConfig.baseUrl ? "LIVE_API" : "UNAVAILABLE";
