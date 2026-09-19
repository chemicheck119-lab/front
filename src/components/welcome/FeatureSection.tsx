import { motion } from "framer-motion";
import "../../styles/welcome.css";

const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    number: "01",
    keyword: "CONTEXT",
    title: "사고 정보 통합",
    description: "신고 내용, 위치, 현장 맥락을 한 번에 정리합니다.",
    className: "feature-check",
  },
  {
    number: "02",
    keyword: "RISK",
    title: "위험 요소 검토",
    description: "인근 시설과 물질 정보를 함께 확인합니다.",
    className: "feature-search",
  },
  {
    number: "03",
    keyword: "EVIDENCE",
    title: "근거 기반 대응",
    description: "확인된 자료와 대응 흐름을 연결합니다.",
    className: "feature-record",
  },
  { number: "04", keyword: "RECORD", title: "대응 기록 자동화", description: "사고 대응 과정과 판단을 체계적으로 남깁니다.", className: "feature-record" },
  { number: "05", keyword: "HUMAN", title: "책임 있는 최종 결정", description: "AI는 보조하고, 최종 책임은 사람이 가집니다.", className: "feature-human" },
];

const titleVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },

  visible: (index: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.6,
      delay: index * 0.4,
      ease,
    },
  }),
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },

  visible: (index: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.6,
      delay: index * 0.4,
      ease,
    },
  }),
};

export default function FeatureSection() {
  return (
    <motion.section
      className="feature-section"
      id="features"

      initial="hidden"

      whileInView="visible"

      viewport={{
        once: true,
        amount: 0.65,
      }}
    >
      <div className="feature-heading">
        <p>FIELD-READY SUPPORT</p>

        <h2 className="feature-title">
          <motion.span
            custom={0}
            variants={titleVariants}
          >
            현장을 준비하고,
          </motion.span>

          <motion.span
            custom={1}
            variants={titleVariants}
          >
            근거를 확인하고,
          </motion.span>

          <motion.span
            custom={2}
            variants={titleVariants}
          >
            기록합니다.
          </motion.span>
        </h2>
      </div>

      <div className="feature-card-list">
        {features.map((feature, index) => (
          <motion.article
            key={feature.number}

            custom={index}

            variants={cardVariants}

            className={`feature-card ${feature.className}`}
          >
            <div className="feature-number">
              {feature.number} · {feature.keyword}
            </div>

            <h3>
              {feature.title}
            </h3>

            <div className="feature-divider" />

            <p>
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}