import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Copy, Headphones, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { stationData } from "./StartSection";
import LandingHeader from "./LandingHeader";
import { PHONE_ENTRY } from "./phoneEntry";
import "../../styles/welcome.css";
import "../../styles/home-entry.css";

export default function OpenSection() {
  const navigate = useNavigate();
  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_ENTRY.display);
      setCopyStatus("전화번호를 복사했습니다.");
    } catch {
      setCopyStatus("복사할 수 없습니다. 위 번호를 직접 입력해 주세요.");
    }
  };

  const handleStart = () => {
    if (!region || !station) return;
    navigate("/main", { state: { region, station } });
  };

  return (
    <section className="open-section first-slide home-entry" id="top">
      <LandingHeader />
      <div className="home-entry-layout">
        <div className="home-entry-intro">
          <p className="home-entry-kicker">READY WHEN YOU ARE</p>
          <h1><span>현장 대응을 더 빠르게,</span><span>더 안전하게 준비하세요.</span></h1>
          <p className="home-entry-description">
            상황실의 신고 검토부터 소방대원의 현장 확인까지.<br />
            물질 후보와 공식 근거를 한 화면에서 확인하세요.
          </p>
          <section className="home-entry-phone" aria-label="시범 신고 전화">
            <div className="home-entry-phone-row">
              <span className="home-entry-phone-icon"><PhoneCall size={20} aria-hidden="true" /></span>
              <div className="home-entry-phone-number"><small>시범 신고 전화</small><strong>{PHONE_ENTRY.display}</strong></div>
              <a href={PHONE_ENTRY.href} className="home-entry-call" aria-label={`전화로 체험하기 ${PHONE_ENTRY.display}`} aria-describedby="phone-entry-disclaimer">전화로 체험하기</a>
            </div>
            <div className="home-entry-phone-tools">
              <span>PC에서는 휴대전화로 걸어주세요.</span>
              <button type="button" onClick={copyPhone}><Copy size={13} aria-hidden="true" /> 번호 복사</button>
            </div>
            <p className="home-entry-copy-status" role="status">{copyStatus}</p>
            <p className="home-entry-disclaimer" id="phone-entry-disclaimer">
              <strong>실제 긴급 신고는 119로 해주세요.</strong>
              <span>전화→화면 연결은 검증 중입니다. 개인정보 없는 모의 상황으로 체험해 주세요.</span>
            </p>
          </section>
          <div className="home-entry-actions">
            <a className="home-entry-primary" href="#station-entry">대응 화면 열기 <ArrowRight size={16} aria-hidden="true" /></a>
            <Link to="/features">서비스 기능 보기 <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <p className="home-entry-safety"><strong>확정은 사람이 합니다.</strong> 후보 검색만으로 위험을 확정하지 않습니다.</p>
        </div>

        <div className="home-entry-panel" aria-label="신고·대응 화면 진입">
          <div className="home-entry-panel-head"><span>INCIDENT BRIEF / FIELD OPS</span><b>시범 서비스</b></div>
          <p className="home-entry-context"><MapPin size={16} aria-hidden="true" /><span>상황실 · 소방대원 대응 지원</span><small>입장 전</small></p>
          <div className="home-entry-controls">
            <section className="home-entry-station" id="station-entry" aria-labelledby="station-entry-title">
              <div className="home-entry-station-heading">
                <div><small>상황실 · 소방대원 공통 진입</small><h2 id="station-entry-title">지역과 소방서를 선택하세요.</h2></div>
                <MapPin size={18} aria-hidden="true" />
              </div>
              <p className="home-entry-role-note">상황실은 신고·전사를 검토하고, 소방대원은 대응 근거를 확인합니다.</p>
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
                  <button type="submit" className="home-entry-submit" disabled={!region || !station}>대응 화면 열기 <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
                <p className="home-entry-selection" role="status">{region && station ? `${region} · ${station}` : "지역과 소방서를 모두 선택해 주세요."}</p>
              </form>
              <p className="home-entry-boundary">소방서 선택은 로그인·권한 확인이나 실시간 전화 연결을 대신하지 않습니다.</p>
            </section>
          </div>

          <section className="home-entry-brief" aria-labelledby="brief-preview-title">
            <div className="home-entry-brief-heading"><h2 id="brief-preview-title">사고 브리프 미리보기</h2><small>화면 예시 · 실제 분석 결과 아님</small></div>
            <p>신고문을 입력하면 확인할 사항, 물질 후보, 공식 근거를 정리합니다.</p>
            <div className="home-entry-review"><Headphones size={14} aria-hidden="true" /><span>전사 초안은 내용을 확인·수정한 뒤 분석에 사용합니다.</span></div>
          </section>
          <p className="home-entry-gate"><ShieldCheck size={15} aria-hidden="true" /><span>두 물질의 CAS를 각각 확인하기 전에는 조합 규칙을 실행하지 않습니다.</span></p>
        </div>
      </div>
    </section>
  );
}
