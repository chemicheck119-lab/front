/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BFF_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_MAP_STYLE_URL?: string;
  readonly VITE_MAP_DARK_STYLE_URL?: string;
  readonly VITE_LOCATION_UPDATE_INTERVAL_MS?: string;
  readonly VITE_ENABLE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
