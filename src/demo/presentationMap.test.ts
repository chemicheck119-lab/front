import { describe, expect, it } from "vitest";
import type { IncidentReplayEnvelope } from "../api/intake";
import {
  advancePublicSyntheticMapContext,
  buildPublicSyntheticMapContext,
} from "./presentationMap";

const envelope: IncidentReplayEnvelope = {
  schemaVersion: "chemicheck119-incident-envelope-v1",
  incidentId: "INC-SYNTHETIC-1",
  sourceEventId: "EVENT-1",
  idempotencyKey: "IDEMPOTENCY-1",
  receivedAt: "2026-08-02T12:00:00+09:00",
  occurredAt: "2026-08-02T11:58:00+09:00",
  stationId: "STATION-DEMO",
  stationDisplayName: "공개 데모 상황실",
  facilityName: "공개 합성 사업장",
  addressText: "경기도 화성시 팔탄면",
  location: { latitude: 37.162, longitude: 126.904 },
  reportText: "공개 합성 신고",
  sourceType: "SYNTHETIC_DISPATCH_REPLAY",
  dataClassification: "PUBLIC_SYNTHETIC",
  sourceProvider: "CHEMICHECK119_PUBLIC_REPLAY",
  sourceSchemaVersion: "public-replay-v1",
  requestId: "REQ-1",
  containsPersonalInformation: false,
  disclosure: "실제 신고가 아닙니다.",
  datasetReferences: [],
};

describe("공개 합성 시연 지도", () => {
  it("선택 소방서 공개 좌표에서 관할 합성 사고지점까지 경로를 만든다", () => {
    const responderOrigin = {
      latitude: 37.133,
      longitude: 126.861,
      label: "경기 화성소방서 출동 기준점",
    };
    const context = buildPublicSyntheticMapContext(envelope, responderOrigin);

    expect(context.incidentPosition).toMatchObject({
      latitude: envelope.location.latitude,
      longitude: envelope.location.longitude,
      isSimulation: true,
    });
    expect(context.responderPosition).toMatchObject({
      latitude: responderOrigin.latitude,
      longitude: responderOrigin.longitude,
      label: responderOrigin.label,
      isSimulation: true,
    });
    expect(context.route.status).toBe("DEMO_SIMULATION");
    expect(context.route.provider).toBe("PUBLIC_SYNTHETIC_ROUTE_FIXTURE");
    expect(context.route.geometry?.coordinates).toHaveLength(4);
    expect(context.route.totalDistanceM).toBeGreaterThan(1000);
    expect(context.route.etaSeconds).toBeGreaterThanOrEqual(180);
    expect(context.route.message).toContain("실제 도로·교통 ETA가 아닙니다");
  });

  it("합성 차량을 경로 위에서 전진시키고 남은 거리와 ETA를 함께 줄인다", () => {
    const context = buildPublicSyntheticMapContext(envelope, {
      latitude: 37.133,
      longitude: 126.861,
      label: "경기 화성소방서 출동 기준점",
    });
    const halfway = advancePublicSyntheticMapContext(
      context,
      0.5,
      "2026-08-02T12:00:20+09:00",
    );
    const arrived = advancePublicSyntheticMapContext(
      context,
      1,
      "2026-08-02T12:00:40+09:00",
    );

    expect(halfway.responderPosition).toMatchObject({
      source: "DEMO_SIMULATION",
      isSimulation: true,
      label: "합성 출동 차량 · 50%",
    });
    expect(halfway.route.status).toBe("DEMO_SIMULATION");
    expect(halfway.route.progressRatio).toBe(0.5);
    expect(halfway.route.remainingDistanceM).toBe(Math.round((context.route.totalDistanceM ?? 0) / 2));
    expect(halfway.route.etaSeconds).toBe(Math.round((context.route.etaSeconds ?? 0) / 2));
    expect(arrived.responderPosition).toMatchObject({
      latitude: envelope.location.latitude,
      longitude: envelope.location.longitude,
      label: "합성 출동 차량 · 현장 도착",
    });
    expect(arrived.route.remainingDistanceM).toBe(0);
    expect(arrived.route.etaSeconds).toBe(0);
    expect(arrived.route.message).toContain("실제 GPS·도로 경로가 아닙니다");
  });

  it("NAVER 실도로 geometry와 출처를 유지하고 차량 이동만 합성으로 표시한다", () => {
    const synthetic = buildPublicSyntheticMapContext(envelope, {
      latitude: 37.133,
      longitude: 126.861,
      label: "경기 화성소방서 출동 기준점",
    });
    const liveRoadContext = {
      ...synthetic,
      responderPosition: {
        ...synthetic.responderPosition!,
        source: "MANUAL_DISPATCH" as const,
        isSimulation: false,
      },
      route: {
        ...synthetic.route,
        status: "AVAILABLE" as const,
        provider: "NAVER_DIRECTIONS_5",
        providerMode: "LIVE_API" as const,
        routeId: "NAVER-LIVE-1",
        etaSeconds: 420,
        trafficApplied: true,
        attribution: "NAVER Maps Directions 5",
      },
    };

    const halfway = advancePublicSyntheticMapContext(liveRoadContext, 0.5);

    expect(halfway.route).toMatchObject({
      status: "AVAILABLE",
      provider: "NAVER_DIRECTIONS_5",
      providerMode: "LIVE_API",
      trafficApplied: true,
      attribution: "NAVER Maps Directions 5",
      etaSeconds: 210,
    });
    expect(halfway.responderPosition).toMatchObject({
      source: "DEMO_SIMULATION",
      isSimulation: true,
      label: "실도로 시연 차량 · 50%",
    });
    expect(halfway.route.message).toContain("NAVER 실도로 경로 위 합성 차량");
  });
});
