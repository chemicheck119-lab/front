import { useState, useRef, useEffect } from "react";
import { Settings, ExternalLink, Send, AlertTriangle, Phone, ChevronDown, Check, ClipboardList, User, LogIn, ChevronDown as ChevronDownIcon, Save } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import lightLogo from '@/imports/logo-light.jpg';
import darkLogo from '@/imports/logo-dark.jpg';

type Mode = "collision" | "substance";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
}

interface CompatibilityResultItem {
  substanceA: string;
  substanceB: string;
  result: string;
  reason: string;
  basis: string | null;
}

interface IncidentCheckResult {
  facilityName: string;
  incidentSubstance: string;
  heldSubstanceCount: number;
  facilityFound: boolean;
  hasIncompatible: boolean;
  results: CompatibilityResultItem[];
}

const REGION_DATA: { label: string; en: string; stations: string[] }[] = [
  { label: "서울", en: "seoul", stations: ["종로소방서","중부소방서","용산소방서","성동소방서","광진소방서","동대문소방서","중랑소방서","성북소방서","강북소방서","도봉소방서","노원소방서","은평소방서","서대문소방서","마포소방서","양천소방서","강서소방서","구로소방서","금천소방서","영등포소방서","동작소방서","관악소방서","서초소방서","강남소방서","송파소방서","강동소방서"] },
  { label: "부산", en: "busan", stations: ["중부소방서","동부소방서","서부소방서","남부소방서","북부소방서","해운대소방서","사상소방서","금정소방서","강서소방서","연제소방서","수영소방서","사하소방서","동래소방서","영도소방서","기장소방서"] },
  { label: "대구", en: "daegu", stations: ["중부소방서","동부소방서","서부소방서","남부소방서","북부소방서","수성소방서","달서소방서","달성소방서"] },
  { label: "인천", en: "incheon", stations: ["중부소방서","동부소방서","남부소방서","연수소방서","남동소방서","부평소방서","계양소방서","서부소방서","강화소방서","옹진소방서"] },
  { label: "광주", en: "gwangju", stations: ["동부소방서","서부소방서","남부소방서","북부소방서","광산소방서"] },
  { label: "대전", en: "daejeon", stations: ["동부소방서","중부소방서","서부소방서","유성소방서","대덕소방서"] },
  { label: "울산", en: "ulsan", stations: ["중부소방서","남부소방서","북부소방서","동부소방서","울주소방서"] },
  { label: "세종", en: "sejong", stations: ["세종소방서","북부소방서"] },
  { label: "경기", en: "gyeonggi", stations: ["수원소방서","성남소방서","의정부소방서","안양소방서","부천소방서","광명소방서","평택소방서","동두천소방서","안산소방서","고양소방서","과천소방서","구리소방서","남양주소방서","오산소방서","시흥소방서","군포소방서","의왕소방서","하남소방서","용인소방서","파주소방서","이천소방서","안성소방서","김포소방서","화성소방서","광주소방서","양주소방서","포천소방서","여주소방서","연천소방서","가평소방서","양평소방서"] },
  { label: "강원", en: "gangwon", stations: ["춘천소방서","원주소방서","강릉소방서","동해소방서","태백소방서","속초소방서","삼척소방서","홍천소방서","횡성소방서","영월소방서","평창소방서","정선소방서","철원소방서","화천소방서","양구소방서","인제소방서","고성소방서","양양소방서"] },
  { label: "충북", en: "chungbuk", stations: ["청주소방서","충주소방서","제천소방서","보은소방서","옥천소방서","영동소방서","증평소방서","진천소방서","괴산소방서","음성소방서","단양소방서","청원소방서"] },
  { label: "충남", en: "chungnam", stations: ["천안소방서","공주소방서","보령소방서","아산소방서","서산소방서","논산소방서","계룡소방서","당진소방서","금산소방서","부여소방서","서천소방서","청양소방서","홍성소방서","예산소방서","태안소방서"] },
  { label: "전북", en: "jeonbuk", stations: ["전주소방서","군산소방서","익산소방서","정읍소방서","남원소방서","김제소방서","완주소방서","진안소방서","무주소방서","장수소방서","임실소방서","순창소방서","고창소방서","부안소방서"] },
  { label: "전남", en: "jeonnam", stations: ["목포소방서","여수소방서","순천소방서","나주소방서","광양소방서","담양소방서","곡성소방서","구례소방서","고흥소방서","보성소방서","화순소방서","장흥소방서","강진소방서","해남소방서","영암소방서","무안소방서","함평소방서","영광소방서","장성소방서","완도소방서","진도소방서","신안소방서"] },
  { label: "경북", en: "gyeongbuk", stations: ["포항소방서","경주소방서","김천소방서","안동소방서","구미소방서","영주소방서","영천소방서","상주소방서","문경소방서","경산소방서","군위소방서","의성소방서","청송소방서","영양소방서","영덕소방서","청도소방서","고령소방서","성주소방서","칠곡소방서","예천소방서","봉화소방서","울진소방서","울릉소방서"] },
  { label: "경남", en: "gyeongnam", stations: ["창원소방서","진주소방서","통영소방서","사천소방서","김해소방서","밀양소방서","거제소방서","양산소방서","의령소방서","함안소방서","창녕소방서","고성소방서","남해소방서","하동소방서","산청소방서","함양소방서","거창소방서","합천소방서"] },
  { label: "제주", en: "jeju", stations: ["제주소방서","서귀포소방서","동부소방서","서부소방서"] },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 1, role: "assistant", text: "안녕하세요. 119 화학재난대응지원시스템입니다.\n현재 대응충돌검토 모드로 활성화되어 있습니다.\n신고 내용(사고위치, 물질명)을 입력해주세요.", time: "09:14" },
];

