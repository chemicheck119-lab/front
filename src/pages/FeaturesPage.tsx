import { ArrowRight, Bot, BookOpenCheck, Check, FileAudio, FileText, MapPin, ShieldCheck } from "lucide-react";
import LandingHeader from "../components/welcome/LandingHeader";
import "../styles/welcome.css";

const featureSections = [
  { id: "intake", number: "01", label: "INCIDENT INTAKE", title: "신고가 들어오는 순간, 대응 맥락을 만듭니다.", text: "신고 내용, 사고 위치, 시설 정보와 현장 관찰을 하나의 사고 기록으로 모읍니다.", icon: FileText },
  { id: "voice", number: "02", label: "VOICE / CLAWOPS", title: "전화와 현장 음성을 검토 가능한 초안으로.", text: "ClawOps 전화 전사와 브라우저 음성을 연결합니다. 전사 결과는 자동 확정하지 않고 소방대원이 확인·수정한 뒤 분석에 사용합니다.", icon: FileAudio },
  { id: "agent", number: "03", label: "OPERATIONS AGENT", title: "분석 에이전트의 다음 행동을 보여줍니다.", text: "신고 분석, 시설 이력, 물질 후보, 현장 확인, 충돌 검토의 완료·대기·확인 필요 상태를 투명하게 표시합니다.", icon: Bot },
  { id: "evidence", number: "04", label: "OFFICIAL EVIDENCE", title: "후보가 아니라 확인된 근거로 판단합니다.", text: "KOSHA·CAMEO와 공식 출처를 연결하고, 두 CAS가 확인되기 전에는 충돌 등급과 권고를 표시하지 않습니다.", icon: BookOpenCheck },
  { id: "records", number: "05", label: "RESPONSE RECORD", title: "대응 과정을 다음 판단의 기록으로 남깁니다.", text: "확인된 정보와 판단 과정을 저장해 현장 대응을 이어가고 책임의 근거를 남깁니다.", icon: ShieldCheck },
];

export default function FeaturesPage() {
  return (
    <main className="product-page">
      <LandingHeader />
      <section className="product-hero">
        <div><p className="product-kicker">FEATURES / RESPONSE WORKSPACE</p><h1>한 번의 신고를<br />다음 대응의 흐름으로.</h1><p>현장 입력부터 음성, 분석 에이전트, 공식 근거, 기록까지 실제 대응 순서대로 확인합니다.</p></div>
        <div className="product-hero-board"><div className="board-top"><span><i /> LIVE MVP</span><b>INCIDENT / HX-2409</b></div><div className="board-location"><MapPin size={15} /> 경기 화성 산업단지 인근</div><div className="board-flow"><div className="done"><Check size={14} /> 신고 접수</div><div className="done"><Check size={14} /> 음성 전사 검토</div><div className="active"><Bot size={14} /> 분석 에이전트 진행</div><div><ShieldCheck size={14} /> 두 CAS 확인 대기</div></div><p className="board-note">최종 확인 전 정보는 보류 상태로 표시됩니다.</p></div>
      </section>
      <section className="feature-detail-list">
        {featureSections.map(({ id, number, label, title, text, icon: Icon }) => (
          <article className="feature-detail" id={id} key={id}><div className="feature-detail-index"><span>{number}</span><Icon size={20} /></div><div><p className="product-kicker">{label}</p><h2>{title}</h2><p>{text}</p></div><div className="feature-detail-mark">{number}</div></article>
        ))}
      </section>
      <section className="product-cta"><p className="product-kicker">READY FOR THE FIELD</p><h2>현장 대응 화면에서<br />직접 시작해보세요.</h2><a className="open-cta" href="/#start">대응 화면 열기 <ArrowRight size={15} /></a></section>
    </main>
  );
}
