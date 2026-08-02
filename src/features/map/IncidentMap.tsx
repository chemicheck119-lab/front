import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { GeoJSONSource, LngLatBounds, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapContext } from "../../api/contracts";
import { apiConfig, runtimeDataMode } from "../../api/config";
import { canRenderRoute, formatDistance, formatEta, type LocationPresentation } from "./mapState";
import { resolveOperationalMapStyle } from "./mapStyle";
import { NaverMapCanvas } from "./NaverMapCanvas";
import { AlertTriangle, Crosshair, LocateFixed, MapPinned, Route } from "lucide-react";

interface IncidentMapProps {
  context: MapContext | null;
  isDark: boolean;
  gps: LocationPresentation;
}

const EMPTY_ROUTE = { type: "FeatureCollection" as const, features: [] };

function markerElement(kind: "incident" | "responder") {
  const element = document.createElement("div");
  element.className = `chemicheck-map-marker chemicheck-map-marker--${kind}`;
  element.setAttribute("aria-label", kind === "incident" ? "사고 발생 위치" : "대원 현재 위치");
  element.innerHTML = `<span></span>`;
  return element;
}

function animateMarker(marker: Marker, from: [number, number], to: [number, number]) {
  const startedAt = performance.now();
  const duration = 550;
  const frame = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    marker.setLngLat([
      from[0] + (to[0] - from[0]) * eased,
      from[1] + (to[1] - from[1]) * eased,
    ]);
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function IncidentMap({ context, isDark, gps }: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const incidentMarkerRef = useRef<Marker | null>(null);
  const responderMarkerRef = useRef<Marker | null>(null);
  const lastResponderRef = useRef<[number, number] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const styleUrl = isDark && apiConfig.mapDarkStyleUrl ? apiConfig.mapDarkStyleUrl : apiConfig.mapStyleUrl;
  const hasMapConfiguration = Boolean(apiConfig.naverMapClientId || styleUrl);

  useEffect(() => {
    if (apiConfig.naverMapClientId) return;
    if (!containerRef.current || !styleUrl || mapRef.current) return;
    try {
      setMapError(null);
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: resolveOperationalMapStyle(styleUrl),
        center: [127.7, 36.3],
        zoom: 6,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.on("error", () => setMapError("지도 스타일 또는 타일을 불러올 수 없습니다."));
      map.on("load", () => {
        map.addSource("response-route", { type: "geojson", data: EMPTY_ROUTE });
        map.addLayer({
          id: "response-route-outline",
          type: "line",
          source: "response-route",
          paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "response-route-line",
          type: "line",
          source: "response-route",
          paint: { "line-color": "#2563eb", "line-width": 4, "line-opacity": 0.95 },
        });
      });
      mapRef.current = map;
      return () => {
        incidentMarkerRef.current?.remove();
        responderMarkerRef.current?.remove();
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setMapError("이 기기에서 지도를 시작할 수 없습니다.");
    }
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !context) return;
    const incident = context.incidentPosition;
    const responder = context.responderPosition;

    if (incident) {
      const point: [number, number] = [incident.longitude, incident.latitude];
      if (!incidentMarkerRef.current) incidentMarkerRef.current = new maplibregl.Marker({ element: markerElement("incident"), anchor: "bottom" }).setLngLat(point).addTo(map);
      else incidentMarkerRef.current.setLngLat(point);
    } else {
      incidentMarkerRef.current?.remove();
      incidentMarkerRef.current = null;
    }

    if (responder) {
      const point: [number, number] = [responder.longitude, responder.latitude];
      if (!responderMarkerRef.current) responderMarkerRef.current = new maplibregl.Marker({ element: markerElement("responder") }).setLngLat(point).addTo(map);
      else if (lastResponderRef.current) animateMarker(responderMarkerRef.current, lastResponderRef.current, point);
      else responderMarkerRef.current.setLngLat(point);
      lastResponderRef.current = point;
    } else {
      responderMarkerRef.current?.remove();
      responderMarkerRef.current = null;
      lastResponderRef.current = null;
    }

    const route = context.route;
    const setRoute = () => {
      const source = map.getSource("response-route") as GeoJSONSource | undefined;
      if (!source) return;
      source.setData(canRenderRoute(route) && route.geometry
        ? { type: "Feature", properties: {}, geometry: route.geometry }
        : EMPTY_ROUTE);
    };
    if (map.isStyleLoaded()) setRoute();
    else map.once("load", setRoute);

    const coordinates = [
      ...(incident ? [[incident.longitude, incident.latitude] as [number, number]] : []),
      ...(responder ? [[responder.longitude, responder.latitude] as [number, number]] : []),
      ...(canRenderRoute(route) && route.geometry ? route.geometry.coordinates : []),
    ];
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce((box, coordinate) => box.extend(coordinate), new LngLatBounds(coordinates[0], coordinates[0]));
      map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 600 });
    } else if (coordinates.length === 1) {
      map.easeTo({ center: coordinates[0], zoom: 13, duration: 500 });
    }
  }, [context]);

  const route = context?.route;
  const unavailableMessage = !context?.incidentPosition
    ? "사고 좌표를 확인해야 지도를 맞출 수 있습니다."
    : route?.message ?? "현재 위치와 도로 경로를 확인하고 있습니다.";

  return (
    <section className="relative h-full min-h-[460px] overflow-hidden rounded-2xl border border-border bg-card" aria-label="전국 사고 및 출동 지도">
      {apiConfig.naverMapClientId
        ? <NaverMapCanvas context={context} onError={setMapError} />
        : <div ref={containerRef} className="chemicheck-map-canvas absolute inset-0" data-map-provider="maplibre" />}
      {!hasMapConfiguration && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,var(--muted),var(--card))] p-8 text-center">
          <div className="max-w-xs">
            <MapPinned className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="text-sm font-semibold">지도 서비스 연결 필요</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">네이버 지도 Client ID 또는 운영 지도 Style URL을 설정해주세요.</p>
          </div>
        </div>
      )}
      {mapError && <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-primary/30 bg-card/95 px-3 py-2 text-xs text-primary shadow">{mapError}</div>}

      <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={`status-dot ${context?.incidentPosition ? "status-dot--danger" : "status-dot--muted"}`} />
            {context?.incidentPosition ? "사고 위치 확인" : "사고 위치 확인 필요"}
          </div>
          <p className="mt-1 max-w-[280px] text-[11px] text-muted-foreground">{context?.incidentPosition?.label ?? unavailableMessage}</p>
        </div>
        {runtimeDataMode === "DEMO_SIMULATION" && <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1.5 text-[11px] font-bold text-accent">시연 데이터</span>}
      </div>

      <div data-testid="map-route-summary" className="absolute bottom-4 right-4 z-10 w-[230px] max-w-[calc(100%-2rem)] rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm pointer-events-none">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-[10px] text-muted-foreground">예상 도착</p><p className="mt-0.5 text-base font-bold">{route?.status === "POSITION_STALE" ? "—" : formatEta(route?.etaSeconds)}</p></div>
          <div><p className="text-[10px] text-muted-foreground">남은 거리</p><p className="mt-0.5 text-base font-bold">{formatDistance(route?.remainingDistanceM)}</p></div>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-[10px]">
          <div className="flex items-center gap-1.5"><LocateFixed size={11} className="text-blue-500" /><span>{gps.label} · {gps.detail}</span></div>
          <div className="flex items-center gap-1.5"><Route size={11} /><span className="truncate">{route?.message ?? "경로 대기"}</span></div>
        </div>
      </div>

      {!context?.incidentPosition && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-accent/40 bg-card/95 px-4 py-3 text-center shadow-xl">
          <Crosshair className="mx-auto mb-2 text-accent" size={22} />
          <p className="text-xs font-semibold">사고 좌표 없음</p>
          <p className="mt-1 text-[10px] text-muted-foreground">상황실 좌표 또는 검증된 지오코딩 결과가 필요합니다.</p>
        </div>
      )}
      {context?.hazardOverlayStatus === "NOT_COMPUTED_NO_VALIDATED_DISPERSION_MODEL" && (
        <div className="absolute bottom-10 left-3 z-10 flex max-w-[330px] items-center gap-2 rounded-lg border border-border bg-card/90 px-2.5 py-1.5 text-[10px] text-muted-foreground backdrop-blur-sm">
          <AlertTriangle size={12} /> 검증된 확산 모델이 없어 위험 반경은 표시하지 않습니다.
        </div>
      )}
    </section>
  );
}
