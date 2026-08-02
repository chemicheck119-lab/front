import type { MapContext } from "../api/contracts";
import type { IncidentReplayEnvelope } from "../api/intake";

const RESPONDER_OFFSET = { latitude: -0.028, longitude: -0.042 };

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

/**
 * 공개 데모에서 지도·ETA UI를 검증하기 위한 합성 경로다.
 * 실제 도로 길찾기 결과처럼 보이지 않도록 provider와 message에 합성 경계를 고정한다.
 */
export function buildPublicSyntheticMapContext(envelope: IncidentReplayEnvelope): MapContext {
  const incident: [number, number] = [envelope.location.longitude, envelope.location.latitude];
  const responder: [number, number] = [
    incident[0] + RESPONDER_OFFSET.longitude,
    incident[1] + RESPONDER_OFFSET.latitude,
  ];
  const middleA = interpolate(responder, incident, 0.34);
  const middleB = interpolate(responder, incident, 0.68);

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
      label: "공개 합성 출동 위치",
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
      totalDistanceM: 6200,
      remainingDistanceM: 6200,
      etaSeconds: 720,
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
