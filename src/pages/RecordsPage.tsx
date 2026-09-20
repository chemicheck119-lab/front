import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { apiConfig } from "../api/config";
import type { RecordDetailResponse, RecordSummary } from "../api/contracts";
import { getIncidentRecord, listIncidentRecords } from "../api/records";
import {
  ADDITIONAL_FACTOR_OPTIONS,
  BRIEF_OPTIONS,
  FINAL_OUTCOME_OPTIONS,
  PERFORMED_ACTION_OPTIONS,
} from "../features/records/StructuredOutcomeForm";
import "../styles/records.css";

type LoadState = "idle" | "loading" | "ready" | "error";

function labelOf(options: Array<{ value: string; label: string }>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

function joinLabels(options: Array<{ value: string; label: string }>, values: string[]): string {
  return values.length > 0 ? values.map((value) => labelOf(options, value)).join(", ") : "없음";
}

export function formatRecordDetail(record: RecordDetailResponse): string {
  const lines: string[] = [];
  lines.push("※ 저장 당시의 대응 기록이며 현재 시설 재고·상태가 아닙니다.");
  lines.push("");
  lines.push(`시설명: ${record.facilityName ?? "-"}`);
  lines.push(`시설 주소: ${record.facilityAddress ?? "-"}`);
  lines.push("");
  if (record.incidentSubstanceCas) {
    lines.push(`확인된 사고 화학물질: ${record.incidentSubstanceName ?? "-"} (CAS ${record.incidentSubstanceCas})`);
  } else {
    lines.push(`사고 물질(CAS 미확인): ${record.incidentSubstanceName ?? "-"}`);
  }
  lines.push("");
  lines.push(`수행된 조치: ${joinLabels(PERFORMED_ACTION_OPTIONS, record.performedActions)}`);
  lines.push(`추가 고려사항: ${joinLabels(ADDITIONAL_FACTOR_OPTIONS, record.additionalFactors)}`);
  lines.push("");
  lines.push(`브리핑 적용 상태: ${labelOf(BRIEF_OPTIONS, record.briefApplicationStatus)}`);
  lines.push(`최종 대응 결과: ${labelOf(FINAL_OUTCOME_OPTIONS, record.finalResponseOutcome)}`);

  if (record.conflictRisk) {
    const risk = record.conflictRisk;
    lines.push("");
    lines.push("물질 반응 위험:");
    lines.push(`${risk.facilitySubstanceName ?? "시설 물질"} (CAS ${risk.facilitySubstanceCas})와의 반응 위험도 ${risk.riskLevelKo}`);
    lines.push(risk.briefText);
    lines.push("※ CAMEO 반응성 그룹 스크리닝의 서수(순서형) 결과입니다. 확률·백분율이나 AI 진단이 아니며 현장 대원의 확인이 필요합니다.");
    if (!risk.expertReviewed) lines.push("(전문 검수 전 정보입니다.)");
  }

  if (record.messages.length > 0) {
    lines.push("");
    lines.push("AI 현장 대응 질의 기록:");
    for (const message of [...record.messages].sort((a, b) => a.sequence - b.sequence)) {
      const speaker = message.role === "USER" ? "대원" : message.role === "ASSISTANT" ? "AI" : "시스템";
      lines.push(`${speaker}: ${message.text}`);
    }
  }

  return lines.join("\n");
}

export default function RecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [listState, setListState] = useState<LoadState>("loading");
  const [listError, setListError] = useState("");

  const [selectedDetail, setSelectedDetail] = useState<RecordDetailResponse | null>(null);
  const [detailState, setDetailState] = useState<LoadState>("idle");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listIncidentRecords(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRecords(result);
        setListState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setListError(errorMessage(error, "기록을 불러오지 못했습니다."));
        setListState("error");
      });
    return () => controller.abort();
  }, []);

  const detailRequest = useRef<AbortController | null>(null);
  useEffect(() => () => detailRequest.current?.abort(), []);

  const openRecord = (recordId: string) => {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelectedDetail(null);
    setDetailError("");
    setDetailState("loading");
    getIncidentRecord(recordId, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setSelectedDetail(detail);
        setDetailState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDetailError(errorMessage(error, "상세 기록을 불러오지 못했습니다."));
        setDetailState("error");
      });
  };

  const closeDetail = () => {
    detailRequest.current?.abort();
    detailRequest.current = null;
    setSelectedDetail(null);
    setDetailState("idle");
    setDetailError("");
  };

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
          {apiConfig.demoEnabled && <div className="record-content" role="note">데모 데이터입니다. 실제로 저장된 대응 기록이 아닙니다.</div>}
          {detailState === "loading" && <div className="record-content">불러오는 중입니다...</div>}
          {detailState === "error" && <div className="record-content">{detailError}</div>}
          {detailState === "ready" && selectedDetail && (
            <>
              <div className="record-detail-title">
                {formatSavedAt(selectedDetail.savedAt)} · {selectedDetail.facilityName ?? "시설 미상"}
              </div>
              <pre className="record-content">{formatRecordDetail(selectedDetail)}</pre>
            </>
          )}
        </main>
      </div>
    );
  }

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

        {apiConfig.demoEnabled && <div className="record-content" role="note">데모 데이터입니다. 실제로 저장된 대응 기록이 아닙니다.</div>}
        {listState === "loading" && <div className="record-content">불러오는 중입니다...</div>}
        {listState === "error" && <div className="record-content">{listError}</div>}

        {listState === "ready" && records.length === 0 && (
          <div className="records-empty-content">
            <p className="records-empty-title">저장된 대응 기록이 없습니다.</p>
            <p>대응을 완료하고 기록을 저장하면 이 화면에서 확인할 수 있습니다.</p>
          </div>
        )}

        {listState === "ready" && records.length > 0 && (
          <div className="records-list">
            {records.map((record) => (
              <button type="button" key={record.recordId} className="record-list-item" onClick={() => openRecord(record.recordId)}>
                <span>
                  {formatSavedAt(record.savedAt)} · {record.facilityName ?? "시설 미상"} · {labelOf(FINAL_OUTCOME_OPTIONS, record.finalResponseOutcome)}
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
