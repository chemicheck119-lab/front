import { ArrowRight, Database, ExternalLink, Map, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LandingHeader from "../components/welcome/LandingHeader";
import ProofStrip from "../components/welcome/ProofStrip";
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
    <main className="product-page public-data-page landing-v2">
      <LandingHeader />
      <section className="data-hero"><div><p className="product-kicker">PUBLIC DATA / FIELD APPLICATION</p><h1>수많은 현장 데이터를<br />다음 행동으로 바꿉니다.</h1><p>소방 플랫폼 데이터와 공식 화학자료를 모델링해 사고 맥락을 구조화합니다. 결과는 물질 후보 탐색, 근거 연결, 현장 확인 게이트, 대응 기록으로 이어집니다.</p></div><div className="data-source-note"><Database size={18} /><strong>1,868행의 소방 플랫폼 데이터를 모델링했습니다.</strong><span>런북 기준 유효 물질명·CAS 표현 1,530건을 정제하고, 신고 표현을 후보 탐색과 공식 근거 연결에 활용합니다.</span><div className="data-result-line"><b>모델링 결과</b><span>후보·확정·보류 상태를 분리해 대응 화면에 적용</span></div></div></section>
      <ProofStrip items={[
        { value: "1,868", label: "소방 플랫폼 행", detail: "현장 표현·CAS 후보 탐색 연결" },
        { value: "1,530", label: "유효 물질 표현", detail: "이름·CAS 표현 정제 기준" },
        { value: "241", label: "추가 학습 표현", detail: "현장 표현 확장에 사용" },
        { value: "419", label: "잠금 평가 건", detail: "시간 분할 보류평가 기준" },
      ]} />
      <section className="data-validation" aria-label="모델링 및 검증 현황"><div className="data-validation-head"><div><p className="product-kicker">MODELING / VALIDATION STATUS</p><h2>데이터가 모델과 운영 규칙으로<br />이어진 결과</h2></div><p>모델 성능 수치는 평가 범위와 지표를 함께 표시합니다. 전체 사고 대응의 정확도나 현장 판단을 대신하는 수치가 아닙니다.</p></div><div className="data-validation-grid"><article><strong>32.46% → 67.06%</strong><span>Resolver Top-1</span><small>후보 물질 식별 성능 변화</small></article><article><strong>83.76%</strong><span>사고유형 Recall</span><small>전국 공식 사고 외부 보류평가 442건</small></article><article><strong>81.50%</strong><span>물질명 추출 Recall</span><small>관찰 가능한 물질명 기준</small></article><article className="safety"><strong>0건</strong><span>미확인 후보 충돌 실행</span><small>두 CAS 확인 전 CAMEO 규칙을 실행하지 않음</small></article></div></section>
      <section className="data-dashboard"><div className="data-dashboard-head"><div><p className="product-kicker">MODELING / FIELD APPLICATION</p><h2>모델링 결과가 대응 화면에 적용되는 방식</h2><p className="data-dashboard-intro">데이터는 위험을 대신 판단하지 않습니다. 사고 맥락을 빠르게 만들고, 확인할 근거와 다음 행동을 준비하는 운영 구조로 적용됩니다.</p></div><span className="synthetic-badge">APPLICATION EXAMPLE</span></div><div className="data-chart-grid"><article className="data-chart-card"><div><h3>사고 맥락 구성</h3><p>신고·음성·시설·공식 근거를 하나의 사고 기록에 연결</p></div><ResponsiveContainer width="100%" height={250}><BarChart data={responseData} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#183b63" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer><p className="chart-disclaimer">화면 적용 구조를 설명하기 위한 예시 값입니다. 실시간 사고 통계나 위험도는 아닙니다.</p></article><article className="data-chart-card"><div><h3>확인 상태 분리</h3><p>후보와 확정, 검토 필요와 보류를 같은 값으로 취급하지 않음</p></div><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="data-legend">{statusData.map((entry, index) => <span key={entry.name}><i style={{ background: colors[index] }} />{entry.name}</span>)}</div><p className="chart-disclaimer">확인 게이트 적용 방식을 설명하는 예시 상태값입니다.</p></article></div></section>
      <section className="data-usage"><div><p className="product-kicker">HOW DATA BECOMES ACTION</p><h2>공공데이터를<br />현장 판단의 준비물로 바꿉니다.</h2><p className="data-usage-intro">검색 결과를 확정값처럼 보여주지 않고, 사람이 확인해야 할 정보와 공식 근거를 다음 단계에 맞춰 정리합니다.</p></div><div className="data-usage-list"><div><b>01</b><strong>검색 후보 만들기</strong><span>소방 플랫폼의 물질명·CAS 표현을 사고 신고와 대조해 후보를 찾습니다.</span></div><div><b>02</b><strong>공식 근거 붙이기</strong><span>KOSHA·CAMEO 원문과 시설 이력을 후보에 연결하고 출처를 표시합니다.</span></div><div><b>03</b><strong>현장 확인으로 넘기기</strong><span>두 CAS 확인 전에는 충돌 등급을 실행하지 않고, 확인 필요 상태로 보류합니다.</span></div><div><b>04</b><strong>대응 기록 남기기</strong><span>확인된 정보와 판단 과정을 현재 사고 기록에 저장해 다음 대응으로 이어갑니다.</span></div></div></section>
      <section className="data-sources"><p className="product-kicker">SOURCE &amp; LIMITATION</p><h2>데이터를 볼 때 함께 확인해야 할 것</h2><div className="source-grid"><div><Map size={18} /><strong>현장 데이터</strong><span>사고별 확인 기록과 대응 결과에서 생성됩니다.</span></div><div><ShieldCheck size={18} /><strong>공식 자료</strong><span>KOSHA·CAMEO 등 원문 링크를 통해 확인합니다.</span></div><div><ExternalLink size={18} /><strong>해석의 한계</strong><span>공개 시연용 합성 차트는 실제 위험률이나 예측값이 아닙니다.</span></div></div><a href="/features">기능에서 실제 흐름 보기 <ArrowRight size={14} /></a></section>
    </main>
  );
}
