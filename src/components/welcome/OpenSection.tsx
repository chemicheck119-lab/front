import { motion } from "framer-motion";
import { ArrowRight, Bot, Check, CircleAlert, FileAudio, FileText, Headphones, MapPin, ShieldCheck } from "lucide-react";
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
      <div className="trend-bar"><span>CHEMICHECK 119 / FIELD SIGNAL</span><strong>화학사고 대응은 정보가 연결되는 순간부터 시작됩니다.</strong><a href="/trends">현장 동향 보기 <ArrowRight size={12} /></a></div>

      <nav className="open-nav" aria-label="랜딩 페이지 메뉴">
        <a className="open-brand" href="#top">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></a>
        <div className="open-nav-links">
          <a href="/features">기능 소개</a>
          <a href="/features#voice">음성·ClawOps</a>
          <a href="/features#agent">분석 에이전트</a>
          <a href="/trends">정부 동향</a>
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

        <div className="hero-mvp" aria-label="현장 대응 MVP 진행 화면">
          <div className="hero-mvp-head"><span><i /> LIVE RESPONSE MVP</span><b>09:37 / INTAKE</b></div>
          <div className="hero-mvp-location"><MapPin size={15} /> 경기 화성 산업단지 인근 <strong>검토 필요</strong></div>
          <div className="hero-mvp-voice"><span><Headphones size={16} /></span><div><small>ClawOps 전화 전사 · 최종 초안</small><strong>"흰 연기가 보이고 냄새가 납니다."</strong><em>소방대원 확인 후 분석에 사용</em></div><FileAudio size={16} /></div>
          <div className="hero-mvp-agent"><div className="hero-mvp-agent-title"><span><Bot size={15} /> 현장대응 분석 에이전트</span><b>진행 중</b></div><ol><li><i><Check size={11} /></i>신고 유형·물질 후보 분석 <em>완료</em></li><li><i><Check size={11} /></i>시설 과거 이력 조회 <em>완료</em></li><li className="current"><i><CircleAlert size={11} /></i>두 CAS 현장 확인 게이트 <em>확인 필요</em></li></ol></div>
          <div className="hero-mvp-foot"><ShieldCheck size={14} /> 확인 전에는 충돌 등급과 대응 권고를 표시하지 않습니다.</div>
        </div>

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
              <a href={index === 0 ? "/features#voice" : index === 1 ? "/features#agent" : "/features#records"}>자세히 보기 <ArrowRight size={13} /></a>
            </motion.article>
          ))}
        </div>

        <p className="first-slide-note"><strong>AI는 보조합니다.</strong> 확정과 책임은 현장 지휘관에게 남습니다.</p>
      </div>
    </section>
  );
}
