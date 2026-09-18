import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/records.css";

type RecordItem = {
  id: number;
  title: string;
  content: string;
};

const sampleRecords: RecordItem[] = [
  {
    id: 1,
    title: "2026.09.16 21:08",
    content: `사고 유형: 화재
시설명: 울산 ○○화학
사고 위치: 울산광역시 ○○구 ○○로

신고 내용:
공장 내부에서 화재가 발생했으며 화학물질 누출 가능성이 확인되었습니다.

확인된 화학물질:
차아염소산나트륨

현장 관찰정보:
연기, 액체 누출

초기 대응 분석:
사고물질과 시설 취급물질 간 반응 가능성이 확인되었습니다.
현장 접근 전 보호장비를 착용하고 물질 간 접촉을 방지해야 합니다.

AI 현장 대응 질의 기록:
대원: 화재 진압 시 물을 사용해도 됩니까?
AI: 현재 확인된 사고정보와 화학물질 대응자료를 기준으로 직접적인 물질 접촉을 피하고 현장 상황을 추가로 확인해야 합니다.`,
  },
  {
    id: 2,
    title: "2026.09.16 18:42",
    content: `사고 유형: 누출
시설명: 울산 △△산업
사고 위치: 울산광역시 ○○구

신고 내용:
시설 내부에서 화학물질 누출 신고가 접수되었습니다.

확인된 화학물질:
염산

초기 대응 분석:
누출 지역 접근을 제한하고 적절한 보호장비를 착용해야 합니다.`,
  },
  {
    id: 3,
    title: "2026.09.15 14:21",
    content: `사고 유형: 화재
시설명: 울산 □□공장

신고 내용:
공장 설비에서 화재가 발생했습니다.

대응 기록:
현장 정보 확인 후 초기 대응 분석을 수행했습니다.`,
  },
];

export default function RecordsPage() {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] =
    useState<RecordItem | null>(null);

  /* 상세 기록 화면 */
  if (selectedRecord) {
    return (
      <div className="records-page">
        <header className="records-header">
          <button
            type="button"
            className="records-back-button"
            onClick={() => setSelectedRecord(null)}
          >
            ← 대응 기록 목록
          </button>

          <h1>대응 기록</h1>
        </header>

        <main className="record-detail">
          <div className="record-detail-title">
            {selectedRecord.title}
          </div>

          <pre className="record-content">
            {selectedRecord.content}
          </pre>
        </main>
      </div>
    );
  }

  /* 기록 목록 화면 */
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

      <main className="records-container">
        <div className="records-list-header">
          <h2>저장된 대응 기록</h2>
          <span>{sampleRecords.length}건</span>
        </div>

        <div className="records-list">
          {sampleRecords.map((record) => (
            <button
              type="button"
              key={record.id}
              className="record-list-item"
              onClick={() => setSelectedRecord(record)}
            >
              <span>{record.title}</span>
              <span className="record-arrow">›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}