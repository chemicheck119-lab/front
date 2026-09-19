import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Bot, Check, CircleAlert, FileAudio, FileText, Headphones, MapPin, ShieldCheck } from "lucide-react";
import "../../styles/welcome.css";

const responseSteps = [
  ["01", "신고문 구조화", "사고 유형·확인할 사항을 먼저 정리"],
  ["02", "음성·ClawOps 연결", "전사 초안은 사람이 확인한 뒤 사용"],
  ["03", "근거와 보류 이유", "물질 후보·출처·다음 행동을 구분"],
] as const;

export default function OpenSection() {
  const [report, setReport] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = () => {
    if (!report.trim()) return;
    setHasAnalyzed(true);
  };

  return (
    <section className="open-section first-slide" id="top">
      <div className="trend-bar"><span>CHEMICHECK 119 / CHEMICAL RESPONSE</span><strong>신고문 하나로, 확인할 것과 다음 행동을 준비합니다.</strong><a href="/trends">정부 동향 보기 <ArrowRight size={12} /></a></div>
      <nav className="open-nav" aria-label="케미체크119 제품 메뉴">
        <a className="open-brand" href="#top">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></a>
        <div className="open-nav-links"><a href="/features">기능 소개</a><a href="/public-data">공공데이터</a><a href="/trends">정부 동향</a></div>
        <a className="open-nav-cta" href="/onboarding">무료로 시작하기 <ArrowRight size={14} /></a>
      </nav>

      <div className="first-slide-content">
        <motion.div className="first-slide-heading" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}>
          <p className="open-kicker">CHEMICAL INCIDENT RESPONSE SUPPORT</p>
          <h1>화학사고 대응의<br /><em>첫 판단</em>을 준비합니다.</h1>
          <p className="first-slide-subtitle">신고문을 넣으면 확인할 사항, 물질 후보, 공식 근거,<br />보류 이유와 인계 요약을 한 흐름으로 정리합니다.</p>
          <div className="first-slide-actions"><a className="open-cta" href="/onboarding">무료로 시작하기 <ArrowRight size={15} /></a><a className="open-secondary-cta" href="/features">기능 소개 보기</a></div>
          <div className="response-step-list">{responseSteps.map(([number, title, text]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}</div>
          <p className="first-slide-note"><strong>확정은 사람이 합니다.</strong> 후보 검색만으로 위험을 확정하지 않습니다.</p>
        </motion.div>

        <motion.div className="hero-mvp" aria-label="사고 브리프 MVP 화면" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15, duration: .65 }}>
          <div className="hero-mvp-head"><span><i /> INCIDENT BRIEF / MVP</span><b>DEMO PREVIEW</b></div>
          <div className="hero-mvp-location"><MapPin size={15} /> 신고 접수 · 경기 화성 산업단지 인근 <strong>분석 전</strong></div>
          <div className="mvp-input">
            <small>신고문</small>
            <textarea
              value={report}
              onChange={(event) => {
                setReport(event.target.value);
                setHasAnalyzed(false);
              }}
              placeholder="사고 상황을 입력하세요."
              aria-label="사고 신고문"
              rows={3}
            />
            <div><Headphones size={13} /> ClawOps 전사 초안도 검토 후 사용할 수 있습니다.</div>
            <div className="mvp-input-actions">
              <button type="button" onClick={() => setReport("공장 인근에서 흰 연기와 자극적인 냄새가 납니다. 어떤 물질인지 확인이 필요합니다.")}>예시 입력</button>
              <button type="button" className="mvp-analyze-button" onClick={handleAnalyze} disabled={!report.trim()}>신고 분석 시작 <ArrowRight size={13} /></button>
            </div>
          </div>
          <div className="mvp-result-head"><span><Bot size={15} /> 사고 브리프</span><b>단계별 응답</b></div>
          {!hasAnalyzed ? <div className="mvp-result-empty"><Bot size={18} /><span>신고문을 입력하고 분석을 시작하면<br />확인할 사항과 다음 행동이 표시됩니다.</span></div> : <div className="mvp-result-grid"><div><small>확인할 사항</small><strong>현장 물질·시설 확인</strong><em><CircleAlert size={12} /> 2건 검토 필요</em></div><div><small>물질 후보</small><strong>후보 2건</strong><em><ShieldCheck size={12} /> 확정 전 보류</em></div><div><small>공식 근거</small><strong>KOSHA · CAMEO</strong><em><Check size={12} /> 출처 연결</em></div><div><small>인계 요약</small><strong>다음 행동 3건</strong><em><FileText size={12} /> 사람에게 전달</em></div></div>}
          <div className="hero-mvp-foot"><ShieldCheck size={14} /> 두 CAS 확인 전에는 충돌 등급과 대응 권고를 표시하지 않습니다.</div>
        </motion.div>
      </div>
    </section>
  );
}
