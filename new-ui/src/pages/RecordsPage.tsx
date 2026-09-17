import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/records.css";
import {
  fetchRecordDetail,
  fetchRecords,
  RecordApiError,
  type RecordDetail,
  type RecordSummary,
} from "../api/records";

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatRecordDetail(record: RecordDetail): string {
  const lines: string[] = [];
  lines.push(`시설명: ${record.facilityName}`);
  lines.push(`시설 주소: ${record.facilityAddress}`);
  lines.push("");
  lines.push(`확인된 사고 화학물질: ${record.incidentSubstanceName} (CAS ${record.incidentSubstanceCas})`);
  lines.push("");
  lines.push(`수행된 조치: ${record.performedActions.length > 0 ? record.performedActions.join(", ") : "없음"}`);
  lines.push(`추가 고려사항: ${record.additionalFactors.length > 0 ? record.additionalFactors.join(", ") : "없음"}`);
  lines.push("");
  lines.push(`브리핑 적용 상태: ${record.briefApplicationStatus}`);
  lines.push(`최종 대응 결과: ${record.finalResponseOutcome}`);

  if (record.conflictRisk) {
    const risk = record.conflictRisk;
    lines.push("");
    lines.push("물질 반응 위험:");
    lines.push(`${risk.facilitySubstanceName} (CAS ${risk.facilitySubstanceCas})와의 반응 위험도 ${risk.riskLevelKo}`);
    lines.push(risk.briefText);
    if (!risk.expertReviewed) lines.push("(전문 검수 전 정보입니다.)");
  }

  if (record.messages.length > 0) {
    lines.push("");
    lines.push("AI 현장 대응 질의 기록:");
    for (const message of [...record.messages].sort((a, b) => a.sequence - b.sequence)) {
      lines.push(`${message.role === "USER" ? "대원" : "AI"}: ${message.text}`);
    }
  }

  return lines.join("\n");
}

export default function RecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [listError, setListError] = useState("");

  const [selectedDetail, setSelectedDetail] = useState<RecordDetail | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchRecords()
      .then((result) => {
        if (cancelled) return;
        setRecords(result);
        setListState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setListError(error instanceof RecordApiError ? error.message : "기록을 불러오지 못했습니다.");
        setListState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openRecord = (recordId: string) => {
    setDetailState("loading");
    setDetailError("");
    fetchRecordDetail(recordId)
      .then((detail) => {
        setSelectedDetail(detail);
        setDetailState("ready");
      })
      .catch((error: unknown) => {
        setDetailError(error instanceof RecordApiError ? error.message : "상세 기록을 불러오지 못했습니다.");
        setDetailState("error");
      });
  };

  const closeDetail = () => {
    setSelectedDetail(null);
    setDetailState("idle");
    setDetailError("");
  };

  /* 상세 기록 화면 */
  if (detailState !== "idle") {
    return (
      <div className="records-page">
        <header className="records-header">
          <button type="button" className="records-back-button" onClick={closeDetail}>
            ← 대응 기록 목록
          </button>

          <h1>대응 기록</h1>
        </header>

        <main className="record-detail">
          {detailState === "loading" && <div className="record-content">불러오는 중입니다...</div>}

          {detailState === "error" && <div className="record-content">{detailError}</div>}

          {detailState === "ready" && selectedDetail && (
            <>
              <div className="record-detail-title">
                {formatSavedAt(selectedDetail.savedAt)} · {selectedDetail.facilityName}
              </div>
              <pre className="record-content">{formatRecordDetail(selectedDetail)}</pre>
            </>
          )}
        </main>
      </div>
    );
  }

  /* 기록 목록 화면 */
  return (
    <div className="records-page">
      <header className="records-header">
        <button type="button" className="records-back-button" onClick={() => navigate("/main")}>
          ← 메인화면
        </button>

        <h1>대응 기록</h1>
      </header>

      <main className="records-container">
        <div className="records-list-header">
          <h2>저장된 대응 기록</h2>
          <span>{listState === "ready" ? `${records.length}건` : ""}</span>
        </div>

        {listState === "loading" && <div className="record-content">불러오는 중입니다...</div>}

        {listState === "error" && <div className="record-content">{listError}</div>}

        {listState === "ready" && (
          <div className="records-list">
            {records.map((record) => (
              <button
                type="button"
                key={record.recordId}
                className="record-list-item"
                onClick={() => openRecord(record.recordId)}
              >
                <span>
                  {formatSavedAt(record.savedAt)} · {record.facilityName}
                </span>
                <span className="record-arrow">›</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
