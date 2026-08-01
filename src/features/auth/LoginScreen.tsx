import { AlertTriangle, ExternalLink, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import lightLogo from "@/imports/logo-light.jpg";
import darkLogo from "@/imports/logo-dark.jpg";
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

interface LoginScreenProps {
  isDark: boolean;
  dataMode: DataMode;
  authLoginUrl: string;
  onDemoLogin: (station: string) => void;
}

export function LoginScreen({ isDark, dataMode, authLoginUrl, onDemoLogin }: LoginScreenProps) {
  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");
  const stations = REGIONS.find((item) => item.label === region)?.stations ?? [];
  const isDemo = dataMode === "DEMO_SIMULATION";
  const isLive = dataMode === "LIVE_API" || dataMode === "CACHED_API";
  const safeAuthLoginUrl = normalizeAuthLoginUrl(authLoginUrl);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background p-6" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <section className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl">
        <ImageWithFallback src={isDark ? darkLogo : lightLogo} alt="케미체크119 화학재난대응지원시스템" className="mx-auto h-14 w-auto object-contain" />
        <div className="my-6 h-px bg-border" />

        {isDemo ? (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
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
                  {stations.map((item) => <option key={item}>{item}</option>)}
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
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background"><ShieldCheck size={18} /></span>
                <div>
                  <h1 className="text-sm font-bold">{isLive ? "운영 인증이 필요합니다" : "서비스 연결 설정이 필요합니다"}</h1>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {isLive
                      ? "사용자 소속과 사고 접근권한은 BE가 서명한 HttpOnly 세션만 기준으로 확인합니다. 지역 선택만으로 운영 화면에 접속하지 않습니다."
                      : "BFF 주소가 설정되지 않아 실제 사용자 인증과 현장대응 기능을 시작할 수 없습니다."}
                  </p>
                </div>
              </div>
            </div>

            {isLive && safeAuthLoginUrl ? (
              <a href={safeAuthLoginUrl} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background transition hover:opacity-90">
                운영 로그인 페이지로 이동<ExternalLink size={15} />
              </a>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                {isLive ? "운영 인증 URL이 설정되지 않았습니다. VITE_AUTH_LOGIN_URL과 신뢰된 인증 어댑터가 필요합니다." : "VITE_BFF_BASE_URL을 먼저 설정해주세요."}
              </div>
            )}

            {isLive && safeAuthLoginUrl && (
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">로그인 후 사용자·소방서 세션 컨텍스트가 확인돼야 대시보드 진입이 활성화됩니다.</p>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-muted-foreground">119 화학재난대응지원시스템 · 케미체크119</p>
      </section>
    </main>
  );
}
