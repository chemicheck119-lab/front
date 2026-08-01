import type { ConfirmationRequest } from "../../api/contracts";

export type ConfirmationRole = ConfirmationRequest["role"];

export function defaultConfirmationBasis(role: ConfirmationRole): ConfirmationRequest["confirmationBasis"] {
  return role === "FACILITY" ? "SITE_MSDS" : "CONTAINER_LABEL";
}

export function toConfirmationDateTimeInput(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function confirmationDateTimeToIso(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
