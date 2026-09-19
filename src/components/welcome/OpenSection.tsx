import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import "../../styles/welcome.css";

export default function OpenSection() {
  return (
    <section className="open-section" id="top">
      <div className="open-image" />

      <nav className="open-nav" aria-label="랜딩 페이지 메뉴">
        <a className="open-brand" href="#top">케미체크<span>119</span></a>
        <div className="open-nav-links">
          <a href="#features">기능 소개</a>
              <a href="#features">음성·ClawOps</a>
          <a href="#trust">분석 에이전트</a>
          <a href="#trends">현장 동향</a>
        </div>
        <a className="open-nav-cta" href="#start">무료로 시작하기 <ArrowRight size={15} /></a>
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
          한 번의 신고로,
          <br />
          현장 대응의 다음 단계를 준비합니다.
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
          신고·음성·시설·물질 정보를 한 흐름으로 연결해,
          <br />
          현장 책임자가 근거를 확인하며 판단하도록 돕습니다.
        </motion.p>

        <div className="open-actions">
          <a className="open-cta" href="#start">무료로 시작하기 <ArrowRight size={17} /></a>
           <a className="open-secondary-cta" href="#trust">기능 소개 보기 <ArrowDown size={16} /></a>
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
          사람은 한 번 확인하고, 시스템은 다음 대응을 준비합니다.
        </p>
      </motion.div>

      <div className="hero-console" aria-label="현장 대응 정보 미리보기">
        <div className="console-header"><span className="console-status"><span /> CHEMICHECK 119 / LIVE</span><span>RESPONSE OS</span></div>
        <div className="console-location"><MapPin size={15} /> 경기 화성 산업단지 · 신고 접수 09:37</div>
        <div className="console-grid">
          <div><span>01 · 음성·ClawOps</span><strong>전사 초안 수신</strong><small>검토 전에는 분석에 사용하지 않음</small></div>
          <div><span>02 · 현장대응 에이전트</span><strong><ShieldCheck size={15} /> 4단계 진행</strong><small>사고 분석 → 근거 탐색</small></div>
        </div>
        <div className="console-footer"><CheckCircle2 size={15} /> 두 CAS 확인 전에는 충돌 등급과 권고를 표시하지 않습니다.</div>
      </div>
    </section>
  );
}