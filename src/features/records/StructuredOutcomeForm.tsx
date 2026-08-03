import type { RecordSaveRequest } from "../../api/contracts";

type OutcomeReport = RecordSaveRequest["outcomeReport"];
type PerformedAction = OutcomeReport["performedActions"][number];
type BriefApplicationStatus = OutcomeReport["briefApplicationStatus"];
type AdditionalFactor = OutcomeReport["additionalFactors"][number];
type FinalResponseOutcome = OutcomeReport["finalResponseOutcome"];

export interface StructuredOutcomeDraft {
  facilityName: string;
  facilityAddress: string;
  performedActions: PerformedAction[];
  briefApplicationStatus: BriefApplicationStatus | "";
  additionalFactors: AdditionalFactor[];
  finalResponseOutcome: FinalResponseOutcome | "";
}

export const PERFORMED_ACTION_OPTIONS: Array<{ value: PerformedAction; label: string }> = [
  { value: "ZONE_CONTROL", label: "경계·출입 통제" },
  { value: "EVACUATION", label: "주민·작업자 대피" },
  { value: "LEAK_SOURCE_CONTROL", label: "누출원 차단" },
  { value: "ADSORPTION_OR_RECOVERY", label: "흡착·회수" },
  { value: "WATER_SPRAY_OR_DILUTION", label: "수막·희석" },
  { value: "VENTILATION", label: "환기" },
  { value: "DECONTAMINATION", label: "제독" },
  { value: "RESCUE_OR_EMS", label: "인명구조·응급처치" },
  { value: "OTHER", label: "기타 대응" },
];

export const BRIEF_OPTIONS: Array<{ value: BriefApplicationStatus; label: string }> = [
  { value: "NOT_REVIEWED", label: "브리프를 확인하지 못함" },
  { value: "REVIEWED_NOT_APPLIED", label: "확인했으나 적용하지 않음" },
  { value: "PARTIALLY_APPLIED", label: "일부 적용" },
  { value: "APPLIED", label: "현장 대응에 적용" },
];

export const ADDITIONAL_FACTOR_OPTIONS: Array<{ value: AdditionalFactor; label: string }> = [
  { value: "ACTUAL_MIXING_CONFIRMED", label: "실제 물질 혼합 확인" },
  { value: "ENCLOSED_SPACE", label: "밀폐공간" },
  { value: "HEAT_OR_PRESSURE", label: "고온·고압 조건" },
  { value: "DRAIN_OR_WATERWAY_CONNECTION", label: "배수로·수계 연결" },
  { value: "LABEL_OR_MSDS_MISMATCH", label: "라벨·MSDS 불일치" },
  { value: "ADDITIONAL_SUBSTANCE_FOUND", label: "추가 물질 발견" },
  { value: "CASUALTY_OR_EXPOSURE", label: "인명 노출·부상" },
  { value: "WEATHER_INFLUENCE", label: "기상 영향" },
  { value: "OTHER", label: "기타 요인" },
];

export const FINAL_OUTCOME_OPTIONS: Array<{ value: FinalResponseOutcome; label: string }> = [
  { value: "LEAK_STOPPED", label: "누출 차단 완료" },
  { value: "SPREAD_CONTAINED", label: "확산 통제 완료" },
  { value: "EVACUATION_COMPLETED", label: "대피 완료" },
  { value: "MATERIAL_RECOVERED", label: "유출물 회수 완료" },
  { value: "TRANSFERRED_TO_SPECIALIST", label: "전문기관 인계" },
  { value: "FALSE_ALARM", label: "오인 신고·위험 없음 확인" },
  { value: "MONITORING_CONTINUES", label: "현장 모니터링 계속" },
  { value: "OTHER", label: "기타 결과" },
];

export function emptyStructuredOutcomeDraft(
  facilityName = "",
  facilityAddress = "",
): StructuredOutcomeDraft {
  return {
    facilityName,
    facilityAddress,
    performedActions: [],
    briefApplicationStatus: "",
    additionalFactors: [],
    finalResponseOutcome: "",
  };
}