const RESET_MESSAGES: Message[] = [
  { id: 1, role: "assistant", text: "안녕하세요. 119 화학재난대응지원시스템입니다.\n신고 내용(사고위치, 물질명)을 입력해주세요.", time: "" },
];

const SUBSTANCE_INITIAL: Message[] = [
  { id: 1, role: "assistant", text: "물질검색 모드입니다.\n화학물질명, CAS 번호, 또는 성상을 입력하면 MSDS 기반 정보를 제공합니다.", time: "09:14" },
];

function formatTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const MOCK_RESPONSES: Record<Mode, (q: string) => string> = {
  collision: () => "입력된 내용을 분석 중입니다.\n\n사고 유형 분류: 독성 가스 누출\n위험 등급: 2등급 (즉각 대응)\n\n충돌 위험 요소:\n- 인근 반경 1km 이내 학교 1개소, 주거지 34세대\n- 북동풍(풍속 3m/s) 기준 확산 예측 범위 초과 우려\n\n추가 정보를 입력하시거나 MSDS 바로가기를 통해 물질 정보를 확인하세요.",
  substance: (q) => `${q.trim() || "조회 물질"} MSDS 요약 정보\n\n분류: 독성 화학물질 / 산업안전보건법 대상\n노출 기준(TWA): 1 ppm\n응급처치: 피부 접촉 시 다량의 물로 15분 이상 세척, 흡입 시 신선한 공기로 즉시 이송\n소화 방법: 물 분무, CO₂ 소화기 사용 가능\n보호구: 양압식 공기호흡기, 화학보호복(Level A)\n\n전체 MSDS는 사이드바 링크에서 확인하세요.`,
};

const API_BASE = "http://localhost:8080";

function riskClass(result: string) {
  const normalized = result.toLowerCase();
  if (normalized.includes("금지") || normalized.includes("위험") || normalized.includes("높") || normalized.includes("incompatible")) return "text-primary";
  if (normalized.includes("주의") || normalized.includes("중간") || normalized.includes("warn")) return "text-accent";
  return "text-foreground";
}

