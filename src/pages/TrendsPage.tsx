import { ArrowRight, ExternalLink, MessageSquareQuote, Newspaper, Scale } from "lucide-react";
import LandingHeader from "../components/welcome/LandingHeader";
import "../styles/welcome.css";

const trendCards = [
  ["01", "CHEMICAL SAFETY", "화학물질 사고 대응은 초기 확인과 근거 연결이 먼저입니다.", "공식 자료와 현장 확인을 분리해 보여주는 이유입니다."],
  ["02", "PUBLIC POLICY", "정부·공공기관의 공개 지침은 대응의 기준선을 만듭니다.", "현장 화면에서 원문과 확인 상태를 함께 연결합니다."],
  ["03", "FIELD PRACTICE", "상황실과 현장 사이의 정보 손실을 줄이는 흐름이 필요합니다.", "음성 초안은 검토 후 분석으로 넘어가도록 설계했습니다."],
];

export default function TrendsPage() {
  return (
    <main className="product-page trends-page">
      <LandingHeader />
      <section className="trend-hero"><div><p className="product-kicker">GOVERNMENT &amp; FIELD TRENDS</p><h1>동향을 읽고,<br />현장 대응에 연결합니다.</h1><p>정책·공공자료·현장 목소리를 한곳에서 보고, 무엇이 실제 대응 화면에 반영되는지 설명합니다.</p></div><div className="trend-hero-index"><span>INDEX / 2026</span><strong>공개 자료 기반</strong><small>실시간 통계 아님 · 출처 확인 필요</small></div></section>
      <section className="trend-card-grid">{trendCards.map(([number, label, title, text]) => <article key={number}><span>{number} · {label}</span><h2>{title}</h2><p>{text}</p><a href="/public-data">공공데이터 활용 보기 <ArrowRight size={14} /></a></article>)}</section>
      <section className="interview-section"><div className="interview-intro"><p className="product-kicker">FIELD INTERVIEW / COMING NEXT</p><h2>현장의 목소리에서<br />제품의 다음 장면을 만듭니다.</h2><p>상황실·현장 지휘관·안전 담당자 인터뷰를 받으면 실제 발화와 문제 장면을 검증 가능한 인사이트로 정리해 이곳에 반영합니다.</p></div><div className="interview-card"><MessageSquareQuote size={22} /><blockquote>“정보를 찾는 시간보다, 무엇을 믿고 다음 행동을 할지 확인하는 시간이 중요합니다.”</blockquote><footer>케미체크119 제품 설계 원칙 · 자료 제공 후 실제 인터뷰 인용으로 교체</footer></div></section>
      <section className="trend-sources"><p className="product-kicker">PUBLIC REFERENCES</p><h2>동향은 링크와 출처를 남깁니다.</h2><div><a href="/public-data"><Scale size={18} />공공데이터 활용 화면 <ExternalLink size={13} /></a><a href="/features"><Newspaper size={18} />제품 기능과 대응 단계 <ExternalLink size={13} /></a></div></section>
    </main>
  );
}
