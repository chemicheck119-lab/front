import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { stationData } from "./StartSection";
import LandingHeader from "./LandingHeader";
import { PHONE_ENTRY } from "./phoneEntry";
import "../../styles/welcome.css";
import "../../styles/home-entry.css";

export default function OpenSection() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");

  const handleStart = () => {
    if (!region || !station) return;
    navigate("/main", { state: { region, station } });
  };

  return (
    <section className="open-section first-slide phone-accent-home" id="top">
      <LandingHeader />
      <div className="first-slide-content">
        <motion.div className="first-slide-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.65 }}>
          <p className="open-kicker">READY WHEN YOU ARE</p>
          <h1><span>현장 대응을 더 빠르게,</span><span>더 안전하게 준비하세요.</span></h1>
          <p className="first-slide-subtitle">
            케미체크119는 현장 판단을 더 빠르게 준비하고,<br />
            대응의 안전성을 함께 지켜줍니다.
          </p>
          <div className="first-slide-actions">
            <a className="open-cta" href="#station-entry">대응 화면 열기 <ArrowRight size={16} aria-hidden="true" /></a>
            <Link className="open-secondary-cta" to="/features">서비스 기능 보기</Link>
          </div>
          <p className="first-slide-note"><strong>확정은 사람이 합니다.</strong> 후보 검색만으로 위험을 확정하지 않습니다.</p>
        </motion.div>

        <motion.div className="hero-mvp" aria-label="신고·대응 화면 진입"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.15, duration: reduceMotion ? 0 : 0.65 }}>
          <div className="hero-mvp-head"><span><i aria-hidden="true" /> INCIDENT BRIEF / FIELD OPS</span><b>PREVIEW</b></div>
          <div className="hero-mvp-location"><MapPin size={16} aria-hidden="true" />신고 접수 · 현장 위치 확인 전<strong>분석 전</strong></div>
          <div className="mvp-entry-card">
            <section className="phone-entry-accent" aria-label="시범 신고 전화">
              <div className="mvp-entry-phone">
                <span><PhoneCall size={20} aria-hidden="true" /></span>
                <div className="phone-entry-number"><small>에이전트 신고</small><strong>{PHONE_ENTRY.display}</strong><em>에이전트 신고 전용 · 확인 후 분석</em></div>
                <a href={PHONE_ENTRY.href} aria-label={`전화로 체험하기 ${PHONE_ENTRY.display}`} aria-describedby="phone-entry-disclaimer">전화하기 <ArrowRight size={14} aria-hidden="true" /></a>
              </div>
            </section>
            <p className="phone-entry-disclaimer" id="phone-entry-disclaimer">
              <strong>실제 긴급 신고는 119로 해주세요.</strong>
              <span>시범 서비스</span>
            </p>
            <div className="mvp-entry-divider" />
            <section className="home-entry-station" id="station-entry" aria-labelledby="station-entry-title">
              <div className="mvp-entry-title">
                <div><small>상황실 모니터링 · 소방대원 대응 지원</small><h2 id="station-entry-title">지역과 소방서를 선택하세요.</h2></div>
                <MapPin size={18} aria-hidden="true" />
              </div>
              <form onSubmit={(event) => { event.preventDefault(); handleStart(); }} aria-label="지역·소방서 선택">
                <div className="home-entry-fields">
                  <div>
                    <label htmlFor="hero-region">지역</label>
                    <select id="hero-region" required value={region} onChange={(event) => { setRegion(event.target.value); setStation(""); }}>
                      <option value="" disabled>지역을 선택해주세요</option>
                      {Object.keys(stationData).map((regionName) => <option key={regionName} value={regionName}>{regionName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="hero-station">소방서</label>
                    <select id="hero-station" required value={station} disabled={!region} onChange={(event) => setStation(event.target.value)}>
                      <option value="" disabled>{region ? "소방서를 선택해주세요" : "지역을 먼저 선택해주세요"}</option>
                      {region && stationData[region].map((stationName) => <option key={stationName} value={stationName}>{stationName}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="mvp-start-button" disabled={!region || !station}>대응 화면 열기 <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
                <p className="home-entry-selection" role="status">{region && station ? `${region} · ${station}` : ""}</p>
              </form>
            </section>
          </div>

          <section className="mvp-input mvp-brief-preview home-entry-brief" aria-labelledby="brief-preview-title">
            <div className="home-entry-brief-heading"><h2 id="brief-preview-title">사고 브리프 미리보기</h2><small>화면 예시 · 실제 분석 결과 아님</small></div>
            <p>신고문을 입력하면 확인할 사항, 물질 후보, 공식 근거를 정리합니다.</p>
          </section>
          <p className="hero-mvp-foot"><ShieldCheck size={15} aria-hidden="true" /><span>두 물질의 CAS를 각각 확인하기 전에는 조합 규칙을 실행하지 않습니다.</span></p>
        </motion.div>
      </div>
    </section>
  );
}
