import { useNavigate } from "react-router-dom";
import "../styles/records.css";

export default function RecordsPage() {
  const navigate = useNavigate();

  return (
    <div className="records-page">
      <header className="records-header">
        <button
          type="button"
          className="records-back-button"
          onClick={() => navigate("/main")}
        >
          ← 메인화면
        </button>

        <h1>대응 기록</h1>
      </header>

      <main className="records-container records-empty-state">
        <div className="records-list-header">
          <h2>저장된 대응 기록</h2>
          <span>0건</span>
        </div>

        <div className="records-empty-content">
          <p className="records-empty-title">저장된 대응 기록이 없습니다.</p>
          <p>대응을 완료하고 기록을 저장하면 이 화면에서 확인할 수 있습니다.</p>
          <p className="records-empty-note">현재 시설 상태나 inventory를 표시하는 화면이 아닙니다.</p>
        </div>
      </main>
    </div>
  );
}