import { ArrowRight, ExternalLink, FileText, MessageSquareQuote, Newspaper, Scale } from "lucide-react";
import LandingHeader from "../components/welcome/LandingHeader";
import ProofStrip from "../components/welcome/ProofStrip";
import "../styles/welcome.css";

const trendCards = [
  ["01", "CHEMICAL SAFETY", "초기 대응은 물질을 맞히는 것보다 확인 순서를 세우는 일입니다.", "후보와 확정, 공식 근거와 현장 확인을 분리해 다음 행동을 준비합니다."],
  ["02", "PUBLIC POLICY", "공개 자료는 판단의 근거와 한계를 함께 남겨야 합니다.", "KOSHA·CAMEO 원문과 확인 상태를 연결하고, 서수 규칙 결과를 확률처럼 표시하지 않습니다."],
  ["03", "FIELD PRACTICE", "상황실과 현장 사이의 정보 손실을 줄이는 운영 흐름이 필요합니다.", "신고·음성·시설·기록을 한 사고 맥락으로 묶고, 확인되지 않은 정보는 다음 단계에서 보류합니다."],
];

const fieldDecisions = [
  ["01", "신고에서 기록까지", "신고 접수 → 후보 탐색 → 현장 확인 → 충돌 검토 → 대응 기록 순서로 화면을 구성했습니다."],
  ["02", "상태와 잠금 이유 표시", "현재 상태·다음 행동·RuleEngine이 잠긴 이유를 한 화면에서 확인하도록 설계했습니다."],
  ["03", "확인과 미확인 분리", "후보·시설 과거 이력·전사 초안을 확정 정보와 섞지 않고 표시합니다."],
];

const publicBriefs = [
  { source: "소방청", tag: "PUBLIC SAFETY", title: "현장 대응은 신고 접수 이후의 정보 흐름을 얼마나 빠르게 정리하느냐의 문제입니다.", text: "공공 안전 기준을 제품 언어로 옮길 때, 신고·출동·현장 확인·기록이 끊기지 않는 구조를 우선했습니다.", href: "https://www.nfa.go.kr/" },
  { source: "KOSHA", tag: "CHEMICAL EVIDENCE", title: "화학물질 정보는 물질명만이 아니라 공식 자료와 라벨 확인을 함께 봐야 합니다.", text: "후보 CAS를 자동 확정하지 않고 KOSHA MSDS 원문과 현장 라벨 확인을 별도 단계로 연결했습니다.", href: "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do" },
  { source: "NOAA / EPA", tag: "RULE REFERENCE", title: "공개 규칙은 근거가 확인된 뒤에만 대응 판단의 입력이 됩니다.", text: "두 CAS가 확인되기 전에는 CAMEO 충돌 규칙을 실행하지 않고, 결과는 확률이 아닌 공개 규칙의 서수 등급으로 표시합니다.", href: "https://cameochemicals.noaa.gov/" },
];

