import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/welcome.css";
import LandingTabs from "./LandingTabs";

export default function LandingHeader() {
  return (
    <>
      <div className="trend-bar landing-header-signal"><span>CHEMICHECK 119 / CHEMICAL RESPONSE</span><strong>신고문 하나로, 확인할 것과 다음 행동을 준비합니다.</strong><Link to="tel:070-5276-7681">에이전트 신고 070-5276-7681 <ArrowRight size={12} /></Link></div>
      <header className="open-nav landing-header-nav">
        <Link className="open-brand" to="/" aria-label="케미체크119 홈">케미체크<span>119</span></Link>
        <LandingTabs />
        <Link className="mobile-start-link" to="/onboarding">시작</Link>
        <Link className="open-nav-cta" to="/onboarding">대응 화면 열기 <ArrowRight size={14} /></Link>
      </header>
    </>
  );
}
