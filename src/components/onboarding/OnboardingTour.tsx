import { useEffect, useState } from "react";
import "../../styles/onboarding.css";

type OnboardingTourProps = {
  onComplete: () => void;
};

type Step = {
  target?: string;
  title: string;
  description?: string;
  position?: "center" | "right" | "left" | "bottom" | "top";
};

const steps: Step[] = [
  {
    title: "사용 안내",
    description:
      "사고 정보를 입력 후 현장에서 전달되는 질문을 검색하면, 현재 사고상황을 고려한 대응 정보를 빠르게 확인할 수 있습니다.\n\n주요 기능을 안내해드리겠습니다.",
    position: "center",
  },

  {
    target: ".incident-panel",
    title: "사고정보를 입력하세요",
    description:
      "신고를 통해 확인된 사고 정보를 입력하세요. 입력한 정보는 초기 대응 분석과 AI 답변에 활용됩니다.",
    position: "right",
  },

  {
    target: ".chemical-guide-target",
    title: "확인된 화학물질을 체크하세요",
    description:
      "신고 단계에서 확실히 확인된 물질이 있을 경우 화학물질을 추가해주세요. 확인되지 않았다면 현장 정보를 추가하세요. 사고물질이 특정되지 않아도 분석을 시작할 수 있습니다.",
    position: "right",
  },

  {
    target: ".analysis-panel",
    title: "위험을 확인하세요",
    description:
      "사고 특성과 사고 물질, 시설 취급 물질을 바탕으로 초기 대응 주의사항을 확인합니다.",
    position: "right",
  },

  {
    target: ".ai-panel",
    title: "현장의 질문을 바로 검색하세요",
    description:
      "현장에서 추가로 확인된 물질이나 대응 관련 무전이 전달되면 이곳에 입력해 빠르게 정보를 얻고 답변하세요. 사고 정보를 고려하여 대응 방법을 제공합니다.",
    position: "left",
  },

  {
    target: ".save-button",
    title: "대응 과정을 기록하세요",
    description:
      "사고 정보, 분석 정보, 질의 기록을 저장하여 사고 대응 검토와 보고서 작성에 활용할 수 있도록 합니다.",
    position: "left",
  },

  {
    title: "준비되었습니다.",
    description: "화학사고 대응을 시작해보세요.",
    position: "center",
  },
];

export default function OnboardingTour({
  onComplete,
}: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const step = steps[stepIndex];

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const [targetRect, setTargetRect] =
    useState<DOMRect | null>(null);

  useEffect(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      const element = document.querySelector(step.target!);

      if (!element) {
        setTargetRect(null);
        return;
      }

      setTargetRect(element.getBoundingClientRect());
    };

    updateTarget();

    window.addEventListener("resize", updateTarget);

    return () => {
      window.removeEventListener("resize", updateTarget);
    };
  }, [step]);

  useEffect(() => {
    if (!isLast) return;

    const timer = window.setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isLast, onComplete]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === "center") {
      return {};
    }

    const tooltipWidth = 330;
    const gap = 18;

    if (step.position === "right") {
      return {
        top: Math.max(
          20,
          targetRect.top + targetRect.height / 2 - 100,
        ),
        left: Math.min(
          window.innerWidth - tooltipWidth - 20,
          targetRect.right + gap,
        ),
      };
    }

    if (step.position === "left") {
      return {
        top: Math.max(
          20,
          targetRect.top + targetRect.height / 2 - 100,
        ),
        left: Math.max(
          20,
          targetRect.left - tooltipWidth - gap,
        ),
      };
    }

    if (step.position === "bottom") {
      return {
        top: targetRect.bottom + gap,
        left: Math.max(
          20,
          targetRect.left +
            targetRect.width / 2 -
            tooltipWidth / 2,
        ),
      };
    }

    if (step.position === "top") {
      return {
        top: Math.max(
          20,
          targetRect.top - 220,
        ),
        left: Math.max(
          20,
          targetRect.left +
            targetRect.width / 2 -
            tooltipWidth / 2,
        ),
      };
    }

    return {};
  };

  return (
    <div
      className={`onboarding-layer ${
        isLast ? "onboarding-finishing" : ""
      }`}
    >
      {/* 전체 화면 어둡게 */}
      <div className="onboarding-dim" />

      {/* 현재 설명 중인 영역 */}
      {targetRect && !isLast && (
        <div
          className="onboarding-highlight"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* 설명 카드 */}
      {!isLast && (
        <div
          className={`onboarding-tooltip ${
            !targetRect || step.position === "center"
              ? "onboarding-tooltip-center"
              : ""
          }`}
          style={getTooltipStyle()}
        >
          {isFirst && (
            <div className="onboarding-logo">
              <img
                src="/images/logowhite.jpg"
              />
            </div>
          )}

          <h3>{step.title}</h3>

          {step.description && (
            <p>
              {step.description
                .split("\n")
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    {index <
                      step.description!.split("\n").length -
                        1 && <br />}
                  </span>
                ))}
            </p>
          )}

          {isFirst ? (
            <div className="onboarding-first-buttons">
              <button
                type="button"
                className="onboarding-skip-button"
                onClick={handleSkip}
              >
                건너뛰기
              </button>

              <button
                type="button"
                className="onboarding-next-button"
                onClick={handleNext}
              >
                사용법 보기
              </button>
            </div>
          ) : (
            <div className="onboarding-bottom">
              <span className="onboarding-step-count">
                {stepIndex} / {steps.length - 2}
              </span>

              <button
                type="button"
                className="onboarding-next-button"
                onClick={handleNext}
              >
                {stepIndex === steps.length - 2
                  ? "완료"
                  : "다음"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 마지막 단계 */}
      {isLast && (
        <div className="onboarding-complete-card">
          <div className="complete-check">
            ✓
          </div>

          <h2>{step.title}</h2>

          <p>{step.description}</p>
        </div>
      )}
    </div>
  );
}