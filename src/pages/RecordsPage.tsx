import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/records.css";

export default function RecordsPage() {
  const navigate = useNavigate();
  const [lastRecord, setLastRecord] = useState<{ recordId: string; incidentId: string; savedAt: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("chemicheck119:last-record");
      if (raw) setLastRecord(JSON.parse(raw) as { recordId: string; incidentId: string; savedAt: string });
    } catch {
      setLastRecord(null);
    }
  }, []);

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
          <span>{lastRecord ? "현재 세션 1건" : "0건"}</span>
        </div>

        {lastRecord ? (
          <article className="records-session-card">
            <p className="records-empty-title">현재 세션에서 저장한 대응 기록</p>
            <dl>
              <div><dt>사고 ID</dt><dd>{lastRecord.incidentId}</dd></div>
              <div><dt>기록 ID</dt><dd>{lastRecord.recordId}</dd></div>
              <div><dt>저장 시각</dt><dd>{new Date(lastRecord.savedAt).toLocaleString("ko-KR")}</dd></div>
            </dl>
            <p className="records-empty-note">전체 기록 목록 조회 API가 연결되면 기관 범위의 저장 기록을 이 화면에 표시합니다.</p>
          </article>
        ) : (
          <div className="records-empty-content">
            <p className="records-empty-title">저장된 대응 기록이 없습니다.</p>
            <p>대응을 완료하고 기록을 저장하면 이 화면에서 확인할 수 있습니다.</p>
            <p className="records-empty-note">현재 시설 상태나 inventory를 표시하는 화면이 아닙니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}