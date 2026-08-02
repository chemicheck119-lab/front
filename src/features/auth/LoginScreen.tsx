import { AlertTriangle, ExternalLink, LoaderCircle, LogIn, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/app/components/BrandLogo";
import type { UserFacingErrorInfo } from "../../api/client";
import type { DataMode } from "../../api/contracts";
import { fetchPublicPilotStations, type PublicPilotStationCatalog } from "../../api/publicPilot";

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
  const isDemo = dataMode === "DEMO_SIMULATION";
  const isLive = dataMode === "LIVE_API" || dataMode === "CACHED_API";
  const safeAuthLoginUrl = normalizeAuthLoginUrl(authLoginUrl);
  const publicPilotAccess = safeAuthLoginUrl ? isPublicPilotAccessUrl(safeAuthLoginUrl) : false;
  const [pilotCatalog, setPilotCatalog] = useState<PublicPilotStationCatalog | null>(null);
  const [pilotCatalogError, setPilotCatalogError] = useState(false);
  const demoStations = REGIONS.find((item) => item.label === region)?.stations ?? [];
  const pilotStations = pilotCatalog?.regions.find((item) => item.regionName === region)?.stations ?? [];
  const selectedPilotStation = pilotStations.find((item) => item.stationId === station) ?? null;

  useEffect(() => {
    if (!publicPilotAccess || !safeAuthLoginUrl || sessionChecking) return;
    const controller = new AbortController();
    setPilotCatalog(null);
    setPilotCatalogError(false);
    void fetchPublicPilotStations(safeAuthLoginUrl, controller.signal)
      .then(setPilotCatalog)
      .catch(() => {
        if (!controller.signal.aborted) setPilotCatalogError(true);
      });
    return () => controller.abort();
  }, [publicPilotAccess, safeAuthLoginUrl, sessionChecking]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background p-6" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl">
        <BrandLogo variant="login" className="mx-auto" />
        <div className="my-6 h-px bg-border" />

        {isDemo ? (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-800 dark:text-amber-200">
              <AlertTriangle size={14} className="shrink-0" />
              <span><strong>시연 데이터</strong> · 실제 사용자 인증과 GPS가 아닙니다.</span>
            </div>
            <div className="space-y-4">
              <label htmlFor="login-region" className="block text-xs font-semibold text-muted-foreground">지역
                <select id="login-region" value={region} onChange={(event) => { setRegion(event.target.value); setStation(""); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none focus:border-primary">
                  <option value="">지역을 선택하세요</option>
                  {REGIONS.map((item) => <option key={item.label}>{item.label}</option>)}
                </select>
              </label>
              <label htmlFor="login-station" className="block text-xs font-semibold text-muted-foreground">소방서
                <select id="login-station" value={station} disabled={!region} onChange={(event) => setStation(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none disabled:opacity-50 focus:border-primary">
                  <option value="">소방서를 선택하세요</option>
                  {demoStations.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button disabled={!region || !station} onClick={() => onDemoLogin(`${region} ${station}`)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-40">
                <LogIn size={16} />시연 시스템 접속
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="rounded-2xl border border-border bg-secondary/55 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">{sessionChecking ? <LoaderCircle size={18} className="animate-spin" /> : <ShieldCheck size={18} />}</span>
                <div>
                  <h1 className="text-sm font-bold">{sessionChecking ? "접속 정보를 확인하고 있습니다" : isLive && publicPilotAccess ? "관할 소방서를 선택하세요" : isLive ? "운영 인증이 필요합니다" : "서비스 연결 설정이 필요합니다"}</h1>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
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

            {sessionError && <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-[13px] leading-relaxed text-primary" role="alert">{sessionError.message}{sessionError.requestId ? ` (요청 ID: ${sessionError.requestId})` : ""}</div>}

            {!sessionChecking && isLive && safeAuthLoginUrl && publicPilotAccess ? (
              <form method="post" action={safeAuthLoginUrl} className="mt-4 space-y-4">
                <label htmlFor="pilot-region" className="block text-xs font-semibold text-muted-foreground">지역
                  <select id="pilot-region" value={region} disabled={!pilotCatalog} onChange={(event) => { setRegion(event.target.value); setStation(""); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none disabled:opacity-50 focus:border-primary">
                    <option value="">{pilotCatalogError ? "소방서 목록을 불러오지 못했습니다" : pilotCatalog ? "지역을 선택하세요" : "소방서 목록을 불러오는 중…"}</option>
                    {pilotCatalog?.regions.map((item) => <option key={item.regionName}>{item.regionName}</option>)}
                  </select>
                </label>
                <label htmlFor="pilot-station" className="block text-xs font-semibold text-muted-foreground">소방서
                  <select id="pilot-station" name="stationId" value={station} required disabled={!region || pilotCatalogError} onChange={(event) => setStation(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-input-background px-3 text-sm text-foreground outline-none disabled:opacity-50 focus:border-primary">
                    <option value="">소방서를 선택하세요</option>
                    {pilotStations.map((item) => <option key={item.stationId} value={item.stationId}>{item.stationName}</option>)}
                  </select>
                </label>
                {selectedPilotStation && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[12px] leading-relaxed text-foreground">
                    <strong>{region} {selectedPilotStation.stationName}</strong>
                    <p className="mt-1 text-muted-foreground">{selectedPilotStation.address}</p>
                    <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">소방청 공개 좌표 · {selectedPilotStation.sourceDate} 기준</p>
                  </div>
                )}
                {pilotCatalogError && <p role="alert" className="text-xs leading-relaxed text-primary">소방서 목록을 불러오지 못했습니다. 잠시 후 세션 다시 확인을 눌러주세요.</p>}
                <button type="submit" disabled={!selectedPilotStation} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-40">
                  <LogIn size={16} />선택한 소방서로 접속
                </button>
              </form>
            ) : !sessionChecking && isLive && safeAuthLoginUrl ? (
              <a href={safeAuthLoginUrl} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background transition hover:opacity-90">
                운영 로그인 페이지로 이동<ExternalLink size={15} />
              </a>
            ) : !sessionChecking ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
                {isLive ? "운영 인증 URL이 설정되지 않았습니다. VITE_AUTH_LOGIN_URL과 신뢰된 인증 어댑터가 필요합니다." : "VITE_BFF_BASE_URL을 먼저 설정해주세요."}
              </div>
            ) : null}

            {!sessionChecking && isLive && onRetrySession && <button type="button" onClick={onRetrySession} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-xs font-bold transition hover:bg-muted"><RefreshCw size={14} />세션 다시 확인</button>}

            {!sessionChecking && isLive && safeAuthLoginUrl && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{publicPilotAccess ? "공개 파일럿은 실제 기관 사용자 인증이나 실제 119 지령 계정이 아닙니다. 선택한 좌표는 소방서 출동 기준점이며 대원 GPS가 수신되면 실제 위치로 교체됩니다." : "로그인 후 사용자·소방서 세션 컨텍스트가 확인돼야 대시보드 진입이 활성화됩니다."}</p>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-[13px] text-muted-foreground">119 화학재난대응지원시스템 · 케미체크119</p>
      </section>
    </main>
  );
}
