import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  ExternalLink,
  Send,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Phone,
  ChevronDown,
  Check,
  ClipboardList,
  User,
  LogIn,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import logo119 from '@/imports/image.png';
import fullLogo from '@/imports/___________2026-07-24______10.08.43.png';

type Mode = 'collision' | 'substance';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const REGION_DATA: { label: string; en: string; stations: string[] }[] = [
  {
    label: '서울',
    en: 'seoul',
    stations: [
      '종로소방서',
      '중부소방서',
      '용산소방서',
      '성동소방서',
      '광진소방서',
      '동대문소방서',
      '중랑소방서',
      '성북소방서',
      '강북소방서',
      '도봉소방서',
      '노원소방서',
      '은평소방서',
      '서대문소방서',
      '마포소방서',
      '양천소방서',
      '강서소방서',
      '구로소방서',
      '금천소방서',
      '영등포소방서',
      '동작소방서',
      '관악소방서',
      '서초소방서',
      '강남소방서',
      '송파소방서',
      '강동소방서',
    ],
  },
  {
    label: '부산',
    en: 'busan',
    stations: [
      '중부소방서',
      '동부소방서',
      '서부소방서',
      '남부소방서',
      '북부소방서',
      '해운대소방서',
      '사상소방서',
      '금정소방서',
      '강서소방서',
      '연제소방서',
      '수영소방서',
      '사하소방서',
      '동래소방서',
      '영도소방서',
      '기장소방서',
    ],
  },
  {
    label: '대구',
    en: 'daegu',
    stations: [
      '중부소방서',
      '동부소방서',
      '서부소방서',
      '남부소방서',
      '북부소방서',
      '수성소방서',
      '달서소방서',
      '달성소방서',
    ],
  },
  {
    label: '인천',
    en: 'incheon',
    stations: [
      '중부소방서',
      '동부소방서',
      '남부소방서',
      '연수소방서',
      '남동소방서',
      '부평소방서',
      '계양소방서',
      '서부소방서',
      '강화소방서',
      '옹진소방서',
    ],
  },
  {
    label: '광주',
    en: 'gwangju',
    stations: [
      '동부소방서',
      '서부소방서',
      '남부소방서',
      '북부소방서',
      '광산소방서',
    ],
  },
  {
    label: '대전',
    en: 'daejeon',
    stations: [
      '동부소방서',
      '중부소방서',
      '서부소방서',
      '유성소방서',
      '대덕소방서',
    ],
  },
  {
    label: '울산',
    en: 'ulsan',
    stations: [
      '중부소방서',
      '남부소방서',
      '북부소방서',
      '동부소방서',
      '울주소방서',
    ],
  },
  { label: '세종', en: 'sejong', stations: ['세종소방서', '북부소방서'] },
  {
    label: '경기',
    en: 'gyeonggi',
    stations: [
      '수원소방서',
      '성남소방서',
      '의정부소방서',
      '안양소방서',
      '부천소방서',
      '광명소방서',
      '평택소방서',
      '동두천소방서',
      '안산소방서',
      '고양소방서',
      '과천소방서',
      '구리소방서',
      '남양주소방서',
      '오산소방서',
      '시흥소방서',
      '군포소방서',
      '의왕소방서',
      '하남소방서',
      '용인소방서',
      '파주소방서',
      '이천소방서',
      '안성소방서',
      '김포소방서',
      '화성소방서',
      '광주소방서',
      '양주소방서',
      '포천소방서',
      '여주소방서',
      '연천소방서',
      '가평소방서',
      '양평소방서',
    ],
  },
  {
    label: '강원',
    en: 'gangwon',
    stations: [
      '춘천소방서',
      '원주소방서',
      '강릉소방서',
      '동해소방서',
      '태백소방서',
      '속초소방서',
      '삼척소방서',
      '홍천소방서',
      '횡성소방서',
      '영월소방서',
      '평창소방서',
      '정선소방서',
      '철원소방서',
      '화천소방서',
      '양구소방서',
      '인제소방서',
      '고성소방서',
      '양양소방서',
    ],
  },
  {
    label: '충북',
    en: 'chungbuk',
    stations: [
      '청주소방서',
      '충주소방서',
      '제천소방서',
      '보은소방서',
      '옥천소방서',
      '영동소방서',
      '증평소방서',
      '진천소방서',
      '괴산소방서',
      '음성소방서',
      '단양소방서',
      '청원소방서',
    ],
  },
  {
    label: '충남',
    en: 'chungnam',
    stations: [
      '천안소방서',
      '공주소방서',
      '보령소방서',
      '아산소방서',
      '서산소방서',
      '논산소방서',
      '계룡소방서',
      '당진소방서',
      '금산소방서',
      '부여소방서',
      '서천소방서',
      '청양소방서',
      '홍성소방서',
      '예산소방서',
      '태안소방서',
    ],
  },
  {
    label: '전북',
    en: 'jeonbuk',
    stations: [
      '전주소방서',
      '군산소방서',
      '익산소방서',
      '정읍소방서',
      '남원소방서',
      '김제소방서',
      '완주소방서',
      '진안소방서',
      '무주소방서',
      '장수소방서',
      '임실소방서',
      '순창소방서',
      '고창소방서',
      '부안소방서',
    ],
  },
  {
    label: '전남',
    en: 'jeonnam',
    stations: [
      '목포소방서',
      '여수소방서',
      '순천소방서',
      '나주소방서',
      '광양소방서',
      '담양소방서',
      '곡성소방서',
      '구례소방서',
      '고흥소방서',
      '보성소방서',
      '화순소방서',
      '장흥소방서',
      '강진소방서',
      '해남소방서',
      '영암소방서',
      '무안소방서',
      '함평소방서',
      '영광소방서',
      '장성소방서',
      '완도소방서',
      '진도소방서',
      '신안소방서',
    ],
  },
  {
    label: '경북',
    en: 'gyeongbuk',
    stations: [
      '포항소방서',
      '경주소방서',
      '김천소방서',
      '안동소방서',
      '구미소방서',
      '영주소방서',
      '영천소방서',
      '상주소방서',
      '문경소방서',
      '경산소방서',
      '군위소방서',
      '의성소방서',
      '청송소방서',
      '영양소방서',
      '영덕소방서',
      '청도소방서',
      '고령소방서',
      '성주소방서',
      '칠곡소방서',
      '예천소방서',
      '봉화소방서',
      '울진소방서',
      '울릉소방서',
    ],
  },
  {
    label: '경남',
    en: 'gyeongnam',
    stations: [
      '창원소방서',
      '진주소방서',
      '통영소방서',
      '사천소방서',
      '김해소방서',
      '밀양소방서',
      '거제소방서',
      '양산소방서',
      '의령소방서',
      '함안소방서',
      '창녕소방서',
      '고성소방서',
      '남해소방서',
      '하동소방서',
      '산청소방서',
      '함양소방서',
      '거창소방서',
      '합천소방서',
    ],
  },
  {
    label: '제주',
    en: 'jeju',
    stations: ['제주소방서', '서귀포소방서', '동부소방서', '서부소방서'],
  },
];

