import { ArrowRight, ExternalLink, FileText, MessageSquareQuote, Newspaper, Scale } from "lucide-react";
import LandingHeader from "../components/welcome/LandingHeader";
import ProofStrip from "../components/welcome/ProofStrip";
import "../styles/welcome.css";

const trendCards = [
  ["01", "CHEMICAL SAFETY", "화학물질 사고 대응은 초기 확인과 근거 연결이 먼저입니다.", "공식 자료와 현장 확인을 분리해 보여주는 이유입니다."],
  ["02", "PUBLIC POLICY", "정부·공공기관의 공개 지침은 대응의 기준선을 만듭니다.", "현장 화면에서 원문과 확인 상태를 함께 연결합니다."],
  ["03", "FIELD PRACTICE", "상황실과 현장 사이의 정보 손실을 줄이는 흐름이 필요합니다.", "음성 초안은 검토 후 분석으로 넘어가도록 설계했습니다."],
];

const fieldDecisions = [
  ["01", "소방 프로세스 중심", "신고 접수 → 출동 → 현장 확인 → 충돌 검토 → 인계 순서로 화면을 재구성했습니다."],
  ["02", "5초 안에 상태 파악", "현재 상태·다음 행동·잠금 이유를 첫 화면에서 확인하도록 설계했습니다."],
  ["03", "확인과 미확인 분리", "후보·과거 이력·전사 초안을 확정 정보와 섞지 않고 표시합니다."],
];

export default function TrendsPage() {
  return (
    <main className="product-page trends-page landing-v2">
      <LandingHeader />
      <section className="trend-hero"><div><p className="product-kicker">GOVERNMENT &amp; FIELD TRENDS</p><h1>동향을 읽고,<br />다음 대응의 기준을 세웁니다.</h1><p>정책·공공자료·현장 목소리를 확인된 근거로 정리하고, 실제 제품 설계에 무엇이 반영됐는지 보여줍니다.</p></div><div className="trend-hero-index"><span>WHAT WE CAN CLAIM</span><strong>검증된 자료는 연결하고,<br />없는 인터뷰는 만들지 않습니다.</strong><small>현직자 인터뷰 자료 수집 후 실제 인용으로 교체</small></div></section>
      <section className="trend-news-lead"><div className="trend-news-label"><Newspaper size={16} /><span>PUBLIC POLICY / GOVERNMENT SIGNAL</span></div><div><p className="product-kicker">문제 배경</p><h2>화학사고 대응은 정보가 늦게 모이는 순간부터 어려워집니다.</h2><p>공개 정책·안전자료가 요구하는 것은 기록과 확인이지만, 현장에서는 신고·시설·물질·근거가 서로 다른 흐름으로 들어옵니다. 케미체크119는 이 간극을 대응 화면에서 줄이도록 설계했습니다.</p><a href="/public-data">공공데이터와 공식 근거 보기 <ArrowRight size={14} /></a></div><aside><span>출처 기준</span><strong>공개 정책·공식 자료</strong><small>실제 원문과 확인 시점을 연결하는 구조</small></aside></section>
      <ProofStrip items={[
        { value: "03", label: "제품 설계 원칙", detail: "확인·보류·기록을 우선" },
        { value: "7", label: "연결된 핵심 흐름", detail: "분석·물질·근거·확인·기록 계약" },
        { value: "OPEN", label: "인터뷰 근거", detail: "현장 자료 수신 후 실제 인용 예정" },
        { value: "SOURCE", label: "동향 기준", detail: "공개 자료와 원문 링크 우선" },
      ]} />
      <section className="trend-card-grid">{trendCards.map(([number, label, title, text]) => <article key={number}><span>{number} · {label}</span><h2>{title}</h2><p>{text}</p><a href="/public-data">공공데이터 활용 보기 <ArrowRight size={14} /></a></article>)}</section>
      <section className="interview-section"><div className="interview-intro"><p className="product-kicker">FIELD FEEDBACK / PRODUCT DECISIONS</p><h2>현장 피드백이<br />화면의 순서를 바꿨습니다.</h2><p>공개된 제품 고도화 기록에서 확인된 피드백을 설계 결정으로 연결했습니다. 원문 인터뷰가 확보되면 인용과 출처를 이 영역에 교체합니다.</p></div><div className="interview-card"><MessageSquareQuote size={22} /><div className="field-decision-list">{fieldDecisions.map(([number, title, text]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}</div><footer><FileText size={13} /> 근거: 제품 고도화 방향 요약 · 공개된 팀 설계 기록</footer></div></section>
      <section className="trend-sources"><p className="product-kicker">PUBLIC REFERENCES</p><h2>동향은 링크와 출처를 남깁니다.</h2><div><a href="/public-data"><Scale size={18} />공공데이터 활용 화면 <ExternalLink size={13} /></a><a href="/features"><Newspaper size={18} />제품 기능과 대응 단계 <ExternalLink size={13} /></a></div></section>
    </main>
  );
}
