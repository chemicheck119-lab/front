import { renderHook } from "@testing-library/react";
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
});
