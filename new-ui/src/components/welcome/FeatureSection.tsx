import { motion } from "framer-motion";
import "../../styles/welcome.css";

const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    number: "01",
    keyword: "CHECK",
    title: "대응 충돌 검토",
    description: (
      <>
        시설 내 화학물질까지 고려해
        <br />
        대응 과정의 2차 위험을 확인합니다.
      </>
    ),
    className: "feature-check",
  },
  {
    number: "02",
    keyword: "SEARCH",
    title: "빠른 정보 검색",
    description: (
      <>
        흩어진 화학 정보를 모아 필요한
        <br />
        정보를 빠르게 찾습니다.
      </>
    ),
    className: "feature-search",
  },
  {
    number: "03",
    keyword: "RECORD",
    title: "소방 데이터 관리",
    description: (
      <>
        사고와 대응 과정의 기록을 소방 자체
        <br />
        화학 재난 데이터로 축적합니다.
      </>
    ),
    className: "feature-record",
  },
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

      initial="hidden"

      whileInView="visible"

      viewport={{
        once: true,
        amount: 0.65,
      }}
    >
      <div className="feature-heading">
        <p>케미체크119는</p>

        <h2 className="feature-title">
          <motion.span
            custom={0}
            variants={titleVariants}
          >
            확인하고,
          </motion.span>

          <motion.span
            custom={1}
            variants={titleVariants}
          >
            찾고,
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