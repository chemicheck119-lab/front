import { motion } from "framer-motion";
import "../../styles/welcome.css";

const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    number: "01",
    keyword: "INTAKE",
    title: "신고·현장 정보 통합",
    description: "신고 내용, 위치, 시설 맥락을 한 화면에서 시작합니다.",
    className: "feature-check",
  },
  {
    number: "02",
    keyword: "CLAWOPS",
    title: "음성·ClawOps 연계",
    description: "전화 전사와 음성 입력을 검토 가능한 초안으로 연결합니다.",
    className: "feature-search",
  },
  {
    number: "03",
    keyword: "AGENT",
    title: "현장대응 분석 에이전트",
    description: "신고 분석부터 후보 탐색·현장 확인·충돌 검토까지 단계를 보여줍니다.",
    className: "feature-record",
  },
  { number: "04", keyword: "EVIDENCE", title: "공식 근거 연결", description: "KOSHA·CAMEO와 확인된 자료를 판단 맥락에 연결합니다.", className: "feature-record" },
  { number: "05", keyword: "RECORD", title: "대응 기록 관리", description: "확인 과정과 판단을 남겨 다음 대응과 책임을 지킵니다.", className: "feature-human" },
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
        <p>ONE RESPONSE WORKSPACE</p>

        <h2 className="feature-title">
          <motion.span
            custom={0}
            variants={titleVariants}
          >
            기록하고,
          </motion.span>

          <motion.span
            custom={1}
            variants={titleVariants}
          >
            분석하고,
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