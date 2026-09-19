import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/welcome.css";

export default function LandingHeader() {
  return (
    <>
      <div className="trend-bar landing-header-signal"><span>CHEMICHECK 119 / CHEMICAL RESPONSE</span><strong>근거가 확인될 때까지 판단을 보류합니다.</strong><Link to="tel:070-5276-7681">서비스 문의 070-5276-7681 <ArrowRight size={12} /></Link></div>
      <header className="open-nav landing-header-nav">
        <Link className="open-brand" to="/">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></Link>
        <nav className="open-nav-links" aria-label="케미체크119 제품 메뉴">
          <Link to="/features">기능 소개</Link>
          <Link to="/public-data">공공데이터</Link>
          <Link to="/trends">정부 동향</Link>
        </nav>
        <Link className="mobile-start-link" to="/onboarding">시작</Link>
        <Link className="open-nav-cta" to="/onboarding">대응 화면 열기 <ArrowRight size={14} /></Link>
      </header>
    </>
  );
}
