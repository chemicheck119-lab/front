import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import "../../styles/welcome.css";

export default function OpenSection() {
  return (
    <section className="open-section" id="top">
      <div className="open-image" />

      <nav className="open-nav" aria-label="랜딩 페이지 메뉴">
        <a className="open-brand" href="#top">CHEMICHECK<span>119</span></a>
        <div className="open-nav-links">
          <a href="#solution">대응 흐름</a>
          <a href="#features">주요 기능</a>
          <a href="#trust">신뢰 원칙</a>
        </div>
        <a className="open-nav-cta" href="#start">시작하기 <ArrowRight size={15} /></a>
      </nav>

      <div className="open-title">
        <p className="open-kicker">CHEMICAL INCIDENT RESPONSE SUPPORT</p>
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          화학사고 대응의 첫 판단을
          <br />
          더 빠르고 안전하게
        </motion.h1>

        <motion.p
          className="open-subtitle"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          흩어진 현장 정보와 위험 근거를 한 흐름으로 연결해,
          <br />
          현장 책임자가 더 빠르게 판단할 수 있도록 돕습니다.
        </motion.p>

        <div className="open-actions">
          <a className="open-cta" href="#start">현장 대응 시작하기 <ArrowRight size={17} /></a>
          <a className="open-secondary-cta" href="#solution">시연 보기 <ArrowDown size={16} /></a>
        </div>
      </div>

      <motion.div
        className="open-description"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{
          once: true,
          amount: 0.5,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <p>
          AI는 보조하고, 최종 판단은 사람에게 남깁니다.
        </p>
      </motion.div>

      <div className="hero-console" aria-label="현장 대응 정보 미리보기">
        <div className="console-header"><span className="console-status"><span /> LIVE RESPONSE DESK</span><span>09:42:18</span></div>
        <div className="console-location"><MapPin size={15} /> 경기도 화성시 산업단지 인근</div>
        <div className="console-grid">
          <div><span>사고 정보</span><strong>유출 의심 · 확인 필요</strong><small>신고 접수 09:37</small></div>
          <div><span>주변 위험</span><strong><ShieldCheck size={15} /> 3개 근거 확인</strong><small>시설·물질 정보 연결</small></div>
        </div>
        <div className="console-footer"><CheckCircle2 size={15} /> 최종 확인 전 정보는 보류 상태로 표시됩니다.</div>
      </div>
    </section>
  );
}