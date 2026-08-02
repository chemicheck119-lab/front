import { loadNaverMapSdk } from "./naverMapLoader";

export interface ResolvedIncidentAddress {
  query: string;
  displayAddress: string;
  latitude: number;
  longitude: number;
  resolvedAt: string;
  provider: "NAVER_MAPS_JS_V3";
}

function validKoreaCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= 32
    && latitude <= 39.5
    && longitude >= 124
    && longitude <= 132;
}

export async function geocodeIncidentAddress(
  value: string,
  clientId: string,
): Promise<ResolvedIncidentAddress> {
  const query = value.trim();
  if (!query || query.length > 300) throw new Error("ADDRESS_REQUIRED");
  if (!clientId) throw new Error("NAVER_GEOCODER_NOT_CONFIGURED");

  await loadNaverMapSdk(clientId);
  if (!naver.maps.Service?.geocode) throw new Error("NAVER_GEOCODER_UNAVAILABLE");

  return new Promise((resolve, reject) => {
    naver.maps.Service.geocode({ query, count: 1 }, (status, response) => {
      if (status !== naver.maps.Service.Status.OK) {
        reject(new Error("NAVER_GEOCODER_REQUEST_FAILED"));
        return;
      }
      const match = response?.v2?.addresses?.[0];
      const latitude = Number(match?.y);
      const longitude = Number(match?.x);
      if (!match || !validKoreaCoordinate(latitude, longitude)) {
        reject(new Error("ADDRESS_NOT_FOUND"));
        return;
      }
      resolve({
        query,
        displayAddress: match.roadAddress || match.jibunAddress || query,
        latitude,
        longitude,
        resolvedAt: new Date().toISOString(),
        provider: "NAVER_MAPS_JS_V3",
      });
    });
  });
}
