export interface PublicPilotStation {
  stationId: string;
  region: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  sourceDate: string;
}

export interface PublicPilotRegion {
  regionName: string;
  stations: PublicPilotStation[];
}

export interface PublicPilotStationCatalog {
  schemaVersion: "chemicheck119-fire-station-catalog-v1";
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  regions: PublicPilotRegion[];
}

export function publicPilotStationsUrl(authLoginUrl: string): string {
  const parsed = new URL(authLoginUrl);
  parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/stations`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function isKoreaCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= 32
    && latitude <= 39.5
    && longitude >= 124
    && longitude <= 132;
}

function isValidCatalog(value: unknown): value is PublicPilotStationCatalog {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicPilotStationCatalog>;
  if (candidate.schemaVersion !== "chemicheck119-fire-station-catalog-v1"
    || !Array.isArray(candidate.regions)
    || candidate.regions.length === 0
    || candidate.regions.length > 30) return false;
  return candidate.regions.every((region) => typeof region.regionName === "string"
    && region.regionName.length > 0
    && Array.isArray(region.stations)
    && region.stations.length > 0
    && region.stations.length <= 100
    && region.stations.every((station) => typeof station.stationId === "string"
      && /^nfa-[0-9]{4}$/.test(station.stationId)
      && typeof station.stationName === "string"
      && station.stationName.length > 0
      && typeof station.address === "string"
      && station.address.length > 0
      && isKoreaCoordinate(station.latitude, station.longitude)));
}

export async function fetchPublicPilotStations(authLoginUrl: string, signal?: AbortSignal) {
  const response = await fetch(publicPilotStationsUrl(authLoginUrl), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`PILOT_STATION_CATALOG_HTTP_${response.status}`);
  const payload: unknown = await response.json();
  if (!isValidCatalog(payload)) throw new Error("PILOT_STATION_CATALOG_INVALID");
  return payload;
}
