import type { MapContext } from "../api/contracts";
import type { IncidentReplayEnvelope } from "../api/intake";

const RESPONDER_OFFSET = { latitude: -0.028, longitude: -0.042 };
const EARTH_RADIUS_M = 6_371_000;
export const PUBLIC_SYNTHETIC_ROUTE_DURATION_MS = 45_000;

export interface PublicSyntheticResponderOrigin {
  latitude: number;
  longitude: number;
  label: string;
}

function interpolate(
  from: [number, number],
  to: [number, number],
  progress: number,
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];
}

function distanceMeters(from: [number, number], to: [number, number]): number {
  const latitudeA = from[1] * Math.PI / 180;
  const latitudeB = to[1] * Math.PI / 180;
  const latitudeDelta = (to[1] - from[1]) * Math.PI / 180;
  const longitudeDelta = (to[0] - from[0]) * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(haversine));
}

function positionAlongRoute(
  coordinates: [number, number][],
  progress: number,
): [number, number] {
  if (coordinates.length < 2) return coordinates[0] ?? [0, 0];
  const segments = coordinates.slice(1).map((coordinate, index) => ({
    from: coordinates[index],
    to: coordinate,
    length: distanceMeters(coordinates[index], coordinate),
  }));
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength <= 0) return coordinates[coordinates.length - 1];

  let remaining = totalLength * progress;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const segmentProgress = segment.length <= 0 ? 1 : remaining / segment.length;
      return interpolate(segment.from, segment.to, segmentProgress);
    }
    remaining -= segment.length;
  }
  return coordinates[coordinates.length - 1];
}

/**
 * 공개 합성 경로 위의 차량 위치와 남은 거리·ETA를 함께 전진시킨다.
 * 실제 GPS나 도로 길찾기 결과로 오인되지 않도록 DEMO_SIMULATION 경계는 유지한다.
 */
export function advancePublicSyntheticMapContext(
  context: MapContext,
  progress: number,
  observedAt = new Date().toISOString(),
): MapContext {
  const route = context.route;
  const coordinates = route.geometry?.type === "LineString"
    ? route.geometry.coordinates as [number, number][]
    : [];
  if (route.providerMode !== "DEMO_SIMULATION" || coordinates.length < 2) return context;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const [longitude, latitude] = positionAlongRoute(coordinates, clampedProgress);
  const totalDistanceM = route.totalDistanceM ?? 0;
  const totalEtaSeconds = Math.max(180, Math.round(totalDistanceM / 500) * 60);
  const percent = Math.round(clampedProgress * 100);
  return {
    ...context,
    responderPosition: {
      ...context.responderPosition,
      latitude,
      longitude,
      observedAt,
      source: "DEMO_SIMULATION",
      label: clampedProgress >= 1 ? "합성 출동 차량 · 현장 도착" : `합성 출동 차량 · ${percent}%`,
      isSimulation: true,
    },
    route: {
      ...route,
      remainingDistanceM: Math.max(0, Math.round(totalDistanceM * (1 - clampedProgress))),
      etaSeconds: Math.max(0, Math.round(totalEtaSeconds * (1 - clampedProgress))),
      progressRatio: clampedProgress,
      message: clampedProgress >= 1
        ? "공개 합성 차량이 사고지점에 도착했습니다. 실제 GPS·도로 경로가 아닙니다."
        : `공개 합성 경로를 이동 중입니다. ${percent}% · 실제 GPS·도로 ETA가 아닙니다.`,
    },
  };
}

/**
 * 공개 데모에서 지도·ETA UI를 검증하기 위한 합성 경로다.
 * 실제 도로 길찾기 결과처럼 보이지 않도록 provider와 message에 합성 경계를 고정한다.
 */
export function buildPublicSyntheticMapContext(
  envelope: IncidentReplayEnvelope,
  responderOrigin?: PublicSyntheticResponderOrigin,
): MapContext {
  const incident: [number, number] = [envelope.location.longitude, envelope.location.latitude];
  const responder: [number, number] = responderOrigin
    ? [responderOrigin.longitude, responderOrigin.latitude]
    : [
        incident[0] + RESPONDER_OFFSET.longitude,
        incident[1] + RESPONDER_OFFSET.latitude,
      ];
  const middleA = interpolate(responder, incident, 0.34);
  const middleB = interpolate(responder, incident, 0.68);
  const totalDistanceM = Math.max(
    1000,
    Math.round(distanceMeters(responder, incident) * 1.25 / 100) * 100,
  );
  const etaSeconds = Math.max(180, Math.round(totalDistanceM / 500) * 60);

  return {
    coverageScope: "NATIONWIDE_KOREA",
    incidentPosition: {
      latitude: incident[1],
      longitude: incident[0],
      observedAt: envelope.receivedAt,
      source: "DEMO_SIMULATION",
      label: `${envelope.facilityName} · 공개 합성 사고지점`,
      isSimulation: true,
    },
    responderPosition: {
      latitude: responder[1],
      longitude: responder[0],
      observedAt: envelope.receivedAt,
      source: "DEMO_SIMULATION",
      accuracyM: null,
      label: responderOrigin?.label ?? "공개 합성 출동 위치",
      isSimulation: true,
    },
    route: {
      status: "DEMO_SIMULATION",
      provider: "PUBLIC_SYNTHETIC_ROUTE_FIXTURE",
      providerMode: "DEMO_SIMULATION",
      routeId: `ROUTE-${envelope.incidentId}`,
      geometry: {
        type: "LineString",
        coordinates: [responder, middleA, middleB, incident],
      },
      totalDistanceM,
      remainingDistanceM: totalDistanceM,
      etaSeconds,
      progressRatio: 0,
      progressRatioIsProbability: false,
      trafficApplied: false,
      generatedAt: envelope.receivedAt,
      attribution: "공개 합성 경로 — 실제 도로 길찾기 결과 아님",
      message: "공개 합성 경로입니다. 실제 도로·교통 ETA가 아닙니다.",
    },
    rendering: {
      geometryFormat: "GEOJSON_RFC7946",
      recommendedRenderer: "MAPLIBRE_GL_JS",
      tileProviderRequired: true,
      attributionRequired: true,
      publicOsmStandardTilesForProduction: false,
      routeAnimationSupported: true,
    },
    hazardOverlayStatus: "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL",
  };
}
