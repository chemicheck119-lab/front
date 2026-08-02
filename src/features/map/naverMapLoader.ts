const NAVER_MAP_SCRIPT_ID = "chemicheck-naver-map-sdk";
let naverMapSdkPromise: Promise<void> | null = null;

export function buildNaverMapSdkUrl(clientId: string): string {
  const url = new URL("https://oapi.map.naver.com/openapi/v3/maps.js");
  url.searchParams.set("ncpKeyId", clientId);
  url.searchParams.set("language", "ko");
  return url.toString();
}

export function loadNaverMapSdk(clientId: string): Promise<void> {
  if (typeof naver !== "undefined" && naver.maps?.Map) return Promise.resolve();
  if (naverMapSdkPromise) return naverMapSdkPromise;

  const loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const handleLoad = () => {
      if (typeof naver !== "undefined" && naver.maps?.Map) resolve();
      else reject(new Error("NAVER_MAP_SDK_UNAVAILABLE"));
    };
    const handleError = () => reject(new Error("NAVER_MAP_SDK_LOAD_FAILED"));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) {
      script.id = NAVER_MAP_SCRIPT_ID;
      script.async = true;
      script.src = buildNaverMapSdkUrl(clientId);
      document.head.appendChild(script);
    }
  });
  const guardedPromise = loadPromise.catch((error) => {
    naverMapSdkPromise = null;
    throw error;
  });
  naverMapSdkPromise = guardedPromise;
  return guardedPromise;
}
