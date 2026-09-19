import { motion } from "framer-motion";
import { ArrowRight, Bot, FileAudio, FileText } from "lucide-react";
import "../../styles/welcome.css";

const firstSlideFeatures = [
  {
    number: "01",
    label: "VOICE / CLAWOPS",
    title: "확인하고",
    text: "전화 전사와 현장 음성을 검토 가능한 초안으로 받습니다.",
    icon: FileAudio,
    className: "first-slide-voice",
  },
  {
    number: "02",
    label: "FIELD AGENT",
    title: "찾고",
    text: "현장대응 에이전트가 신고·시설·물질 근거를 단계별로 확인합니다.",
    icon: Bot,
    className: "first-slide-agent",
  },
  {
    number: "03",
    label: "EVIDENCE / RECORD",
    title: "기록합니다",
    text: "확인된 정보와 판단 과정을 다음 대응에 남깁니다.",
    icon: FileText,
    className: "first-slide-record",
  },
] as const;

export default function OpenSection() {
  return (
    <section className="open-section first-slide" id="top">
      <div className="trend-bar"><span>CHEMICHECK 119 / FIELD SIGNAL</span><strong>화학사고 대응은 정보가 연결되는 순간부터 시작됩니다.</strong><a href="#trends">현장 동향 보기 <ArrowRight size={12} /></a></div>

      <nav className="open-nav" aria-label="랜딩 페이지 메뉴">
        <a className="open-brand" href="#top">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></a>
        <div className="open-nav-links">
          <a href="#features">기능 소개</a>
          <a href="#features">음성·ClawOps</a>
          <a href="#trust">분석 에이전트</a>
          <a href="#trends">현장 동향</a>
        </div>
        <a className="open-nav-cta" href="#start">대응 화면 열기 <ArrowRight size={14} /></a>
      </nav>

      <div className="first-slide-content">
        <motion.div
          className="first-slide-heading"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="open-kicker">CHEMICHECK 119 / RESPONSE WORKSPACE</p>
          <p className="first-slide-brand">케미체크119는</p>
          <h1>확인하고, 찾고, 기록합니다.</h1>
          <p className="first-slide-subtitle">신고·음성·시설·물질 정보를 한 흐름으로 연결해<br />현장 책임자가 근거를 확인하며 판단하도록 돕습니다.</p>
        </motion.div>

        <div className="first-slide-cards">
          {firstSlideFeatures.map(({ number, label, title, text, icon: Icon, className }, index) => (
            <motion.article
              className={`first-slide-card ${className}`}
              key={number}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1, duration: 0.55 }}
            >
              <div className="first-slide-card-meta"><span>{number} · {label}</span><Icon size={18} /></div>
              <h2>{title}</h2>
              <div className="first-slide-rule" />
              <p>{text}</p>
              <a href={index === 0 ? "#features" : index === 1 ? "#trust" : "#start"}>자세히 보기 <ArrowRight size={13} /></a>
            </motion.article>
          ))}
        </div>

        <p className="first-slide-note"><strong>AI는 보조합니다.</strong> 확정과 책임은 현장 지휘관에게 남습니다.</p>
      </div>
    </section>
  );
}