export function toStructuredOutcomeReport(
  draft: StructuredOutcomeDraft,
): OutcomeReport | null {
  const facilityName = draft.facilityName.trim();
  if (!facilityName || draft.performedActions.length === 0
    || !draft.briefApplicationStatus || !draft.finalResponseOutcome) return null;
  return {
    facilityName,
    facilityAddress: draft.facilityAddress.trim() || null,
    performedActions: [...new Set(draft.performedActions)],
    briefApplicationStatus: draft.briefApplicationStatus,
    additionalFactors: [...new Set(draft.additionalFactors)],
    finalResponseOutcome: draft.finalResponseOutcome,
  };
}

function toggle<T extends string>(values: T[], value: T, checked: boolean): T[] {
  if (checked) return values.includes(value) ? values : [...values, value];
  return values.filter((item) => item !== value);
}

interface StructuredOutcomeFormProps {
  value: StructuredOutcomeDraft;
  onChange: (value: StructuredOutcomeDraft) => void;
}

export function StructuredOutcomeForm({ value, onChange }: StructuredOutcomeFormProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
        사고물질·시설 내 충돌물질·위험은 현장확인 기록과 RuleEngine 결과에서 서버가 자동 저장합니다. 아래에는 실제 현장 결과만 기록하세요.
      </div>

      <section aria-labelledby="outcome-facility-title">
        <h3 id="outcome-facility-title" className="text-xs font-bold">사고시설</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-semibold">시설명 <span className="text-primary">필수</span>
            <input value={value.facilityName} maxLength={200} onChange={(event) => onChange({ ...value, facilityName: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-input-background px-3 text-sm outline-none focus:border-primary" placeholder="출동지령 또는 현장 확인 시설명" />
          </label>
          <label className="text-[11px] font-semibold">주소 <span className="font-normal text-muted-foreground">선택</span>
            <input value={value.facilityAddress} maxLength={300} onChange={(event) => onChange({ ...value, facilityAddress: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-input-background px-3 text-sm outline-none focus:border-primary" placeholder="사고시설 주소" />
          </label>
        </div>
      </section>

      <fieldset>
        <legend className="text-xs font-bold">실제 수행한 대응 <span className="text-primary">1개 이상</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PERFORMED_ACTION_OPTIONS.map((option) => <label key={option.value} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-[11px] font-semibold hover:bg-muted"><input type="checkbox" checked={value.performedActions.includes(option.value)} onChange={(event) => onChange({ ...value, performedActions: toggle(value.performedActions, option.value, event.target.checked) })} className="h-4 w-4 accent-primary" />{option.label}</label>)}
        </div>
      </fieldset>

      <label className="block text-xs font-bold">브리프 적용 여부 <span className="text-primary">필수</span>
        <select value={value.briefApplicationStatus} onChange={(event) => onChange({ ...value, briefApplicationStatus: event.target.value as BriefApplicationStatus | "" })} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-input-background px-3 text-sm outline-none focus:border-primary">
          <option value="">선택하세요</option>
          {BRIEF_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      <fieldset>
        <legend className="text-xs font-bold">추가 발견 요인 <span className="font-normal text-muted-foreground">복수 선택·없으면 생략</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ADDITIONAL_FACTOR_OPTIONS.map((option) => <label key={option.value} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-[11px] font-semibold hover:bg-muted"><input type="checkbox" checked={value.additionalFactors.includes(option.value)} onChange={(event) => onChange({ ...value, additionalFactors: toggle(value.additionalFactors, option.value, event.target.checked) })} className="h-4 w-4 accent-primary" />{option.label}</label>)}
        </div>
      </fieldset>

      <label className="block text-xs font-bold">최종 대응 결과 <span className="text-primary">필수</span>
        <select value={value.finalResponseOutcome} onChange={(event) => onChange({ ...value, finalResponseOutcome: event.target.value as FinalResponseOutcome | "" })} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-input-background px-3 text-sm outline-none focus:border-primary">
          <option value="">선택하세요</option>
          {FINAL_OUTCOME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
  );
}
