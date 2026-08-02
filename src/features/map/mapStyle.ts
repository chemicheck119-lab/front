import type { StyleSpecification } from "maplibre-gl";

const MAPTILER_HOST = "api.maptiler.com";
const MAPTILER_ATTRIBUTION = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

/**
 * MapTiler vector styles can fail independently of the map canvas when their
 * nested TileJSON resources are blocked. For the operational dashboard we use
 * MapTiler's documented raster XYZ endpoint so the road basemap has one
 * predictable browser request path while incident/route overlays stay vector.
 */
export function resolveOperationalMapStyle(styleUrl: string): string | StyleSpecification {
  try {
    const parsed = new URL(styleUrl);
    const mapIdMatch = /^\/maps\/([^/]+)\/style\.json$/.exec(parsed.pathname);
    if (parsed.hostname !== MAPTILER_HOST || !mapIdMatch) return styleUrl;

    const rasterTileUrl = `${parsed.origin}/maps/${encodeURIComponent(mapIdMatch[1])}/256/{z}/{x}/{y}.png${parsed.search}`;

    return {
      version: 8,
      sources: {
        "operational-basemap": {
          type: "raster",
          tiles: [rasterTileUrl],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 20,
          attribution: MAPTILER_ATTRIBUTION,
        },
      },
      layers: [
        {
          id: "operational-basemap-background",
          type: "background",
          paint: { "background-color": "#eef2f5" },
        },
        {
          id: "operational-basemap-raster",
          type: "raster",
          source: "operational-basemap",
          minzoom: 0,
          maxzoom: 22,
          paint: { "raster-opacity": 1 },
        },
      ],
    };
  } catch {
    return styleUrl;
  }
}
