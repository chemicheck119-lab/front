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
      "신고문과 현장 관찰을 입력하면 사고 맥락과 확인할 다음 행동을 정리합니다.\n\n주요 기능을 안내해드리겠습니다.",
    position: "center",
  },

  {
    target: ".integrated-composer-panel",
    title: "신고문과 현장 상황을 입력하세요",
    description:
      "신고문과 현장 관찰을 입력하면 사고 맥락과 다음 확인 행동을 정리합니다.",
    position: "right",
  },

  {
    target: ".integrated-search",
    title: "물질 후보를 검색하세요",
    description:
      "검색 결과는 후보입니다. 공식 근거와 현장 확인을 거치기 전에는 확정값으로 사용하지 않습니다.",
    position: "right",
  },

  {
    target: ".integrated-analysis-card",
    title: "분석과 현장 확인을 확인하세요",
    description:
      "후보·공식 근거·2-CAS 확인 상태를 한 화면에서 확인합니다.",
    position: "right",
  },

  {
    target: ".integrated-agent-card",
    title: "운영 에이전트의 다음 행동을 확인하세요",
    description:
      "에이전트는 완료·대기·잠금 상태와 다음 확인 행동만 표시합니다. 최종 판단은 현장 지휘관이 합니다.",
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