import { AlertTriangle, ExternalLink, LoaderCircle, LogIn, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/app/components/BrandLogo";
import { getPublicPilotStations, type PilotStationCatalog } from "../../api/auth";
import type { UserFacingErrorInfo } from "../../api/client";
import type { DataMode } from "../../api/contracts";

const REGIONS: Array<{ label: string; stations: string[] }> = [
  { label: "서울", stations: ["종로소방서", "강남소방서", "송파소방서"] },
  { label: "부산", stations: ["중부소방서", "해운대소방서", "강서소방서"] },
  { label: "대구", stations: ["중부소방서", "수성소방서", "달서소방서"] },
  { label: "인천", stations: ["중부소방서", "남동소방서", "서부소방서"] },
  { label: "광주", stations: ["동부소방서", "서부소방서", "광산소방서"] },
  { label: "대전", stations: ["동부소방서", "유성소방서", "대덕소방서"] },
  { label: "울산", stations: ["중부소방서", "남부소방서", "울주소방서"] },
  { label: "세종", stations: ["세종소방서", "북부소방서"] },
  { label: "경기", stations: ["수원소방서", "화성소방서", "평택소방서"] },
  { label: "강원", stations: ["춘천소방서", "원주소방서", "강릉소방서"] },
  { label: "충북", stations: ["청주소방서", "충주소방서", "제천소방서"] },
  { label: "충남", stations: ["천안소방서", "아산소방서", "당진소방서"] },
  { label: "전북", stations: ["전주소방서", "군산소방서", "익산소방서"] },
  { label: "전남", stations: ["목포소방서", "여수소방서", "순천소방서"] },
  { label: "경북", stations: ["포항소방서", "경주소방서", "구미소방서"] },
  { label: "경남", stations: ["창원소방서", "진주소방서", "김해소방서"] },
  { label: "제주", stations: ["제주소방서", "서귀포소방서", "동부소방서"] },
];

interface PilotRegionOption {
  regionName: string;
  stations: Array<{
    stationId: string;
    stationName: string;
    address?: string;
  }>;
}

const FALLBACK_PILOT_REGIONS: PilotRegionOption[] = [
  { regionName: "서울", stations: [{ stationId: "nfa-0985", stationName: "강남소방서" }, { stationId: "nfa-0909", stationName: "강동소방서" }, { stationId: "nfa-0920", stationName: "강북소방서" }] },
  { regionName: "부산", stations: [{ stationId: "nfa-0852", stationName: "강서소방서" }, { stationId: "nfa-0936", stationName: "금정소방서" }, { stationId: "nfa-0856", stationName: "기장소방서" }] },
  { regionName: "대구", stations: [{ stationId: "nfa-0855", stationName: "강서소방서" }, { stationId: "nfa-0859", stationName: "달서소방서" }, { stationId: "nfa-0986", stationName: "달성소방서" }] },
  { regionName: "인천", stations: [{ stationId: "nfa-0970", stationName: "강화소방서" }, { stationId: "nfa-0971", stationName: "계양소방서" }, { stationId: "nfa-0972", stationName: "공단소방서" }] },
  { regionName: "광주", stations: [{ stationId: "nfa-0940", stationName: "광산소방서" }, { stationId: "nfa-0944", stationName: "남부소방서" }, { stationId: "nfa-0969", stationName: "동부소방서" }] },
  { regionName: "대전", stations: [{ stationId: "nfa-0984", stationName: "대덕소방서" }, { stationId: "nfa-0927", stationName: "동부소방서" }, { stationId: "nfa-0959", stationName: "둔산소방서" }] },
  { regionName: "울산", stations: [{ stationId: "nfa-0958", stationName: "남부소방서" }, { stationId: "nfa-0951", stationName: "동부소방서" }, { stationId: "nfa-0979", stationName: "온산소방서" }] },
  { regionName: "세종", stations: [{ stationId: "nfa-0947", stationName: "세종소방서" }, { stationId: "nfa-0981", stationName: "조치원소방서" }] },
  { regionName: "경기", stations: [{ stationId: "nfa-0841", stationName: "가평소방서" }, { stationId: "nfa-0941", stationName: "고양소방서" }, { stationId: "nfa-0993", stationName: "과천소방서" }] },
  { regionName: "강원", stations: [{ stationId: "nfa-0834", stationName: "강릉소방서" }, { stationId: "nfa-0838", stationName: "고성소방서" }, { stationId: "nfa-0818", stationName: "동해소방서" }] },
  { regionName: "충북", stations: [{ stationId: "nfa-0819", stationName: "괴산소방서" }, { stationId: "nfa-0824", stationName: "단양소방서" }, { stationId: "nfa-0784", stationName: "보은소방서" }] },
  { regionName: "충남", stations: [{ stationId: "nfa-0868", stationName: "계룡소방서" }, { stationId: "nfa-0804", stationName: "공주소방서" }, { stationId: "nfa-0913", stationName: "금산소방서" }] },
  { regionName: "전북", stations: [{ stationId: "nfa-0807", stationName: "고창소방서" }, { stationId: "nfa-0858", stationName: "군산소방서" }, { stationId: "nfa-0902", stationName: "김제소방서" }] },
  { regionName: "전남", stations: [{ stationId: "nfa-0916", stationName: "강진소방서" }, { stationId: "nfa-0961", stationName: "고흥소방서" }, { stationId: "nfa-0874", stationName: "광양소방서" }] },
  { regionName: "경북", stations: [{ stationId: "nfa-0815", stationName: "경산소방서" }, { stationId: "nfa-0862", stationName: "경주소방서" }, { stationId: "nfa-0781", stationName: "고령소방서" }] },
  { regionName: "경남", stations: [{ stationId: "nfa-0905", stationName: "거제소방서" }, { stationId: "nfa-0789", stationName: "거창소방서" }, { stationId: "nfa-0911", stationName: "고성소방서" }] },
  { regionName: "제주", stations: [{ stationId: "nfa-0788", stationName: "동부소방서" }, { stationId: "nfa-0897", stationName: "서귀포소방서" }, { stationId: "nfa-0948", stationName: "서부소방서" }] },
];

export function normalizeAuthLoginUrl(value: string, baseUrl = window.location.origin): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, baseUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function isPublicPilotAccessUrl(value: string): boolean {
  try {
    return new URL(value).pathname === "/auth/staging/pilot";
  } catch {
    return false;
  }
}

export function isSameOriginUrl(value: string, origin = window.location.origin): boolean {
  try {
    return new URL(value, origin).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

interface LoginScreenProps {
  dataMode: DataMode;
  authLoginUrl: string;
  sessionChecking?: boolean;
  sessionError?: UserFacingErrorInfo | null;
  onRetrySession?: () => void;
  onDemoLogin: (station: string) => void;
}

export function LoginScreen({ dataMode, authLoginUrl, sessionChecking = false, sessionError = null, onRetrySession, onDemoLogin }: LoginScreenProps) {
  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");
  const [pilotRegion, setPilotRegion] = useState("");
  const [pilotStationId, setPilotStationId] = useState("");
  const [pilotCatalog, setPilotCatalog] = useState<PilotStationCatalog | null>(null);
  const [pilotCatalogStatus, setPilotCatalogStatus] = useState<"IDLE" | "LOADING" | "READY" | "FALLBACK">("IDLE");
  const [pilotCatalogAttempt, setPilotCatalogAttempt] = useState(0);
  const isDemo = dataMode === "DEMO_SIMULATION";
  const isLive = dataMode === "LIVE_API" || dataMode === "CACHED_API";
  const safeAuthLoginUrl = normalizeAuthLoginUrl(authLoginUrl);
  const publicPilotAccess = safeAuthLoginUrl ? isPublicPilotAccessUrl(safeAuthLoginUrl) : false;
  const publicPilotSameOrigin = safeAuthLoginUrl ? isSameOriginUrl(safeAuthLoginUrl) : false;
  const publicPilotHomeUrl = safeAuthLoginUrl && publicPilotAccess
    ? new URL("/", safeAuthLoginUrl).toString()
    : null;
  const visibleSessionError = sessionError?.kind === "SESSION_EXPIRED" ? null : sessionError;
  const demoStations = REGIONS.find((item) => item.label === region)?.stations ?? [];
  const availablePilotRegions = pilotCatalog?.regions ?? FALLBACK_PILOT_REGIONS;
  const pilotStations = availablePilotRegions.find((item) => item.regionName === pilotRegion)?.stations ?? [];
  const selectedPilotStation = pilotStations.find((item) => item.stationId === pilotStationId) ?? null;

  useEffect(() => {
    if (!publicPilotAccess || !publicPilotSameOrigin || !safeAuthLoginUrl || sessionChecking) return;
    const controller = new AbortController();
    setPilotCatalogStatus("LOADING");
    void getPublicPilotStations(safeAuthLoginUrl, controller.signal).then((catalog) => {
      setPilotCatalog(catalog);
      setPilotCatalogStatus("READY");
    }).catch(() => {
      if (!controller.signal.aborted) setPilotCatalogStatus("FALLBACK");
    });
    return () => controller.abort();
  }, [pilotCatalogAttempt, publicPilotAccess, publicPilotSameOrigin, safeAuthLoginUrl, sessionChecking]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10 sm:p-8" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <section className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-10">
        <BrandLogo variant="login" className="mx-auto" />
        <div className="my-8 h-px bg-border" />

        {isDemo ? (
          <>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
              <AlertTriangle size={18} className="shrink-0" />
              <span><strong>시연 데이터</strong> · 실제 사용자 인증과 GPS가 아닙니다.</span>
            </div>
            <div className="space-y-5">
              <label htmlFor="login-region" className="block text-sm font-semibold text-foreground">지역
                <select id="login-region" value={region} onChange={(event) => { setRegion(event.target.value); setStation(""); }} className="mt-2 min-h-[52px] w-full rounded-xl border border-border bg-input-background px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                  <option value="">지역을 선택하세요</option>
                  {REGIONS.map((item) => <option key={item.label}>{item.label}</option>)}
                </select>
              </label>
              <label htmlFor="login-station" className="block text-sm font-semibold text-foreground">소방서
                <select id="login-station" value={station} disabled={!region} onChange={(event) => setStation(event.target.value)} className="mt-2 min-h-[52px] w-full rounded-xl border border-border bg-input-background px-4 text-base text-foreground outline-none disabled:opacity-50 focus:border-primary focus:ring-2 focus:ring-primary/15">
                  <option value="">소방서를 선택하세요</option>
                  {demoStations.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button disabled={!region || !station} onClick={() => onDemoLogin(`${region} ${station}`)} className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-base font-bold text-white transition hover:bg-primary/90 disabled:opacity-40">
                <LogIn size={18} />시연 시스템 접속
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="rounded-2xl border border-border bg-secondary/55 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-foreground text-background">{sessionChecking ? <LoaderCircle size={20} className="animate-spin" /> : <ShieldCheck size={20} />}</span>
                <div>
                  <h1 className="text-base font-bold sm:text-lg">{sessionChecking ? "접속 정보를 확인하고 있습니다" : isLive && publicPilotAccess ? "지역과 관할 소방서를 선택하세요" : isLive ? "운영 인증이 필요합니다" : "서비스 연결 설정이 필요합니다"}</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {sessionChecking
                      ? "BE가 검증한 사용자·역할·소방서 정보를 불러온 뒤 대시보드에 진입합니다."
                      : isLive && publicPilotAccess
                      ? "지역과 소방서를 선택하면 소방청 공개 좌표를 출동 기준점으로 불러옵니다. 계정이나 비밀번호는 필요하지 않습니다."
                      : isLive
                      ? "사용자 소속과 사고 접근권한은 BE가 서명한 HttpOnly 세션만 기준으로 확인합니다. 지역 선택만으로 운영 화면에 접속하지 않습니다."
                      : "BFF 주소가 설정되지 않아 실제 사용자 인증과 현장대응 기능을 시작할 수 없습니다."}
                  </p>
                </div>
              </div>
            </div>

            {visibleSessionError && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-6 text-primary" role="alert">{visibleSessionError.message}{visibleSessionError.requestId ? ` (요청 ID: ${visibleSessionError.requestId})` : ""}</div>}

            {!sessionChecking && isLive && safeAuthLoginUrl && publicPilotAccess && !publicPilotSameOrigin && publicPilotHomeUrl ? (
              <div className="mt-6 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5 text-sm leading-6 text-foreground">
                <p className="font-bold">실제 서비스 주소에서 접속해주세요</p>
                <p className="mt-2 text-muted-foreground">서명 세션을 안전하게 발급하기 위해 소방서 선택과 접속은 chemicheck119.site 안에서만 진행합니다.</p>
                <a href={publicPilotHomeUrl} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 font-bold text-background">
                  chemicheck119.site에서 계속<ExternalLink size={15} />
                </a>
              </div>
            ) : !sessionChecking && isLive && safeAuthLoginUrl && publicPilotAccess ? (
              <form method="post" action={safeAuthLoginUrl} className="mt-6 space-y-5">
                <label htmlFor="pilot-region" className="block text-sm font-semibold text-foreground">지역
                  <select id="pilot-region" value={pilotRegion} onChange={(event) => { setPilotRegion(event.target.value); setPilotStationId(""); }} className="mt-2 min-h-[52px] w-full rounded-xl border border-border bg-input-background px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
                    <option value="">지역을 선택하세요</option>
                    {availablePilotRegions.map((item) => <option key={item.regionName}>{item.regionName}</option>)}
                  </select>
                </label>
                <label htmlFor="pilot-station" className="block text-sm font-semibold text-foreground">소방서
                  <select id="pilot-station" name="stationId" value={pilotStationId} required disabled={!pilotRegion} onChange={(event) => setPilotStationId(event.target.value)} className="mt-2 min-h-[52px] w-full rounded-xl border border-border bg-input-background px-4 text-base text-foreground outline-none disabled:opacity-50 focus:border-primary focus:ring-2 focus:ring-primary/15">
                    <option value="">소방서를 선택하세요</option>
                    {pilotStations.map((item) => <option key={item.stationId} value={item.stationId}>{item.stationName}</option>)}
                  </select>
                </label>
                {selectedPilotStation?.address && (
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6 text-foreground">
                    <strong className="block">{pilotRegion} {selectedPilotStation.stationName}</strong>
                    <p className="mt-2 text-muted-foreground">{selectedPilotStation.address}</p>
                    <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">소방청 공개 좌표 · {pilotCatalog?.sourceDate} 기준</p>
                  </div>
                )}
                {pilotCatalogStatus === "LOADING" && <p className="flex items-center gap-2.5 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin" />전체 소방서 목록을 확인하고 있습니다.</p>}
                {pilotCatalogStatus === "FALLBACK" && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200" role="status">
                    <p>전체 목록 연동 전이라 기본 파일럿 관할로 연결될 수 있습니다.</p>
                    <button type="button" onClick={() => setPilotCatalogAttempt((attempt) => attempt + 1)} className="mt-3 min-h-9 rounded-lg border border-amber-600/25 bg-background/70 px-3 font-bold">목록 다시 불러오기</button>
                  </div>
                )}
                <button type="submit" disabled={!selectedPilotStation} className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-base font-bold text-white transition hover:bg-primary/90 disabled:opacity-40">
                  <LogIn size={18} />선택한 소방서로 접속
                </button>
              </form>
            ) : !sessionChecking && isLive && safeAuthLoginUrl ? (
              <a href={safeAuthLoginUrl} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-foreground text-base font-bold text-background transition hover:opacity-90">
                운영 로그인 페이지로 이동<ExternalLink size={15} />
              </a>
            ) : !sessionChecking ? (
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
                {isLive ? "운영 인증 URL이 설정되지 않았습니다. VITE_AUTH_LOGIN_URL과 신뢰된 인증 어댑터가 필요합니다." : "VITE_BFF_BASE_URL을 먼저 설정해주세요."}
              </div>
            ) : null}

            {!sessionChecking && isLive && onRetrySession && (!publicPilotAccess || visibleSessionError) && <button type="button" onClick={onRetrySession} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold transition hover:bg-muted"><RefreshCw size={16} />세션 다시 확인</button>}

            {!sessionChecking && isLive && safeAuthLoginUrl && (
              <p className="mt-6 border-t border-border pt-5 text-[13px] leading-6 text-muted-foreground">{publicPilotAccess ? "공개 파일럿은 실제 기관 사용자 인증이나 실제 119 지령 계정이 아닙니다. 선택한 좌표는 소방서 출동 기준점이며 대원 GPS가 수신되면 실제 위치로 교체됩니다." : "로그인 후 사용자·소방서 세션 컨텍스트가 확인돼야 대시보드 진입이 활성화됩니다."}</p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-[13px] text-muted-foreground">119 화학재난대응지원시스템 · 케미체크119</p>
      </section>
    </main>
  );
}
