import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileAudio, Headphones, MapPin, ShieldCheck } from "lucide-react";
import { PhoneCall } from "lucide-react";
import { stationData } from "./StartSection";
import "../../styles/welcome.css";

const responseSteps = [
  ["01", "신고문 구조화", "사고 유형·확인할 사항을 먼저 정리"],
  ["02", "음성·ClawOps 연결", "전사 초안은 사람이 확인한 뒤 사용"],
  ["03", "근거와 보류 이유", "물질 후보·출처·다음 행동을 구분"],
] as const;

export default function OpenSection() {
  const navigate = useNavigate();
  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");

  const handleStart = () => {
    if (!region || !station) return;
    navigate("/main", { state: { region, station } });
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
          <div className="mvp-entry-card">
            <div className="mvp-entry-phone"><span><PhoneCall size={15} /></span><div><small>긴급 신고</small><strong>119</strong></div><a href="tel:119">전화 걸기</a></div>
            <div className="mvp-entry-divider" />
            <div className="mvp-entry-title"><div><small>서비스 이용 준비</small><strong>지역과 소방서를 선택하세요.</strong></div><MapPin size={16} /></div>
            <label htmlFor="hero-region">지역</label>
            <select id="hero-region" value={region} onChange={(event) => { setRegion(event.target.value); setStation(""); }}>
              <option value="" disabled>지역을 선택해주세요</option>
              {Object.keys(stationData).map((regionName) => <option key={regionName} value={regionName}>{regionName}</option>)}
            </select>
            <label htmlFor="hero-station">소방서</label>
            <select id="hero-station" value={station} disabled={!region} onChange={(event) => setStation(event.target.value)}>
              <option value="" disabled>소방서를 선택해주세요</option>
              {region && stationData[region].map((stationName) => <option key={stationName} value={stationName}>{stationName}</option>)}
            </select>
            <button type="button" className="mvp-start-button" onClick={handleStart} disabled={!region || !station}>현장 대응 시작하기 <ArrowRight size={14} /></button>
            <p className="mvp-entry-note">선택한 소방서 정보는 현장 대응 화면에 전달됩니다.</p>
          </div>
          <div className="mvp-input mvp-brief-preview">
            <small>사고 브리프 미리보기</small>
            <p>신고문을 입력하면 확인할 사항, 물질 후보, 공식 근거를 정리합니다.</p>
            <div><Headphones size={13} /> ClawOps 전사 초안은 검토 후 사용합니다.</div>
          </div>
          <div className="hero-mvp-foot"><ShieldCheck size={14} /> 두 CAS 확인 전에는 충돌 등급과 대응 권고를 표시하지 않습니다.</div>
        </motion.div>
      </div>
    </section>
  );
}