const RESPONSE_TABLE = [
  {
    label: '사고 상황',
    value: '차아염소산나트륨 누출 의심',
    level: 'warn',
    list: false,
  },
  {
    label: '예상 대응',
    value: ['누출구역 통제', '환기 실시', '적정 보호구 착용', '유입 차단'],
    level: 'normal',
    list: true,
  },
  { label: '시설 내 확인 물질', value: '염산', level: 'normal', list: false },
  { label: '충돌 가능성', value: '높음', level: 'danger', list: false },
  {
    label: '구체적 위험',
    value:
      '차아염소산나트륨이 산성 물질과 접촉하면 유독성 염소가스가 발생할 수 있음',
    level: 'danger',
    list: false,
  },
  {
    label: '우선 확인',
    value: [
      '두 물질의 저장구역·배수로 연결 여부 확인',
      '누출액 혼합 여부 확인',
    ],
    level: 'warn',
    list: true,
  },
  {
    label: '최종 결정',
    value: '현장 지휘관 판단',
    level: 'normal',
    list: false,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요. 119 화학사고대응지원시스템입니다.\n현재 대응충돌검토 모드로 활성화되어 있습니다.\n신고 내용(사고위치, 물질명)을 입력해주세요.',
    time: '09:14',
  },
  {
    id: 2,
    role: 'user',
    text: '○○전자 공장, 차아염소산나트륨 저장탱크 누출',
    time: '09:15',
  },
  { id: 3, role: 'assistant', text: '__TABLE__', time: '09:15' },
];

