import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  FileClock,
  Phone,
  Radio,
  X,
} from "lucide-react";
import type { DataMode, IncidentAnalysisResponse } from "../../api/contracts";

const KOSHA_MSDS_URL = "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do";
const ICIS_SEARCH_URL = "https://icis.mcee.go.kr/search/searchType1.do";
const ERG_URL = "https://www.phmsa.dot.gov/training/hazmat/erg/emergency-response-guidebook-erg";

export interface FieldRecordMessage {
  messageId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  text: string;
  createdAt: string;
}

interface DispatchContact {
  name: string;
  phone: string;
}

interface FieldToolsPanelProps {
  station: string;
  dispatchContact: DispatchContact;
  dataMode: DataMode;
  gpsLabel: string;
  gpsDetail: string;
  analysis: IncidentAnalysisResponse | null;
  incidentId: string | null;
  messages: FieldRecordMessage[];
  analysisIds: string[];
  confirmationIds: string[];
  canSave: boolean;
  recordAvailable: boolean;
  onRequestSave: () => void;
  onContactAttempt: () => void;
}

type ToolDialog = "contact" | "sources" | "record" | null;

export function normalizePhoneHref(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

export function countUnsavedRecordItems(messages: FieldRecordMessage[], analysisIds: string[], confirmationIds: string[]) {
  return Math.max(0, messages.length - 1) + analysisIds.length + confirmationIds.length;
}

export function getOfficialSubstanceItems(analysis: IncidentAnalysisResponse | null) {
  if (!analysis) return [];
  const seen = new Set<string>();
  return analysis.substanceCandidates.flatMap((group) => group.candidates.map((candidate) => {
    const key = `${group.role}-${candidate.casNumber}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const confirmed = group.role === "INCIDENT"
      ? analysis.confirmationGate.incidentConfirmed
      : group.role === "FACILITY"
        ? analysis.confirmationGate.facilityConfirmed
        : false;
    return {
      key,
      role: group.role,
      roleLabel: group.role === "INCIDENT" ? "사고물질" : group.role === "FACILITY" ? "시설물질" : "기타 후보",
      displayName: group.surfaceText,
      casNumber: candidate.casNumber,
      confirmed,
    };
  })).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function modeStatus(mode: DataMode) {
  return {
    LIVE_API: { label: "실제 API 설정", tone: "bg-emerald-500" },
    CACHED_API: { label: "캐시 API", tone: "bg-blue-500" },
    DEMO_SIMULATION: { label: "시연 데이터", tone: "bg-amber-500" },
    UNAVAILABLE: { label: "연결 설정 필요", tone: "bg-slate-400" },
  }[mode];
}

function ToolButton({ icon, label, detail, badge, onClick }: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  badge?: string;
  onClick: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <button onClick={(event) => onClick(event.currentTarget)} className="group flex min-h-[58px] w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition hover:border-sidebar-border hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground group-hover:text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-sidebar-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{detail}</span>
      </span>
      {badge && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{badge}</span>}
    </button>
  );
}

function ToolDialogShell({ title, description, onClose, children }: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <section className="flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{description}</p></div>
          <button ref={closeButtonRef} onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="닫기"><X size={16} /></button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function formatRecordTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시각 없음";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function FieldToolsPanel({
  station,
  dispatchContact,
  dataMode,
  gpsLabel,
  gpsDetail,
  analysis,
  incidentId,
  messages,
  analysisIds,
  confirmationIds,
  canSave,
  recordAvailable,
  onRequestSave,
  onContactAttempt,
}: FieldToolsPanelProps) {
  const [activeDialog, setActiveDialog] = useState<ToolDialog>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const officialItems = useMemo(() => getOfficialSubstanceItems(analysis), [analysis]);
  const unsavedCount = countUnsavedRecordItems(messages, analysisIds, confirmationIds);
  const phoneHref = normalizePhoneHref(dispatchContact.phone);
  const dataStatus = modeStatus(dataMode);

  function openDialog(dialog: Exclude<ToolDialog, null>, trigger: HTMLButtonElement) {
    dialogTriggerRef.current = trigger;
    setCopyStatus(null);
    setActiveDialog(dialog);
  }

  function closeDialog() {
    setActiveDialog(null);
    window.setTimeout(() => dialogTriggerRef.current?.focus(), 0);
  }

  async function copyText(value: string, successLabel: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(successLabel);
    } catch {
      setCopyStatus("복사할 수 없습니다. 기기 권한을 확인해주세요.");
    }
  }

  return (
    <>
      <aside className="flex w-[164px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3" aria-label="현장 도구">
        <div className="mb-2 px-2">
          <p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground">현장 도구</p>
          <p className="mt-1 truncate text-[9px] text-muted-foreground">{station}</p>
        </div>
        <nav className="space-y-1" aria-label="현장 도구 메뉴">
          <ToolButton icon={<Phone size={16} />} label="상황실 연결" detail={phoneHref ? dispatchContact.phone : "연락처 설정 필요"} onClick={(trigger) => openDialog("contact", trigger)} />
          <ToolButton icon={<BookOpenCheck size={16} />} label="공식 화학자료" detail={officialItems.length ? `CAS 후보 ${officialItems.length}건` : "분석 후 CAS 자료 확인"} badge={officialItems.length ? String(officialItems.length) : undefined} onClick={(trigger) => openDialog("sources", trigger)} />
          <ToolButton icon={<ClipboardList size={16} />} label="현재 사고 기록" detail={!recordAvailable ? "조회 가능 · 저장 API 준비 중" : incidentId ? `사고 ${incidentId}` : "신고 접수 대기"} badge={unsavedCount ? String(unsavedCount) : undefined} onClick={(trigger) => openDialog("record", trigger)} />
        </nav>

        <div className="mt-auto space-y-2 rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-2.5 text-[9px] text-muted-foreground" aria-label="운영 상태">
          <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dataStatus.tone}`} /><span className="truncate">{dataStatus.label}</span></div>
          <div className="flex items-center gap-2"><Radio size={11} className="shrink-0" /><span className="truncate">{gpsLabel}</span></div>
          <div className="flex items-center gap-2"><FileClock size={11} className="shrink-0" /><span>{unsavedCount ? `미저장 ${unsavedCount}건` : "미저장 없음"}</span></div>
          <p className="border-t border-sidebar-border pt-2 leading-relaxed">{gpsDetail}</p>
        </div>
      </aside>

      {activeDialog === "contact" && (
        <ToolDialogShell title="상황실 연결" description="연결 대상을 확인한 뒤 기기의 전화 기능을 사용합니다." onClose={closeDialog}>
          <div className="rounded-xl border border-border bg-secondary/45 p-4">
            <p className="text-[10px] font-semibold text-muted-foreground">연결 대상</p>
            <p className="mt-1 text-sm font-bold">{dispatchContact.name || `${station} 상황실`}</p>
            <p className="mt-2 font-mono text-lg font-bold">{dispatchContact.phone || "연락처 미설정"}</p>
          </div>
          {phoneHref ? (
            <>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">통화 내용은 앱에서 녹음하지 않습니다. 전화 연결 시도만 현재 대응 기록에 추가됩니다.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => void copyText(dispatchContact.phone, "상황실 번호를 복사했습니다.")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-muted"><Copy size={14} />번호 복사</button>
                <a href={phoneHref} onClick={onContactAttempt} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background hover:opacity-90"><Phone size={14} />전화 연결</a>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
              로그인 세션 또는 운영 환경에 상황실 전화번호가 없습니다. 가짜 번호나 일반 119 번호로 대체하지 않습니다.
            </div>
          )}
          {copyStatus && <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground" aria-live="polite"><Check size={12} />{copyStatus}</p>}
        </ToolDialogShell>
      )}

      {activeDialog === "sources" && (
        <ToolDialogShell title="공식 화학자료" description="후보 CAS를 공식 자료에서 확인합니다. 후보는 현장 확인 전 확정값이 아닙니다." onClose={closeDialog}>
          {officialItems.length ? (
            <div className="space-y-3">
              {officialItems.map((item) => (
                <article key={item.key} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[9px] font-bold text-muted-foreground">{item.roleLabel}</p><p className="mt-1 text-sm font-bold">{item.displayName}</p><p className="mt-1 font-mono text-xs text-muted-foreground">CAS {item.casNumber}</p></div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.confirmed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{item.confirmed ? "현장 확인됨" : "후보·확인 필요"}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <button onClick={() => void copyText(item.casNumber, `${item.casNumber}를 복사했습니다.`)} className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-semibold hover:bg-muted"><Copy size={12} />CAS 복사</button>
                    <a href={KOSHA_MSDS_URL} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-semibold hover:bg-muted">KOSHA<ExternalLink size={11} /></a>
                    <a href={ICIS_SEARCH_URL} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-semibold hover:bg-muted">화학정보<ExternalLink size={11} /></a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center"><BookOpenCheck className="mx-auto text-muted-foreground" size={24} /><p className="mt-2 text-xs font-semibold">표시할 CAS 후보가 없습니다.</p><p className="mt-1 text-[10px] text-muted-foreground">신고 분석 또는 물질검색 후 다시 확인해주세요.</p></div>
          )}
          <div className="mt-4 space-y-2 rounded-xl bg-secondary/55 p-3 text-[10px] leading-relaxed text-muted-foreground">
            <p>KOSHA 검색 자료는 참고용입니다. 현장 제품의 제조·수입·판매자가 제공한 MSDS와 용기 라벨을 우선 확인하세요.</p>
            <a href={ERG_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 font-semibold text-foreground hover:underline">운송 화학사고라면 ERG 2024 확인<ExternalLink size={11} /></a>
          </div>
          {copyStatus && <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground" aria-live="polite"><Check size={12} />{copyStatus}</p>}
        </ToolDialogShell>
      )}

      {activeDialog === "record" && (
        <ToolDialogShell title="현재 사고 기록" description="현재 화면의 대화·분석·현장 확인 상태입니다. 저장 성공 전까지 미저장 기록으로 유지됩니다." onClose={closeDialog}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-secondary p-3"><p className="text-[9px] text-muted-foreground">대화·상태</p><p className="mt-1 text-lg font-bold">{Math.max(0, messages.length - 1)}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-[9px] text-muted-foreground">분석</p><p className="mt-1 text-lg font-bold">{analysisIds.length}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-[9px] text-muted-foreground">현장 확인</p><p className="mt-1 text-lg font-bold">{confirmationIds.length}</p></div>
          </div>
          <div className="mt-4 max-h-[310px] space-y-2 overflow-y-auto pr-1">
            {messages.length > 1 ? messages.slice(1).map((message) => (
              <article key={message.messageId} className="grid grid-cols-[44px_1fr] gap-2 rounded-xl border border-border p-3">
                <time className="text-[9px] font-semibold text-muted-foreground">{formatRecordTime(message.createdAt)}</time>
                <div><p className="text-[9px] font-bold text-muted-foreground">{message.role === "USER" ? "대원" : message.role === "ASSISTANT" ? "에이전트" : "시스템"}</p><p className="mt-1 text-[11px] leading-relaxed">{message.text}</p></div>
              </article>
            )) : <div className="rounded-xl border border-dashed border-border p-5 text-center text-[10px] text-muted-foreground">신고를 접수하면 기록이 시작됩니다.</div>}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-secondary/45 p-3"><div><p className="text-[9px] text-muted-foreground">저장 상태</p><p className="mt-1 text-xs font-bold">{unsavedCount ? `미저장 ${unsavedCount}건` : "미저장 기록 없음"}</p></div><FileClock size={18} className="text-muted-foreground" /></div>
          {!recordAvailable && <p className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[10px] leading-relaxed text-blue-700 dark:text-blue-300">현재 대화·분석·확인 내역은 계속 볼 수 있습니다. 서버 기록저장 API가 배포되면 저장 기능을 활성화합니다.</p>}
          <button disabled={!canSave} onClick={() => { setActiveDialog(null); onRequestSave(); }} className="mt-3 min-h-12 w-full rounded-xl bg-foreground text-xs font-bold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">{!recordAvailable ? "기록 저장 API 준비 중" : canSave ? "현재 대응 기록 저장" : "분석 완료 후 저장 가능"}</button>
        </ToolDialogShell>
      )}
    </>
  );
}
