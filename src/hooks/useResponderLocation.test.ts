import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfig } from "../api/config";
import { useResponderLocation } from "./useResponderLocation";

const originalConfig = { ...apiConfig };

describe("현장 GPS 수명주기", () => {
  beforeEach(() => {
    apiConfig.demoEnabled = false;
  });

  afterEach(() => {
    Object.assign(apiConfig, originalConfig);
    vi.unstubAllGlobals();
  });

  it("사용 종료 시 GPS 감시를 해제하고 마지막 좌표를 제거한다", () => {
    const watchPosition = vi.fn().mockReturnValue(17);
    const clearWatch = vi.fn();
    vi.stubGlobal("navigator", { geolocation: { watchPosition, clearWatch } });

    const { result, rerender } = renderHook(({ enabled }) => useResponderLocation(enabled), {
      initialProps: { enabled: true },
    });

    expect(watchPosition).toHaveBeenCalledOnce();
    rerender({ enabled: false });

    expect(clearWatch).toHaveBeenCalledWith(17);
    expect(result.current.position).toBeNull();
    expect(result.current.state).toBe("WAITING");
  });

  it("GPS가 없거나 거부되면 선택 소방서 공개 좌표를 출동 기준점으로 유지한다", () => {
    let rejectLocation: ((error: GeolocationPositionError) => void) | undefined;
    const watchPosition = vi.fn((_, error) => {
      rejectLocation = error;
      return 19;
    });
    vi.stubGlobal("navigator", { geolocation: { watchPosition, clearWatch: vi.fn() } });
    const fallback = {
      latitude: 37.5102929,
      longitude: 127.06684,
      observedAt: "2026-08-02T09:00:00Z",
      source: "MANUAL_DISPATCH" as const,
      accuracyM: null,
    };

    const { result } = renderHook(() => useResponderLocation(true, fallback));

    expect(result.current.state).toBe("ACTIVE");
    expect(result.current.position).toEqual(fallback);
    act(() => rejectLocation?.({
      code: 1,
      message: "denied",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }));
    expect(result.current.position).toEqual(fallback);
    expect(result.current.errorMessage).toBe("denied");
  });
});