const SUBSTANCE_INITIAL: Message[] = [
  {
    id: 1,
    role: 'assistant',
    text: '물질검색 모드입니다.\n화학물질명, CAS 번호, 또는 성상을 입력하면 MSDS 기반 정보를 제공합니다.',
    time: '09:14',
  },
];

function formatTime() {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const MOCK_RESPONSES: Record<Mode, (q: string) => string> = {
  collision: () =>
    '입력된 내용을 분석 중입니다.\n\n사고 유형 분류: 독성 가스 누출\n위험 등급: 2등급 (즉각 대응)\n\n충돌 위험 요소:\n- 인근 반경 1km 이내 학교 1개소, 주거지 34세대\n- 북동풍(풍속 3m/s) 기준 확산 예측 범위 초과 우려\n\n추가 정보를 입력하시거나 MSDS 바로가기를 통해 물질 정보를 확인하세요.',
  substance: (q) =>
    `${q.trim() || '조회 물질'} MSDS 요약 정보\n\n분류: 독성 화학물질 / 산업안전보건법 대상\n노출 기준(TWA): 1 ppm\n응급처치: 피부 접촉 시 다량의 물로 15분 이상 세척, 흡입 시 신선한 공기로 즉시 이송\n소화 방법: 물 분무, CO₂ 소화기 사용 가능\n보호구: 양압식 공기호흡기, 화학보호복(Level A)\n\n전체 MSDS는 사이드바 링크에서 확인하세요.`,
};

function ResponseCard({ time }: { time: string }) {
  const [groundOpen, setGroundOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="w-full rounded-xl border border-border bg-secondary overflow-hidden text-xs">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border-b border-border">
        <AlertTriangle size={11} className="text-primary shrink-0" />
        <span className="font-semibold text-primary text-[11px]">
          대응충돌검토 결과
        </span>
      </div>
      <div className="divide-y divide-border">
        {RESPONSE_TABLE.map((row) => (
          <div key={row.label} className="flex items-start gap-2 px-3 py-2">
            <span className="text-muted-foreground whitespace-nowrap w-[90px] shrink-0 pt-[1px]">
              {row.label}
            </span>
            {row.list ? (
              <ul className="flex flex-col gap-0.5">
                {(row.value as string[]).map((item) => (
                  <li
                    key={item}
                    className={`leading-relaxed font-medium flex items-start gap-1.5 ${row.level === 'danger' ? 'text-primary' : row.level === 'warn' ? 'text-accent' : 'text-foreground'}`}
                  >
                    <span className="mt-[5px] w-1 h-1 rounded-full bg-current shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : row.label === '최종 결정' ? (
              <div className="flex items-center justify-between flex-1 gap-2">
                <span
                  className={`leading-relaxed font-medium ${confirmed ? 'text-green-600' : 'text-foreground'}`}
                >
                  {confirmed ? '현장 지휘관 확인 완료' : (row.value as string)}
                </span>
                {!confirmed && (
                  <button
                    onClick={() => setConfirmed(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                  >
                    <Check size={11} />
                    확인
                  </button>
                )}
              </div>
            ) : (
              <span
                className={`leading-relaxed font-medium ${row.level === 'danger' ? 'text-primary' : row.level === 'warn' ? 'text-accent' : 'text-foreground'}`}
              >
                {row.value as string}
              </span>
            )}
          </div>
        ))}
        <div className="px-3 py-2">
          <button
            onClick={() => setGroundOpen((v) => !v)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <ChevronDown
              size={13}
              className="shrink-0 transition-transform duration-200"
              style={{
                transform: groundOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
            <span>대응 근거</span>
          </button>
          {groundOpen && (
            <ul className="mt-1.5 pl-1 flex flex-col gap-1">
              {['MSDS', '반응성 자료', '유사 화학사고 사례'].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-foreground"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-right font-mono border-t border-border">
        {time}
      </div>
    </div>
  );
}

function SaveToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl"
        style={{
          background: 'rgba(80,80,85,0.82)',
          backdropFilter: 'blur(12px)',
          animation: 'fadeInUp 0.22s ease-out',
        }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <Check size={18} strokeWidth={2.5} className="text-white" />
        </div>
        <span className="text-white text-sm font-medium whitespace-nowrap">
          저장된 기록은 화학사고 대응에 활용됩니다.
        </span>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function SelectDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  enabledOptions,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  enabledOptions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative" ref={ref}>
        <button
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm text-left transition-colors focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 focus:border-primary/50'} ${open ? 'border-primary/50' : ''}`}
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || placeholder}
          </span>
          <ChevronDownIcon
            size={14}
            className={`text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-y-auto max-h-52">
            {options.map((opt) => {
              const isEnabled = enabledOptions
                ? enabledOptions.includes(opt)
                : true;
              return (
                <button
                  key={opt}
                  disabled={!isEnabled}
                  onClick={() => {
                    if (isEnabled) {
                      onChange(opt);
                      setOpen(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt ? 'text-primary font-medium bg-primary/5' : isEnabled ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40 cursor-not-allowed'}`}
                >
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
function LoginScreen({ onLogin }: { onLogin: (station: string) => void }) {
  const [region, setRegion] = useState('');
  const [stationName, setStationName] = useState('');

  const regionInfo = REGION_DATA.find((r) => r.label === region);
  const stationOptions = regionInfo?.stations ?? [];
  const code = regionInfo && stationName ? `fire(${regionInfo.en})` : '';
  const canSubmit = region !== '' && stationName !== '';

  function handleRegionChange(v: string) {
    setRegion(v);
    setStationName('');
  }

  return (
    <div
      className="flex flex-col items-center justify-center bg-background"
      style={{ height: '100dvh', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center gap-6">
        <ImageWithFallback
          src={fullLogo}
          alt="케미가드 119 화학재난대응지원시스템"
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
            enabledOptions={['울산']}
          />
          {/* 소방서 */}
          <SelectDropdown
            label="소방서"
            value={stationName}
            options={stationOptions}
            placeholder={
              region ? '소방서를 선택하세요' : '지역을 먼저 선택하세요'
            }
            onChange={setStationName}
            disabled={!region}
          />
          {/* 소방서 코드 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              소방서 코드
            </label>
            <div
              className={`px-3 py-2.5 rounded-lg border border-border bg-muted text-sm font-mono transition-colors ${code ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {code || '코드가 자동 입력됩니다'}
            </div>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => canSubmit && onLogin(region + ' ' + stationName)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <LogIn size={15} />
          시스템 접속
        </button>

        <p className="text-[11px] text-muted-foreground text-center">
          119 화학재난대응지원시스템 · 케미가드
        </p>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function App() {
  const [station, setStation] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('collision');
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [substanceMessages, setSubstanceMessages] =
    useState<Message[]>(SUBSTANCE_INITIAL);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = mode === 'collision' ? messages : substanceMessages;
  const setActiveMessages =
    mode === 'collision' ? setMessages : setSubstanceMessages;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isTyping]);

  if (!station) return <LoginScreen onLogin={(s) => setStation(s)} />;

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setActiveMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text: trimmed, time: formatTime() },
    ]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setActiveMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: MOCK_RESPONSES[mode](trimmed),
          time: formatTime(),
        },
      ]);
      setIsTyping(false);
    }, 1400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSave() {
    setMessages([...INITIAL_MESSAGES]);
    setSubstanceMessages([...SUBSTANCE_INITIAL]);
    setInput('');
    setShowSaveToast(true);
  }

  return (
    <div
      className="flex flex-col bg-background text-foreground overflow-hidden"
      style={{ height: '100dvh', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {showSaveToast && <SaveToast onDone={() => setShowSaveToast(false)} />}

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <ImageWithFallback
            src={fullLogo}
            alt="케미가드 119 화학재난대응지원시스템"
            className="h-9 w-auto object-contain"
          />
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-primary font-mono px-2 py-0.5 rounded border border-primary/30 bg-primary/8">
            <AlertTriangle size={9} />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-foreground">
            <User size={13} className="text-muted-foreground" />
            {station}
          </div>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="설정"
            title={isDark ? '라이트 모드' : '다크 모드'}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="flex flex-col items-center py-4 px-3 gap-2 bg-sidebar border-r border-sidebar-border shrink-0 w-[108px]">
          <a
            href="https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-2 py-2 rounded-md text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent transition-colors"
          >
            <ExternalLink size={13} className="shrink-0" />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                borderBottom: '1px dashed currentColor',
                paddingBottom: '1px',
              }}
            >
              MSDS 바로가기
            </span>
          </a>
          <button
            className="group flex items-center gap-1.5 px-2 py-2 rounded-md text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent transition-colors"
            onClick={() => alert('상황실 전화 연결 중...')}
          >
            <Phone size={13} className="shrink-0" />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                borderBottom: '1px dashed currentColor',
                paddingBottom: '1px',
              }}
            >
              상황실 전화연결
            </span>
          </button>
          <button
            className="group flex items-center gap-1.5 px-2 py-2 rounded-md text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent transition-colors"
            onClick={() => alert('대응기록 조회')}
          >
            <ClipboardList size={13} className="shrink-0" />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                borderBottom: '1px dashed currentColor',
                paddingBottom: '1px',
              }}
            >
              대응기록 조회
            </span>
          </button>
          <div className="mt-auto flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin size={12} />
            <span>지도</span>
          </div>
        </aside>

        {/* MAIN */}
        <main
          className="flex-1 overflow-hidden flex flex-col"
          style={{ padding: '3px' }}
        >
          <div className="flex gap-[3px] flex-1 overflow-hidden">
            {/* MAP */}
            <div
              className="flex-1 rounded-xl overflow-hidden relative bg-card border border-border"
              style={{ minWidth: 0 }}
            >
              <iframe
                title="지도"
                src="https://www.openstreetmap.org/export/embed.html?bbox=129.2,35.4,129.6,35.7&layer=mapnik&marker=35.538,129.318"
                className="w-full h-full border-0"
                style={
                  isDark
                    ? {
                        filter:
                          'invert(0.9) hue-rotate(180deg) saturate(0.7) brightness(0.85)',
                      }
                    : {}
                }
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <AlertTriangle size={11} />
                    사고 발생 — 울산 남구 여천동
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    35.538° N, 129.318° E
                  </div>
                </div>
              </div>
            </div>

            {/* CHAT */}
            <div
              className="flex flex-col rounded-xl overflow-hidden bg-card border border-border"
              style={{ width: '42%', minWidth: 0 }}
            >
              <div className="flex items-center m-3 mb-2 p-[3px] rounded-lg bg-muted border border-border shrink-0 relative">
                <div
                  className="absolute top-[3px] bottom-[3px] rounded-md bg-primary shadow-sm pointer-events-none"
                  style={{
                    width: 'calc(50% - 3px)',
                    left: mode === 'collision' ? '3px' : 'calc(50%)',
                    transition: 'left 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
                {(
                  [
                    { key: 'collision', label: '대응충돌검토' },
                    { key: 'substance', label: '물질검색' },
                  ] as { key: Mode; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className="relative flex-1 text-xs font-medium py-1.5 rounded-md transition-colors duration-200 z-10"
                  >
                    <span
                      className={
                        mode === key ? 'text-white' : 'text-muted-foreground'
                      }
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-3">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.text === '__TABLE__' ? (
                      <ResponseCard time={msg.time} />
                    ) : (
                      <div
                        className={`max-w-[86%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 text-foreground' : 'bg-secondary border border-border text-card-foreground'}`}
                      >
                        <pre
                          className="whitespace-pre-wrap font-sans text-xs leading-relaxed"
                          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                        >
                          {msg.text}
                        </pre>
                        <div className="mt-1 text-[10px] text-muted-foreground text-right font-mono">
                          {msg.time}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary border border-border rounded-xl px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-end gap-2 p-3 border-t border-border shrink-0">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'collision'
                      ? '사고 상황을 입력하세요…'
                      : '물질명 또는 CAS 번호 입력…'
                  }
                  rows={2}
                  className="flex-1 resize-none rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-xs px-3 py-2 outline-none focus:border-primary/50 transition-colors"
                  style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                  aria-label="전송"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex justify-end items-center"
            style={{
              paddingTop: '6px',
              paddingBottom: '8px',
              paddingRight: '3px',
            }}
          >
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              onClick={handleSave}
            >
              기록저장
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
