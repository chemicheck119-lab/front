import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import { subscribeToPhoneTranscripts, type PhoneTranscriptEvent } from "../api/phone";
import { analyzeIncident } from "../api/incidents";
import type { IncidentAnalysisResponse } from "../api/contracts";
import "../styles/main.css";

const incidentTypes = ["화재", "누출", "폭발", "구조", "기타"];

const observationTypes = [
  "연기",
  "화염",
  "액체 누출",
  "냄새",
  "색상",
];

export default function MainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const region = location.state?.region || "지역";
  const station = location.state?.station || "소방서";
  const incidentId = location.state?.incidentId as string | undefined;

  /* =========================
     Onboarding
  ========================= */

  const [showOnboarding, setShowOnboarding] = useState(true);

  /* =========================
     Incident Form
  ========================= */

  const [selectedIncident, setSelectedIncident] = useState("");

  const [selectedObservations, setSelectedObservations] = useState<string[]>(
    [],
  );

  const [facility, setFacility] = useState("");
  const [accidentLocation, setAccidentLocation] = useState("");
  const [report, setReport] = useState("");
  const [chemical, setChemical] = useState("");
  const [phoneTranscript, setPhoneTranscript] = useState<PhoneTranscriptEvent | null>(null);
  const [phoneStreamError, setPhoneStreamError] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return undefined;
    let subscription: { close: () => void } | undefined;
    try {
      subscription = subscribeToPhoneTranscripts(
        incidentId,
        (event) => {
          setPhoneTranscript(event);
          setReport((current) => event.text.trim() || current);
          setPhoneStreamError(false);
        },
        () => setPhoneStreamError(true),
      );
    } catch {
      setPhoneStreamError(true);
    }
    return () => subscription?.close();
  }, [incidentId]);

  /* =========================
     Analysis
  ========================= */

  const handleObservation = (observation: string) => {
    setSelectedObservations((prev) =>
      prev.includes(observation)
        ? prev.filter((item) => item !== observation)
        : [...prev, observation],
    );
  };

  async function handleAnalyze() {
    if (!report.trim() || analysisBusy) return;
    setAnalysisBusy(true);
    setAnalysisError(null);
    try {
      const nextAnalysis = await analyzeIncident({
        incidentId: incidentId ?? null,
        inputType: phoneTranscript ? "VOICE_TRANSCRIPT" : "MANUAL_TEXT",
        text: [
          report.trim(),
          selectedIncident && `사고 유형: ${selectedIncident}`,
          facility && `시설명: ${facility}`,
          accidentLocation && `사고 위치: ${accidentLocation}`,
          chemical && `확인된 화학물질: ${chemical}`,
          selectedObservations.length > 0 && `현장 관찰: ${selectedObservations.join(", ")}`,
        ].filter(Boolean).join("\n"),
      });
      setAnalysis(nextAnalysis);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "분석을 시작하지 못했습니다.");
    } finally {
      setAnalysisBusy(false);
    }
  }

  return (
    <div className="main-page">
      {/* =========================
          Onboarding
      ========================= */}

      {showOnboarding && (
        <OnboardingTour
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* =========================
          Header
      ========================= */}

      <header className="main-header">
        <div className="main-header-left">
          <div className="main-logo">
            <img
              src="/images/logonavy.jpg"
              alt="케미체크119 화학재난대응지원시스템"
            />
          </div>

          <div className="header-divider" />

          <div className="station-badge">
            {region} {station}
          </div>

          <div className="header-divider" />

          <div className="header-date">
            2026.09.11
          </div>
        </div>

        <div className="main-header-right">
          <div className={`header-phone-status ${phoneStreamError ? "is-error" : phoneTranscript ? "is-received" : ""}`} aria-label="전화 연결 상태">
            <span className="header-phone-indicator" aria-hidden="true" />
            <div>
              <strong>전화연결 070-5276-7681</strong>
            </div>
            <em>{!incidentId ? "사고 접수 대기" : phoneStreamError ? "연결 확인 필요" : phoneTranscript ? "전사 수신" : "수신 대기"}</em>
          </div>

          <div className="record-actions">
            <button className="save-button" type="button">
                <svg
                    className="save-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M5 3H17L21 7V21H3V3H5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 3V9H17V3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 21V14H17V21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                </svg>

                기록 저장
            </button>

            <button
                type="button"
                className="records-link-button"
                onClick={() => navigate("/records")}
            >
                대응 기록 조회
            </button>
            </div>
        </div>
      </header>

      {/* =========================
          Main
      ========================= */}

      <main className="main-workspace">
        {/* =========================
            01 현재 사고정보
        ========================= */}

        <section className="main-panel incident-panel">
          <div className="panel-title">
            <h2>현재 사고정보</h2>
          </div>

          <div className="incident-form">
            {/* 사고 유형 */}

            <div className="form-group">
              <label>사고 유형</label>

              <div className="incident-type-list">
                {incidentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`incident-type-button ${
                      selectedIncident === type
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedIncident(type)
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 시설명 */}

            <div className="form-group">
              <label htmlFor="facility">
                시설명
              </label>

              <input
                id="facility"
                type="text"
                value={facility}
                onChange={(e) =>
                  setFacility(e.target.value)
                }
                placeholder="시설명 또는 주소 검색"
              />
            </div>

            {/* 사고 위치 */}

            <div className="form-group">
              <label htmlFor="accident-location">
                사고 위치
              </label>

              <input
                id="accident-location"
                type="text"
                value={accidentLocation}
                onChange={(e) =>
                  setAccidentLocation(e.target.value)
                }
                placeholder="도로명 주소 또는 좌표"
              />
            </div>

            {/* 신고 내용 */}

            <div className="form-group">
              <label htmlFor="report">
                신고 내용
              </label>

              <textarea
                id="report"
                value={report}
                onChange={(e) =>
                  setReport(e.target.value)
                }
                placeholder="신고 접수 내용을 입력하세요."
              />
            </div>

            {/* 화학물질 */}

            <div className="form-group chemical-guide-target">
              <label htmlFor="chemical">
                확인된 화학물질
              </label>

              <div className="chemical-input-row">
                <input
                  id="chemical"
                  type="text"
                  value={chemical}
                  onChange={(e) =>
                    setChemical(e.target.value)
                  }
                  placeholder="물질명 또는 CAS 번호"
                />

                <button
                  type="button"
                  className="chemical-add-button"
                >
                  <span>＋</span>
                  추가
                </button>
              </div>
            </div>

            {/* 현장 관찰 */}

            <div className="form-group">
              <label>
                현장 관찰정보
              </label>

              <div className="observation-list">
                {observationTypes.map(
                  (observation) => (
                    <button
                      key={observation}
                      type="button"
                      className={`observation-button ${
                        selectedObservations.includes(
                          observation,
                        )
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleObservation(
                          observation,
                        )
                      }
                    >
                      {observation}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="phone-transcript-status" aria-live="polite">
              <label>전화 전사</label>
              {!incidentId && <p>사고 접수 후 전화 전사를 연결할 수 있습니다.</p>}
              {incidentId && phoneStreamError && <p>전화 전사 연결을 확인할 수 없습니다.</p>}
              {incidentId && !phoneStreamError && !phoneTranscript && <p>전화 전사 수신 대기 중입니다.</p>}
              {phoneTranscript && (
                <p>
                  <strong>{phoneTranscript.isFinal ? "최종 전사 · 검토 필요" : "실시간 초안"}</strong>
                  <br />
                  {phoneTranscript.text}
                </p>
              )}
            </div>

              <button type="button" className="analyze-button" onClick={() => void handleAnalyze()} disabled={!report.trim() || analysisBusy}>
                {analysisBusy ? "분석 중..." : "초기 대응 분석 시작"}
              </button>
              {analysisError && <p className="analysis-form-error" role="alert">{analysisError}</p>}
          </div>
        </section>

        {/* =========================
            02 초기 대응 분석
        ========================= */}

        <section className="main-panel analysis-panel">
          <div className="panel-title">
            <h2>초기 대응 분석</h2>
          </div>

          {analysis ? (
            <div className="analysis-result" aria-live="polite">
              <p className="analysis-state">{analysis.state}</p>
              <h3>{analysis.requiredNextSteps[0] ?? "현장 확인과 공식 근거를 검토하세요."}</h3>
              <p>{analysis.safetyNotice}</p>
              <ul>{analysis.requiredNextSteps.map((step) => <li key={step}>{step}</li>)}</ul>
            </div>
          ) : (
            <div className="analysis-empty">
              <div className="analysis-info-icon">i</div>
              <p>신고 내용을 확인한 뒤<br />초기 대응 분석을 시작하세요.</p>
            </div>
          )}
        </section>

        {/* =========================
            03 AI 현장 대응 지원
        ========================= */}

        <section className="main-panel ai-panel">
          <div className="ai-header">
            <h2>
              AI 현장 대응 지원
            </h2>

            <p>
              현재 사고정보와 화학물질 대응자료를 기반으로
              답변합니다.
            </p>
          </div>

          {/* =========================
              Chat
          ========================= */}

          {analysis?.agent ? (
            <div className="ai-agent-result" aria-live="polite">
              <p>{analysis.agent.currentObjective}</p>
              <ol>{analysis.agent.nextActions.map((action) => <li key={action}>{action}</li>)}</ol>
              <small>최종 판단: {analysis.agent.finalDecisionAuthority}</small>
            </div>
          ) : (
            <div className="ai-empty ai-disabled-state">
              <div className="search-icon" />
              <p>초기 대응 분석 후<br />현장 대응 지원이 준비됩니다.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}