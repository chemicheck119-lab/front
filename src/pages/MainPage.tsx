import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import "../styles/main.css";

const incidentTypes = ["화재", "누출", "폭발", "구조", "기타"];

const observationTypes = [
  "연기",
  "화염",
  "액체 누출",
  "냄새",
  "색상",
];

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function MainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const region = location.state?.region || "지역";
  const station = location.state?.station || "소방서";

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

  /* =========================
     Analysis
  ========================= */

  const [showAnalysis, setShowAnalysis] = useState(false);

  /* =========================
     Chat
  ========================= */

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleObservation = (observation: string) => {
    setSelectedObservations((prev) =>
      prev.includes(observation)
        ? prev.filter((item) => item !== observation)
        : [...prev, observation],
    );
  };

  const handleAnalyze = () => {
    /*
      TODO API 연결 시
      이 부분에서 사고 분석 API 호출
    */

    setShowAnalysis(true);
  };

  const handleSendQuestion = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedQuestion,
    };

    /*
      TODO API 연결 시
      아래 mockAssistantMessage 대신
      API response를 messages에 추가
    */

    const mockAssistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content:
        "현재 사고정보와 확인된 화학물질을 기준으로 대응 정보를 확인했습니다. 현장 접근 전 보호장비를 착용하고, 물질의 누출 및 반응 가능성을 우선 확인하세요.",
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      mockAssistantMessage,
    ]);

    setQuestion("");
  };

  const handleQuestionKeyDown = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  if (event.nativeEvent.isComposing) return;

  if (event.key === "Enter") {
    event.preventDefault();
    handleSendQuestion();
  }
};

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

            <button
              type="button"
              className="analyze-button"
              onClick={handleAnalyze}
            >
              사고정보 저장 및 분석
            </button>
          </div>
        </section>

        {/* =========================
            02 초기 대응 분석
        ========================= */}

        <section className="main-panel analysis-panel">
          <div className="panel-title">
            <h2>초기 대응 분석</h2>
          </div>

          {!showAnalysis ? (
            /* 분석 전 */

            <div className="analysis-empty">
              <div className="analysis-info-icon">
                i
              </div>

              <p>
                사고정보 저장 및 분석 후
                <br />
                결과가 표시됩니다.
              </p>
            </div>
          ) : (
            /* =========================
               분석 후 MOCK UI
            ========================= */

            <div className="analysis-result">
              {/* 사고 요약 */}

              <div className="analysis-summary">
                <span className="analysis-status-dot" />

                <div>
                  <strong>초기 대응 분석 완료</strong>

                  <p>
                    입력된 사고정보를 기반으로
                    초기 대응 정보를 확인했습니다.
                  </p>
                </div>
              </div>

              {/* 우선 확인 물질 */}

              <div className="analysis-result-section">
                <div className="analysis-result-title">
                  <span className="result-number">
                    01
                  </span>

                  <h3>우선 확인 물질</h3>
                </div>

                <div className="substance-card">
                  <div className="substance-top">
                    <strong>
                      차아염소산나트륨
                    </strong>

                    <span className="confidence-badge">
                      확인 필요
                    </span>
                  </div>

                  <p>
                    신고 내용 및 현장 관찰정보를
                    기반으로 우선 확인이 필요한
                    물질입니다.
                  </p>
                </div>
              </div>

              {/* 주의 대응 */}

              <div className="analysis-result-section">
                <div className="analysis-result-title">
                  <span className="result-number">
                    02
                  </span>

                  <h3>
                    주의가 필요한 대응
                  </h3>
                </div>

                <div className="warning-card">
                  <div className="warning-card-title">
                    <span className="warning-icon">
                      !
                    </span>

                    <strong>
                      물질 간 반응 위험 확인
                    </strong>
                  </div>

                  <p>
                    사고 물질과 시설 취급 물질의
                    접촉 가능성을 확인하고,
                    반응성이 확인되기 전까지
                    직접적인 혼합을 피하세요.
                  </p>
                </div>
              </div>

              {/* 권고 초기 대응 */}

              <div className="analysis-result-section">
                <div className="analysis-result-title">
                  <span className="result-number">
                    03
                  </span>

                  <h3>
                    권고 초기 대응
                  </h3>
                </div>

                <ul className="response-list">
                  <li>
                    현장 접근 전 적절한
                    보호장비를 착용하세요.
                  </li>

                  <li>
                    누출 범위와 주변 화학물질을
                    우선 확인하세요.
                  </li>

                  <li>
                    물질이 확정되지 않은 경우
                    추가 현장정보를 확인하세요.
                  </li>
                </ul>
              </div>

              {/* 근거 */}

              <div className="analysis-source">
                <span>
                  근거
                </span>

                <p>
                  KOSHA · CAMEO 기반 대응자료
                </p>
              </div>
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

          <div className="chat-area">
            {messages.length === 0 ? (
              /* 채팅 전 */

              <div className="ai-empty">
                <div className="search-icon" />

                <p>
                  화학물질 정보나 대응 방법을
                  질문하세요.
                </p>
              </div>
            ) : (
              /* 채팅 후 */

              <div className="chat-message-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message-row ${
                      message.role === "user"
                        ? "user"
                        : "assistant"
                    }`}
                  >
                    <div
                      className={`chat-bubble ${
                        message.role === "user"
                          ? "user-bubble"
                          : "assistant-bubble"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 입력창 */}

          <div className="ai-bottom">
            <div className="ai-input-row">
              <input
                type="text"
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                onKeyDown={handleQuestionKeyDown}
                placeholder="화학 질문을 입력하세요"
              />

              <button
                type="button"
                className="send-button"
                aria-label="질문 전송"
                onClick={handleSendQuestion}
              >
                <span className="send-arrow">
                  ➤
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}