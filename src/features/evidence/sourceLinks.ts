export const KOSHA_MSDS_SEARCH_URL = "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do";

export function resolveOfficialSourceUrl(
  sourceUrl: string | null | undefined,
  source?: "KOSHA" | "CAMEO" | string,
): string | null {
  const candidate = sourceUrl?.trim() ?? "";
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
    } catch {
      // Some upstream KOSHA cards identify the OpenAPI provider instead of a URL.
    }
  }
  return source === "KOSHA" ? KOSHA_MSDS_SEARCH_URL : null;
}
