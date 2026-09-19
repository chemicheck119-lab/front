import { ArrowUpRight, BookOpenCheck, FileText, Radio } from "lucide-react";
import "../../styles/welcome.css";

const trendItems = [
  {
    icon: Radio,
    label: "01 · PUBLIC SIGNALS",
    title: "화학안전 규제·정책",
    text: "정부·공공기관의 공개 안내를 사고를 이해하는 출발점으로 확인합니다.",
  },
  {
    icon: BookOpenCheck,
    label: "02 · OFFICIAL EVIDENCE",
    title: "시설·물질 위험 변화",
    text: "취급시설 이력과 화학물질 공식 자료를 사고 맥락에 맞춰 다시 확인합니다.",
  },
  {
    icon: FileText,
    label: "03 · FIELD RECORD",
    title: "대응 기록의 누적",
    text: "신고와 확인, 분석, 대응 결과를 다음 판단과 책임으로 이어갑니다.",
  },
];

export default function TrendSection() {
  return (
    <section className="trend-section" id="trends">
      <div className="trend-heading">
        <div>
          <p className="section-kicker">FIELD &amp; PUBLIC TRENDS</p>
          <h2>화학사고 동향·규제 대응을<br />현장 흐름에 연결합니다.</h2>
        </div>
        <p>공개 자료 연결형 정보 허브입니다. 실시간 통계로 오인하지 않도록 출처와 확인 시점을 함께 표시합니다.</p>
      </div>
      <div className="trend-grid">
        {trendItems.map(({ icon: Icon, label, title, text }) => (
          <article key={title} className="trend-card">
            <div className="trend-card-top"><Icon size={18} /><span>{label}</span></div>
            <h3>{title}</h3>
            <p>{text}</p>
            <a href="/onboarding">연결 준비하기 <ArrowUpRight size={14} /></a>
          </article>
        ))}
      </div>
    </section>
  );
}