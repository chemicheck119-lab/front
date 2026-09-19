import { ArrowRight, Database, ExternalLink, Map, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LandingHeader from "../components/welcome/LandingHeader";
import "../styles/welcome.css";

const responseData = [
  { name: "신고", value: 42 },
  { name: "음성", value: 31 },
  { name: "시설", value: 18 },
  { name: "근거", value: 27 },
];
const statusData = [{ name: "확인 완료", value: 38 }, { name: "검토 필요", value: 24 }, { name: "보류", value: 16 }];
const colors = ["#183b63", "#4d7fae", "#b7dce0"];

export default function PublicDataPage() {
  return (
    <main className="product-page public-data-page">
      <LandingHeader />
      <section className="data-hero"><div><p className="product-kicker">PUBLIC DATA / FIELD APPLICATION</p><h1>공공데이터는<br />현장 판단의 입력이 됩니다.</h1><p>KOSHA·공식 화학자료·시설 이력을 사고 대응 흐름에 연결하고, 출처와 확인 상태를 함께 보여줍니다.</p></div><div className="data-source-note"><Database size={18} /><strong>지어내지 않고, 확인된 것만 사용합니다.</strong><span>아래 차트는 공개 시연용 합성 데이터입니다. 실제 운영 데이터와 구분해 표시합니다.</span></div></section>
      <section className="data-dashboard"><div className="data-dashboard-head"><div><p className="product-kicker">DEMO DATA PIPELINE</p><h2>데이터가 대응 화면에 쓰이는 방식</h2></div><span className="synthetic-badge">PUBLIC DEMO / SYNTHETIC</span></div><div className="data-chart-grid"><article className="data-chart-card"><div><h3>사고 맥락 입력 비중</h3><p>신고·음성·시설·근거를 하나의 사고 맥락으로 결합</p></div><ResponsiveContainer width="100%" height={250}><BarChart data={responseData} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#183b63" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></article><article className="data-chart-card"><div><h3>확인 상태</h3><p>확정·검토 필요·보류를 섞지 않고 표시</p></div><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="data-legend">{statusData.map((entry, index) => <span key={entry.name}><i style={{ background: colors[index] }} />{entry.name}</span>)}</div></article></div></section>
      <section className="data-usage"><div><p className="product-kicker">HOW DATA BECOMES ACTION</p><h2>데이터를 모으는 데서<br />끝내지 않습니다.</h2></div><div className="data-usage-list"><div><b>01</b><strong>공식 출처 연결</strong><span>자료의 출처와 확인 시점을 사고 맥락에 붙입니다.</span></div><div><b>02</b><strong>현장 확인 게이트</strong><span>후보와 확정, 과거 이력과 현재 확인을 구분합니다.</span></div><div><b>03</b><strong>다음 행동 준비</strong><span>검토가 필요한 정보와 대응 기록을 다음 단계로 넘깁니다.</span></div></div></section>
      <section className="data-sources"><p className="product-kicker">SOURCE &amp; LIMITATION</p><h2>데이터를 볼 때 함께 확인해야 할 것</h2><div className="source-grid"><div><Map size={18} /><strong>현장 데이터</strong><span>사고별 확인 기록과 대응 결과에서 생성됩니다.</span></div><div><ShieldCheck size={18} /><strong>공식 자료</strong><span>KOSHA·CAMEO 등 원문 링크를 통해 확인합니다.</span></div><div><ExternalLink size={18} /><strong>해석의 한계</strong><span>공개 시연용 합성 차트는 실제 위험률이나 예측값이 아닙니다.</span></div></div><a href="/features">기능에서 실제 흐름 보기 <ArrowRight size={14} /></a></section>
    </main>
  );
}
