import { BookOpenCheck, Database, History, MapPinCheck, ShieldCheck } from "lucide-react";

export type SourceBadgeKind = "FIRE_DATA" | "FACILITY_HISTORY" | "KOSHA" | "CAMEO_RULE" | "FIELD_CONFIRMATION";

const badgePresentation: Record<SourceBadgeKind, {
  label: string;
  className: string;
  icon: typeof Database;
}> = {
  FIRE_DATA: {
    label: "소방안전 빅데이터 기반 후보",
    className: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Database,
  },
  FACILITY_HISTORY: {
    label: "ICIS·PRTR 과거 취급 이력",
    className: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    icon: History,
  },
  KOSHA: {
    label: "KOSHA MSDS 근거",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: BookOpenCheck,
  },
  CAMEO_RULE: {
    label: "NOAA CAMEO 충돌 규칙",
    className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
    icon: ShieldCheck,
  },
  FIELD_CONFIRMATION: {
    label: "현장 확인 필요",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: MapPinCheck,
  },
};

export function SourceBadges({ kinds, label = "데이터 출처와 판정 경계" }: {
  kinds: SourceBadgeKind[];
  label?: string;
}) {
  const uniqueKinds = [...new Set(kinds)];
  if (uniqueKinds.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" aria-label={label}>
      {uniqueKinds.map((kind) => {
        const presentation = badgePresentation[kind];
        const Icon = presentation.icon;
        return (
          <span key={kind} className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold ${presentation.className}`}>
            <Icon size={10} aria-hidden="true" />
            {presentation.label}
          </span>
        );
      })}
    </div>
  );
}
