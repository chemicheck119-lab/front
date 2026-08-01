import { apiConfig } from "./config";
import { apiRequest } from "./client";
import type { MaterialDiscoveryResponse } from "./contracts";
import { demoMaterialSearch } from "../fixtures/demo";

export async function discoverSubstances(query: string): Promise<MaterialDiscoveryResponse> {
  if (apiConfig.demoEnabled) return structuredClone({ ...demoMaterialSearch, query });
  return apiRequest<MaterialDiscoveryResponse>("/api/c2guard/v1/substances/discover", {
    method: "POST",
    body: JSON.stringify({ query, topK: 5, evidenceTopK: 3 }),
  });
}