export default function TrendsPage() {
  return (
    <main className="product-page trends-page landing-v2">
      <LandingHeader />
      <section className="trend-hero"><div><p className="product-kicker">GOVERNMENT &amp; FIELD TRENDS</p><h1>공개 기준을 읽고,<br />현장 대응 규칙으로 연결합니다.</h1><p>정부·공공기관의 안전 기준과 공개 자료를 제품 설계의 입력으로 삼아, 확인 순서·근거 연결·기록 보존이 실제 대응 화면에서 작동하도록 만들었습니다.</p></div><div className="trend-hero-index"><span>WHAT THE PRODUCT APPLIES</span><strong>공개 근거는 연결하고,<br />확정되지 않은 정보는 보류합니다.</strong><small>공식 자료·설계 기록·검증 지표를 구분해 표시</small></div></section>
      <section className="trend-news-lead"><div className="trend-news-label"><Newspaper size={16} /><span>PUBLIC POLICY / FIELD APPLICATION</span></div><div><p className="product-kicker">문제 배경</p><h2>화학사고 대응의 기준은 정보량이 아니라 확인 가능한 순서입니다.</h2><p>공개 안전자료는 출처와 한계를 함께 요구합니다. 케미체크119는 신고·시설·물질·근거를 한 사고 맥락에 모으고, 두 CAS 확인 전에는 충돌 규칙을 실행하지 않는 운영 경계를 적용했습니다.</p><a href="/public-data">검증 지표와 데이터 현황 보기 <ArrowRight size={14} /></a></div><aside><span>제품 적용 기준</span><strong>확인·근거·기록</strong><small>공개 자료를 현장 다음 행동으로 연결</small></aside></section>
      <ProofStrip items={[
        { value: "2-CAS", label: "확인 게이트", detail: "두 물질 확인 전 충돌 규칙 잠금" },
        { value: "0건", label: "미확인 후보 실행", detail: "확인 전 CAMEO 규칙 미실행" },
        { value: "141", label: "자동화 테스트", detail: "안전 경계와 계약 검증" },
        { value: "3", label: "제품 적용 원칙", detail: "확인·근거·기록 우선" },
      ]} />
      <section className="trend-card-grid">{trendCards.map(([number, label, title, text]) => <article key={number}><span>{number} · {label}</span><h2>{title}</h2><p>{text}</p><a href="/public-data">공공데이터 활용 보기 <ArrowRight size={14} /></a></article>)}</section>
      <section className="trend-briefing" aria-label="공공 안전자료 브리핑"><div className="trend-briefing-intro"><p className="product-kicker">PUBLIC SOURCE BRIEFING</p><h2>공개 자료를 읽고,<br />제품 규칙으로 번역했습니다.</h2><p>아래 카드는 출처가 있는 공공·공식 자료를 기준으로 케미체크119에 적용한 설계 결정을 정리한 것입니다. 원문을 직접 확인할 수 있도록 출처 링크를 남겼습니다.</p><div className="trend-briefing-links"><a href="/public-data">데이터 현황 보기 <ArrowRight size={14} /></a><a href="/features">적용된 기능 보기 <ArrowRight size={14} /></a></div></div><div className="trend-briefing-list">{publicBriefs.map((brief) => <article key={brief.source}><div className="trend-briefing-meta"><span>{brief.tag}</span><b>{brief.source}</b></div><h3>{brief.title}</h3><p>{brief.text}</p><a href={brief.href} target="_blank" rel="noreferrer">원문 출처 열기 <ExternalLink size={13} /></a></article>)}</div></section>
      <section className="trend-evidence-shot"><div className="trend-evidence-copy"><p className="product-kicker">ACTUAL PRODUCT APPLICATION</p><h2>공공 기준은<br />이 화면의 순서가 됐습니다.</h2><p>실제 대응 화면에서는 확인된 두 물질, 공개 규칙 결과, 추가 현장 확인 사항을 한 흐름으로 보여줍니다. 후보만으로 위험을 확정하지 않고, 최종 판단은 현장 지휘관에게 남깁니다.</p><span className="trend-evidence-note">실제 서비스 화면 캡처 · 시연 데이터 표기 포함</span></div><figure><img src="/images/chemicheck-img-2.png" alt="케미체크119 현장 대응 화면" /><figcaption>사고 위치, 출동 상태, 물질 확인, 공개 규칙 결과를 하나의 대응 화면에서 확인합니다.</figcaption></figure></section>
      <section className="interview-section"><div className="interview-intro"><p className="product-kicker">FIELD FEEDBACK / PRODUCT DECISIONS</p><h2>공개 기준이<br />화면의 순서를 바꿨습니다.</h2><p>확인되지 않은 인터뷰를 인용하지 않고, 현재 확보된 제품 설계 기록과 검증 결과를 운영 결정으로 정리했습니다.</p></div><div className="interview-card"><MessageSquareQuote size={22} /><div className="field-decision-list">{fieldDecisions.map(([number, title, text]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}</div><footer><FileText size={13} /> 근거: 제품 설계 기록 · 검증 지표 · 공개 안전자료 연결 원칙</footer></div></section>
      <section className="trend-sources"><p className="product-kicker">PUBLIC REFERENCES</p><h2>동향은 링크와 출처를 남깁니다.</h2><div><a href="/public-data"><Scale size={18} />공공데이터 활용 화면 <ExternalLink size={13} /></a><a href="/features"><Newspaper size={18} />제품 기능과 대응 단계 <ExternalLink size={13} /></a></div></section>
    </main>
  );
}