function ResponseCard({ time, checkResult }: { time: string; checkResult: IncidentCheckResult }) {
  const [groundOpen, setGroundOpen] = useState(false);
  const results = checkResult.results ?? [];
  const colSpan = Math.max(results.length, 1);

  return (
    <div className="w-full rounded-xl border border-border bg-secondary overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border-b border-border">
        <AlertTriangle size={11} className="text-primary shrink-0" />
        <span className="font-semibold text-primary text-[11px]">대응충돌검토 결과</span>
      </div>

      <div className="divide-y divide-border">
        <div className="flex items-start gap-2 px-3 py-2">
          <span className="text-muted-foreground whitespace-nowrap w-[72px] shrink-0 pt-[1px]">사고 상황</span>
          <span className="leading-relaxed font-medium text-foreground">{checkResult.incidentSubstance} 사고 대응 검토</span>
        </div>
        <div className="flex items-start gap-2 px-3 py-2">
          <span className="text-muted-foreground whitespace-nowrap w-[72px] shrink-0 pt-[1px]">대상 시설</span>
          <span className="leading-relaxed font-medium text-foreground">
            {checkResult.facilityFound ? `${checkResult.facilityName} (${checkResult.heldSubstanceCount}종 보유 확인)` : `${checkResult.facilityName} (시설 데이터 미확인)`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/50">
        <span className="text-xs font-semibold text-foreground">2차 사고 위험 분석 결과</span>
        <span className="text-[10px] font-mono text-muted-foreground bg-border px-1.5 py-0.5 rounded">{results.length}건</span>
      </div>

      <div className="border-t border-border overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
        <table className="text-xs border-collapse" style={{ minWidth: "100%" }}>
          <thead>
            <tr className="bg-primary/5 border-b border-border">
              <td className="text-muted-foreground font-medium px-3 py-2 border-r border-border whitespace-nowrap sticky left-0 z-10 w-[108px]" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 5%, var(--card))" }}>사고 물질</td>
              <td colSpan={colSpan} className="px-3 py-2 font-semibold text-foreground">{checkResult.incidentSubstance}</td>
            </tr>
            <tr className="bg-muted/60">
              <th className="text-left text-muted-foreground font-medium px-3 py-2 border-b border-r border-border whitespace-nowrap sticky left-0 z-10 w-[108px]" style={{ backgroundColor: "color-mix(in srgb, var(--muted) 80%, var(--card))" }}>시설 내 충돌 가능 물질</th>
              {results.length > 0 ? results.map((item, index) => (
                <th key={`${item.substanceA}-${item.substanceB}-${index}`} className="text-left text-foreground font-semibold px-3 py-2 border-b border-r border-border whitespace-nowrap min-w-[168px]">
                  {item.substanceB}
                </th>
              )) : <th className="text-left text-muted-foreground font-medium px-3 py-2 border-b border-border min-w-[168px]">대조 항목 없음</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="text-muted-foreground px-3 py-2 border-r border-border whitespace-nowrap sticky left-0 z-10" style={{ backgroundColor: "var(--secondary)" }}>2차 사고 위험도</td>
              {results.length > 0 ? results.map((item, index) => (
                <td key={`${item.substanceB}-result-${index}`} className={`px-3 py-2 border-r border-border font-semibold ${riskClass(item.result)}`}>{item.result}</td>
              )) : <td className="px-3 py-2 text-muted-foreground">낮음/없음</td>}
            </tr>
            <tr className="border-b border-border">
              <td className="text-muted-foreground px-3 py-2 border-r border-border whitespace-nowrap sticky left-0 z-10 align-top" style={{ backgroundColor: "var(--secondary)" }}>구체적 위험</td>
              {results.length > 0 ? results.map((item, index) => (
                <td key={`${item.substanceB}-reason-${index}`} className="px-3 py-2 border-r border-border text-foreground leading-relaxed">{item.reason || "—"}</td>
              )) : <td className="px-3 py-2 text-muted-foreground">확인된 충돌 위험이 없습니다.</td>}
            </tr>
            <tr>
              <td className="text-muted-foreground px-3 py-2 border-r border-border whitespace-nowrap sticky left-0 z-10 align-top" style={{ backgroundColor: "var(--secondary)" }}>
                <button onClick={() => setGroundOpen((v) => !v)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <ChevronDown size={12} style={{ transform: groundOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  대응 근거
                </button>
              </td>
              {groundOpen ? (
                results.length > 0 ? results.map((item, index) => (
                  <td key={`${item.substanceB}-basis-${index}`} className="px-3 py-2 border-r border-border text-foreground leading-relaxed">{item.basis || "근거 정보 없음"}</td>
                )) : <td className="px-3 py-2 text-muted-foreground">대조 항목이 없습니다.</td>
              ) : <td colSpan={colSpan} className="px-3 py-2 text-muted-foreground/50">—</td>}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-border bg-muted/40 flex items-center gap-2">
        <span className="text-muted-foreground shrink-0">최종 결정</span>
        <span className="text-foreground font-medium">현장 지휘관 판단</span>
      </div>
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-right font-mono border-t border-border">{time}</div>
    </div>
  );
}

function SaveModal({ onCancel, onConfirm, saving, error }: { onCancel: () => void; onConfirm: () => void; saving: boolean; error: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onCancel} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-foreground mb-2">사고기록을 저장하시겠습니까?</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">현재 사고의 대화 및 대응 검토 내역이 저장되며, 저장 후 대화창이 초기화됩니다.</p>
          <p className="text-xs text-muted-foreground mt-2">저장된 기록은 대응기록 조회에서 확인할 수 있습니다.</p>
          {error && <p className="text-xs text-primary mt-3">기록 저장에 실패했습니다. 서버 연결 상태를 확인한 뒤 다시 시도해주세요.</p>}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button disabled={saving} onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-border bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50">취소</button>
          <button disabled={saving} onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
            {saving ? "저장 중..." : "계속 진행"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: "rgba(80,80,85,0.82)", backdropFilter: "blur(12px)", animation: "fadeInUp 0.22s ease-out" }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <Check size={18} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-white text-sm font-medium whitespace-nowrap">이 데이터는 화학재난대응에 사용됩니다.</span>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function SelectDropdown({ label, value, options, placeholder, onChange, disabled, enabledOptions }: {
  label: string; value: string; options: string[]; placeholder: string;
  onChange: (v: string) => void; disabled?: boolean; enabledOptions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative" ref={ref}>
        <button
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm text-left transition-colors focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/40 focus:border-primary/50"} ${open ? "border-primary/50" : ""}`}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || placeholder}</span>
          <ChevronDownIcon size={14} className={`text-muted-foreground transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-y-scroll max-h-52" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
            {options.map((opt) => {
              const isEnabled = enabledOptions ? enabledOptions.includes(opt) : true;
              return (
                <button key={opt}
                  disabled={!isEnabled}
                  onClick={() => { if (isEnabled) { onChange(opt); setOpen(false); } }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt ? "text-primary font-medium bg-primary/5" : isEnabled ? "text-foreground hover:bg-muted" : "text-muted-foreground/40 cursor-not-allowed"}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, isDark }: { onLogin: (station: string) => void; isDark: boolean }) {
  const [region, setRegion] = useState("");
  const [stationName, setStationName] = useState("");

  const regionInfo = REGION_DATA.find((r) => r.label === region);
  const stationOptions = regionInfo?.stations ?? [];
  const code = regionInfo && stationName ? `fire(${regionInfo.en})` : "";
  const canSubmit = region !== "" && stationName !== "";

  function handleRegionChange(v: string) { setRegion(v); setStationName(""); }

  return (
    <div className="flex flex-col items-center justify-center bg-background" style={{ height: "100dvh", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center gap-6">
        <ImageWithFallback
<<<<<<< HEAD
          src={isDark ? darkLogo : lightLogo}
          alt="케미가드 119 화학재난대응지원시스템"
=======
          src={fullLogo}
          alt="케미체크 119 화학재난대응지원시스템"
>>>>>>> origin/main
          className="h-14 w-auto object-contain"
        />
        <div className="w-full h-px bg-border" />

        <div className="w-full flex flex-col gap-4">
          {/* 지역 */}
          <SelectDropdown
            label="지역"
            value={region}
            options={REGION_DATA.map((r) => r.label)}
            placeholder="지역을 선택하세요"
            onChange={handleRegionChange}
          />
          {/* 소방서 */}
          <SelectDropdown
            label="소방서"
            value={stationName}
            options={stationOptions}
            placeholder={region ? "소방서를 선택하세요" : "지역을 먼저 선택하세요"}
            onChange={setStationName}
            disabled={!region}
          />
          {/* 소방서 코드 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">소방서 코드</label>
            <div className={`px-3 py-2.5 rounded-lg border border-border bg-muted text-sm font-mono transition-colors ${code ? "text-foreground" : "text-muted-foreground"}`}>
              {code || "코드가 자동 입력됩니다"}
            </div>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => canSubmit && onLogin(region + " " + stationName)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <LogIn size={15} />
          시스템 접속
        </button>

<<<<<<< HEAD
        <p className="text-[11px] text-muted-foreground text-center">119 화학재난대응지원시스템 · 케미가드</p>
=======
        <p className="text-[11px] text-muted-foreground text-center">
          119 화학재난대응지원시스템 · 케미체크
        </p>
>>>>>>> origin/main
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function App() {
  const [station, setStation] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("collision");
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [substanceMessages, setSubstanceMessages] = useState<Message[]>(SUBSTANCE_INITIAL);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [checkResult, setCheckResult] = useState<IncidentCheckResult | null>(null);
  // TODO: 신고문 파싱 API가 시설명을 자동 추출하기 전까지 기존 FE와 동일한 임시 시설명을 사용합니다.
  const [facilityNameInput, setFacilityNameInput] = useState("(주)LG생활건강");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = mode === "collision" ? messages : substanceMessages;
  const setActiveMessages = mode === "collision" ? setMessages : setSubstanceMessages;

  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMessages, isTyping]);

  if (!station) return <LoginScreen onLogin={(s) => setStation(s)} isDark={isDark} />;

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setActiveMessages((prev) => [...prev, { id: Date.now(), role: "user", text: trimmed, time: formatTime() }]);
    setInput("");
    setIsTyping(true);

    if (mode === "collision") {
      try {
        const res = await fetch(`${API_BASE}/api/incident-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facilityName: facilityNameInput, incidentSubstance: trimmed }),
        });
        if (!res.ok) throw new Error("request failed");
        const data: IncidentCheckResult = await res.json();
        setCheckResult(data);
        setActiveMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: "__TABLE__", time: formatTime() }]);
      } catch {
        setActiveMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: "서버 연결에 실패했습니다. 백엔드 서버(8080)가 켜져 있는지 확인해주세요.", time: formatTime() }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setTimeout(() => {
      setActiveMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: MOCK_RESPONSES.substance(trimmed), time: formatTime() }]);
      setIsTyping(false);
    }, 1400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleSaveConfirm() {
    if (!checkResult || !station || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`${API_BASE}/api/c2guard/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityName: checkResult.facilityName,
          incidentSubstance: checkResult.incidentSubstance,
          heldSubstanceCount: checkResult.heldSubstanceCount,
          hasIncompatible: checkResult.hasIncompatible,
          station,
        }),
      });
      if (!res.ok) throw new Error("save failed");

      setMessages(RESET_MESSAGES.map((m) => ({ ...m, time: formatTime() })));
      setSubstanceMessages(SUBSTANCE_INITIAL.map((m) => ({ ...m, time: formatTime() })));
      setInput("");
      setCheckResult(null);
      setShowSaveModal(false);
      setShowSaveToast(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col bg-background text-foreground overflow-hidden" style={{ height: "100dvh", fontFamily: "'Noto Sans KR', sans-serif" }}>
      {showSaveModal && <SaveModal onCancel={() => { setShowSaveModal(false); setSaveError(false); }} onConfirm={handleSaveConfirm} saving={saving} error={saveError} />}
      {showSaveToast && <SaveToast onDone={() => setShowSaveToast(false)} />}

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <ImageWithFallback
<<<<<<< HEAD
            src={isDark ? darkLogo : lightLogo}
            alt="케미가드 119 화학재난대응지원시스템"
=======
            src={fullLogo}
            alt="케미체크 119 화학재난대응지원시스템"
>>>>>>> origin/main
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-foreground">
            <User size={13} className="text-muted-foreground" />
            {station}
          </div>
          <button onClick={() => setIsDark((d) => !d)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="설정" title={isDark ? "라이트 모드" : "다크 모드"}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="flex flex-col py-4 gap-1 bg-sidebar border-r border-sidebar-border shrink-0" style={{ width: "fit-content", paddingLeft: "13px", paddingRight: "13px" }}>
          {[
            { icon: <ExternalLink size={15} />, label: "MSDS 바로가기", href: "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do" },
            { icon: <Phone size={15} />, label: "상황실 전화연결", onClick: () => alert("상황실 전화 연결 중...") },
            { icon: <ClipboardList size={15} />, label: "대응기록 조회", onClick: () => alert("대응기록 조회") },
          ].map(({ icon, label, href, onClick }) => {
            const cls = "group flex items-center gap-2 py-2 px-2 rounded-md text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent transition-colors w-full";
            const inner = (
              <>
                <span className="shrink-0 w-[15px] flex items-center justify-center">{icon}</span>
                <span className="font-medium whitespace-nowrap" style={{ fontSize: "13px", borderBottom: "1px dashed currentColor", paddingBottom: "1px" }}>{label}</span>
              </>
            );
            return href
              ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              : <button key={label} onClick={onClick} className={cls}>{inner}</button>;
          })}
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-hidden flex flex-col" style={{ padding: "3px" }}>
          <div className="flex gap-[3px] flex-1 overflow-hidden">
            {/* MAP */}
            <div className="rounded-xl overflow-hidden relative bg-card border border-border shrink-0" style={{ width: "38%" }}>
              <iframe
                title="지도"
                src="https://www.openstreetmap.org/export/embed.html?bbox=129.14,35.47,129.26,35.56&layer=mapnik&marker=35.512,129.198"
                className="w-full h-full border-0"
                style={isDark ? { filter: "invert(0.9) hue-rotate(180deg) saturate(0.7) brightness(0.85)" } : {}}
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="bg-card/90 backdrop-blur-sm border border-primary/40 rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    {/* 빨간 경고 핀 */}
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 0C2.686 0 0 2.686 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6z" fill="#cc2229"/>
                      <circle cx="6" cy="6" r="2.5" fill="white"/>
                    </svg>
                    사고 발생
                  </div>
                  <div className="text-[11px] text-foreground mt-0.5 font-medium">울산광역시 울주군 삼남읍 반구대로 163</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">35.512° N, 129.198° E</div>
                </div>
              </div>
            </div>

            {/* CHAT */}
            <div className="flex flex-col rounded-xl overflow-hidden bg-card border border-border flex-1" style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2 mx-3 mt-3 mb-2 shrink-0">
                {/* 모드 탭 토글 */}
                <div className="flex-1 flex items-center p-[3px] rounded-lg bg-muted border border-border relative">
                  <div className="absolute top-[3px] bottom-[3px] rounded-md bg-primary shadow-sm pointer-events-none" style={{ width: "calc(50% - 3px)", left: mode === "collision" ? "3px" : "calc(50%)", transition: "left 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }} />
                  {([{ key: "collision", label: "대응충돌검토" }, { key: "substance", label: "물질검색" }] as { key: Mode; label: string }[]).map(({ key, label }) => (
                    <button key={key} onClick={() => setMode(key)} className="relative flex-1 text-xs font-medium py-1.5 rounded-md transition-colors duration-200 z-10">
                      <span className={mode === key ? "text-white" : "text-muted-foreground"}>{label}</span>
                    </button>
                  ))}
                </div>
                {/* 기록 저장 버튼 */}
                <button
                  disabled={!checkResult || saving}
                  onClick={() => { setSaveError(false); setShowSaveModal(true); }}
                  title={!checkResult ? "저장할 사고 대응 결과가 없습니다." : "현재 사고기록 저장"}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary text-xs font-medium text-foreground hover:bg-muted active:scale-95 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save size={13} />
                  기록 저장
                </button>
              </div>

              {mode === "collision" && (
                <div className="mx-3 mb-2 flex items-center gap-2 shrink-0">
                  <label className="text-[10px] text-muted-foreground whitespace-nowrap">대상 시설(임시)</label>
                  <input
                    value={facilityNameInput}
                    onChange={(e) => setFacilityNameInput(e.target.value)}
                    className="flex-1 rounded-md bg-input-background border border-border text-foreground text-[11px] px-2 py-1 outline-none focus:border-primary/50"
                    placeholder="시설명 입력 (예: (주)LG생활건강)"
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-3">
                {activeMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.text === "__TABLE__" && checkResult ? <ResponseCard time={msg.time} checkResult={checkResult} /> : (
                      <div className={`max-w-[86%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "bg-primary/10 border border-primary/20 text-foreground" : "bg-secondary border border-border text-card-foreground"}`}>
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{msg.text}</pre>
                        <div className="mt-1 text-[10px] text-muted-foreground text-right font-mono">{msg.time}</div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary border border-border rounded-xl px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-end gap-2 p-3 border-t border-border shrink-0">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={mode === "collision" ? "사고 상황을 입력하세요…" : "물질명 또는 CAS 번호 입력…"} rows={2} className="flex-1 resize-none rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-xs px-3 py-2 outline-none focus:border-primary/50 transition-colors" style={{ fontFamily: "'Noto Sans KR', sans-serif" }} />
                <button onClick={handleSend} disabled={!input.trim() || isTyping} className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all shrink-0" aria-label="전송">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
