import { ArrowRight, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/welcome.css";
import LandingTabs from "./LandingTabs";
import { PHONE_ENTRY } from "./phoneEntry";

export default function LandingHeader() {
  return (
    <>
      <div className="trend-bar landing-header-signal"><span>CHEMICHECK 119 / CHEMICAL RESPONSE</span><strong>AI 대응 지원 시범 서비스 · 실제 긴급 신고는 119</strong><a href={PHONE_ENTRY.href}>시범 전화 {PHONE_ENTRY.display} <ArrowRight size={12} /></a></div>
      <header className="open-nav landing-header-nav">
        <Link className="open-brand" to="/" aria-label="케미체크119 홈">케미체크<span>119</span></Link>
        <LandingTabs />
        <a className="mobile-start-link" href={PHONE_ENTRY.href}>전화 체험</a>
        <a className="open-nav-cta" href={PHONE_ENTRY.href}><PhoneCall size={14} aria-hidden="true" /> 전화로 체험하기</a>
      </header>
    </>
  );
}
