import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, CircleAlert, Headphones, MapPin, Mic, ShieldCheck } from "lucide-react";
import "../../styles/welcome.css";

export default function OpenSection() {
  return (
    <section className="open-section" id="top">
      <div className="open-image" />

      <div className="trend-bar"><span>CHEMICHECK 119 / FIELD SIGNAL</span><strong>화학사고 대응은 정보가 연결되는 순간부터 시작됩니다.</strong><a href="#trends">현장 동향 보기 <ChevronRight size={13} /></a></div>

      <nav className="open-nav" aria-label="랜딩 페이지 메뉴">
        <a className="open-brand" href="#top">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></a>
        <div className="open-nav-links">
            <a href="#features">기능 소개</a>
            <a href="#features">음성·ClawOps</a>
          <a href="#trust">분석 에이전트</a>
          <a href="#trends">현장 동향</a>
        </div>
        <a className="open-nav-cta" href="#start">대응 화면 열기 <ArrowRight size={15} /></a>
      </nav>

      <div className="open-title">
        <p className="open-kicker">CHEMICAL INCIDENT RESPONSE / 01</p>
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          기록은 한 번.
          <br />
          다음 대응은
          <br />
          시스템이 준비합니다.
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
          신고 접수, 전화 전사, 물질 확인, 공식 근거를 한 화면에 모아
          <br />
          현장 책임자가 확인하고 결정할 수 있게 합니다.
        </motion.p>

        <div className="open-actions">
          <a className="open-cta" href="#start">현장 대응 시작하기 <ArrowRight size={17} /></a>
          <a className="open-secondary-cta" href="#features">제품 흐름 보기</a>
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
          <strong>AI는 보조합니다.</strong> 확정과 책임은 현장 지휘관에게 남습니다.
        </p>
      </motion.div>

      <div className="hero-console" aria-label="현장 대응 작업 보드">
        <div className="console-header"><span className="console-status"><span /> LIVE RESPONSE DESK</span><span>09:37 / INTAKE</span></div>
        <div className="console-location"><MapPin size={15} /> 경기 화성 산업단지 인근 <span className="console-pill">검토 필요</span></div>
        <div className="console-voice"><div className="console-icon"><Headphones size={15} /></div><div><span>ClawOps 전화 전사</span><strong>“냄새가 나고 흰 연기가 보여요.”</strong><small>최종 전사 초안 · 소방대원 확인 필요</small></div><Mic size={17} /></div>
        <div className="console-agent"><div className="console-agent-head"><span><ShieldCheck size={14} /> 현장대응 분석 에이전트</span><b>진행 중</b></div><ol><li><i><Check size={12} /></i><span>신고 유형·물질 후보 분석</span><em>완료</em></li><li><i><Check size={12} /></i><span>시설 과거 이력 조회</span><em>완료</em></li><li className="is-current"><i><CircleAlert size={12} /></i><span>두 CAS 현장 확인 게이트</span><em>확인 필요</em></li></ol></div>
        <div className="console-footer"><ShieldCheck size={14} /> 확인 전에는 충돌 등급과 대응 권고를 표시하지 않습니다.</div>
      </div>
    </section>
  );
}