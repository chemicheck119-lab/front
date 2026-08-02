import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { SessionContextResponse } from "./contracts";

export interface PilotStation {
  stationId: string;
  region: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface PilotStationRegion {
  regionName: string;
  stations: PilotStation[];
}

export interface PilotStationCatalog {
  schemaVersion: "chemicheck119-fire-station-catalog-v1";
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  regions: PilotStationRegion[];
}

function pilotStationCatalogUrl(pilotUrl: string): string {
  const url = new URL(pilotUrl, window.location.origin);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/stations`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function isPilotStationCatalog(value: unknown): value is PilotStationCatalog {
  if (!value || typeof value !== "object") return false;
  const catalog = value as Partial<PilotStationCatalog>;
  return catalog.schemaVersion === "chemicheck119-fire-station-catalog-v1"
    && typeof catalog.sourceName === "string"
    && typeof catalog.sourceUrl === "string"
    && typeof catalog.sourceDate === "string"
    && Array.isArray(catalog.regions)
    && catalog.regions.every((region) => (
      typeof region.regionName === "string"
      && Array.isArray(region.stations)
      && region.stations.every((station) => (
        typeof station.stationId === "string"
        && typeof station.stationName === "string"
        && typeof station.region === "string"
      ))
    ));
}

export async function getPublicPilotStations(pilotUrl: string, signal?: AbortSignal): Promise<PilotStationCatalog> {
  const response = await fetch(pilotStationCatalogUrl(pilotUrl), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error("파일럿 소방서 목록을 불러오지 못했습니다.");
  const body: unknown = await response.json();
  if (!isPilotStationCatalog(body)) throw new Error("파일럿 소방서 목록 형식이 올바르지 않습니다.");
  return body;
}

export async function getAuthenticatedSession(signal?: AbortSignal): Promise<SessionContextResponse> {
  return apiRequest<SessionContextResponse>("/api/c2guard/v1/session", {
    method: "GET",
    signal,
  });
}

export async function endAuthenticatedSession(signal?: AbortSignal): Promise<void> {
  if (!apiConfig.authEnabled) return;

  await apiRequest<Record<string, never>>("/api/c2guard/v1/logout", {
    method: "POST",
    signal,
  });
}
