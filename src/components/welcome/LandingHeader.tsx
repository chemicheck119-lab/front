import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/welcome.css";

export default function LandingHeader() {
  return (
    <>
      <div className="product-page-signal"><span>CHEMICHECK 119 / PUBLIC SAFETY RESPONSE</span><strong>근거가 확인될 때까지 판단을 보류합니다.</strong><Link to="/trends">정부 동향 보기 <ArrowRight size={12} /></Link></div>
      <header className="product-page-header">
        <Link className="open-brand" to="/">케미체크<span>119</span><small>CHEMICAL RESPONSE OS</small></Link>
        <nav aria-label="케미체크119 제품 메뉴">
          <Link to="/features">기능 소개</Link>
          <Link to="/public-data">공공데이터</Link>
          <Link to="/trends">정부 동향</Link>
        </nav>
        <Link className="open-nav-cta" to="/onboarding">대응 화면 열기 <ArrowRight size={14} /></Link>
      </header>
    </>
  );
}
