import { useEffect, useRef, useState } from "react";
import type { MapContext } from "../../api/contracts";
import { apiConfig } from "../../api/config";
import { canRenderRoute } from "./mapState";
import { loadNaverMapSdk } from "./naverMapLoader";

interface NaverMapCanvasProps {
  context: MapContext | null;
  onError: (message: string | null) => void;
}

function markerIcon(kind: "incident" | "responder"): naver.maps.HtmlIcon {
  const size = kind === "incident" ? 26 : 24;
  return {
    content: `<div class="chemicheck-map-marker chemicheck-map-marker--${kind}" aria-label="${kind === "incident" ? "사고 발생 위치" : "대원 현재 위치"}"><span></span></div>`,
    size: new naver.maps.Size(size, size),
    anchor: new naver.maps.Point(size / 2, kind === "incident" ? size : size / 2),
  };
}

export function NaverMapCanvas({ context, onError }: NaverMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const incidentMarkerRef = useRef<naver.maps.Marker | null>(null);
  const responderMarkerRef = useRef<naver.maps.Marker | null>(null);
  const routeOutlineRef = useRef<naver.maps.Polyline | null>(null);
  const routeLineRef = useRef<naver.maps.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    if (!containerRef.current || !apiConfig.naverMapClientId) return;

    onError(null);
    void loadNaverMapSdk(apiConfig.naverMapClientId)
      .then(() => {
        if (disposed || !containerRef.current) return;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(36.3, 127.7),
          zoom: 7,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
          scaleControl: false,
          mapDataControl: true,
          logoControl: true,
        });
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        if (!disposed) onError("네이버 지도를 불러오지 못했습니다. 등록 도메인과 Dynamic Map 설정을 확인해주세요.");
      });

    return () => {
      disposed = true;
      incidentMarkerRef.current?.setMap(null);
      responderMarkerRef.current?.setMap(null);
      routeOutlineRef.current?.setMap(null);
      routeLineRef.current?.setMap(null);
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [onError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const incident = context?.incidentPosition;
    const responder = context?.responderPosition;

    if (incident) {
      const position = new naver.maps.LatLng(incident.latitude, incident.longitude);
      if (!incidentMarkerRef.current) {
        incidentMarkerRef.current = new naver.maps.Marker({
          map,
          position,
          icon: markerIcon("incident"),
          title: incident.label ?? "사고 발생 위치",
          zIndex: 30,
        });
      } else {
        incidentMarkerRef.current.setPosition(position);
        incidentMarkerRef.current.setMap(map);
      }
    } else {
      incidentMarkerRef.current?.setMap(null);
    }

    if (responder) {
      const position = new naver.maps.LatLng(responder.latitude, responder.longitude);
      if (!responderMarkerRef.current) {
        responderMarkerRef.current = new naver.maps.Marker({
          map,
          position,
          icon: markerIcon("responder"),
          title: responder.label ?? "대원 현재 위치",
          zIndex: 20,
        });
      } else {
        responderMarkerRef.current.setPosition(position);
        responderMarkerRef.current.setMap(map);
      }
    } else {
      responderMarkerRef.current?.setMap(null);
    }

    const route = context?.route;
    const routePath = route && canRenderRoute(route) && route.geometry
      ? route.geometry.coordinates.map(([longitude, latitude]) => new naver.maps.LatLng(latitude, longitude))
      : [];

    if (routePath.length >= 2) {
      if (!routeOutlineRef.current) {
        routeOutlineRef.current = new naver.maps.Polyline({
          map,
          path: routePath,
          strokeColor: "#ffffff",
          strokeWeight: 8,
          strokeOpacity: 0.92,
          strokeLineCap: "round",
          strokeLineJoin: "round",
          zIndex: 10,
        });
        routeLineRef.current = new naver.maps.Polyline({
          map,
          path: routePath,
          strokeColor: "#2563eb",
          strokeWeight: 4,
          strokeOpacity: 0.96,
          strokeLineCap: "round",
          strokeLineJoin: "round",
          zIndex: 11,
        });
      } else {
        routeOutlineRef.current.setPath(routePath);
        routeOutlineRef.current.setMap(map);
        routeLineRef.current?.setPath(routePath);
        routeLineRef.current?.setMap(map);
      }
    } else {
      routeOutlineRef.current?.setMap(null);
      routeLineRef.current?.setMap(null);
    }

    const coordinates = [
      ...(incident ? [new naver.maps.LatLng(incident.latitude, incident.longitude)] : []),
      ...(responder ? [new naver.maps.LatLng(responder.latitude, responder.longitude)] : []),
      ...routePath,
    ];
    if (coordinates.length > 1) {
      map.fitBounds(coordinates, { top: 72, right: 72, bottom: 72, left: 72, maxZoom: 15 });
    } else if (coordinates.length === 1) {
      map.morph(coordinates[0], 14, { duration: 500 });
    }
  }, [context, mapReady]);

  return (
    <div className="chemicheck-map-canvas absolute inset-0" data-map-provider="naver">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
