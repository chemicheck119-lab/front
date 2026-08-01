import { useEffect, useMemo, useState } from "react";
import { apiConfig } from "../api/config";
import type { PositionSnapshot } from "../api/contracts";
import type { LocationState } from "../features/map/mapState";
import { demoMapContext } from "../fixtures/demo";

interface ResponderLocation {
  state: LocationState;
  position: PositionSnapshot | null;
  errorMessage?: string;
}

export function useResponderLocation(enabled: boolean): ResponderLocation {
  const demoPosition = demoMapContext.responderPosition;
  const [location, setLocation] = useState<ResponderLocation>(() => apiConfig.demoEnabled && demoPosition
    ? {
        state: "DEMO",
        position: {
          latitude: demoPosition.latitude,
          longitude: demoPosition.longitude,
          observedAt: new Date().toISOString(),
          source: "DEMO_SIMULATION",
          accuracyM: demoPosition.accuracyM,
        },
      }
    : { state: "WAITING", position: null });

  useEffect(() => {
    if (!enabled || apiConfig.demoEnabled) return;
    if (!("geolocation" in navigator)) {
      setLocation({ state: "UNAVAILABLE", position: null });
      return;
    }

    setLocation({ state: "WAITING", position: null });
    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        setLocation({
          state: coords.accuracy > 100 ? "LOW_ACCURACY" : "ACTIVE",
          position: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            observedAt: new Date(timestamp).toISOString(),
            source: "MDT_DEVICE_GPS",
            accuracyM: coords.accuracy,
          },
        });
      },
      (error) => {
        const state: LocationState = error.code === error.PERMISSION_DENIED
          ? "DENIED"
          : error.code === error.POSITION_UNAVAILABLE
            ? "UNAVAILABLE"
            : "ERROR";
        setLocation({ state, position: null, errorMessage: error.message });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return useMemo(() => location, [location]);
}
