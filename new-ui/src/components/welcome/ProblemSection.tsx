import { motion } from "framer-motion";
import "../../styles/welcome.css";

const problemItems = [
  {
    label: "WHO?",
    text: "신고를 접수하고 정보를 전달하는 소방 상황실",
  },
  {
    label: "WHEN?",
    text: "신고 접수 후 초기 대응부터 대응 진행 전반",
  },
  {
    label: "PROBLEM?",
    text: "필요한 정보가 여러 자료에 흩어져 있어 각각 찾아 확인",
  },
  {
    label: "WHAT WE NEED?",
    text: "필요한 정보를 빠르게 찾고 현장 대응까지 연결할 수 있도록",
  },
  {
    label: "MORE THAN SEARCH",
    text: "사고 발생 장소 주변 화학물질을 고려하여 대응을 지원",
  },
];

export default function ProblemSection() {
  return (
    <section className="problem-section">
      {/* Problem 카드 */}
      <motion.div
        className="problem-card"
        initial={{
          opacity: 0,
          y: 50,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.3,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* 글자 덩어리 위치 조정용 */}
        <div className="problem-content-position">
          {/* 육하원칙 모션 */}
          <motion.div
            className="problem-content"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 0.18,
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            {problemItems.map((item) => (
              <motion.div
                className="problem-row"
                key={item.label}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },

                  visible: {
                    opacity: 1,
                    y: 0,

                    transition: {
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  },
                }}
              >
                <strong className="problem-label">
                  {item.label}
                </strong>

                <span className="problem-text">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* 하단 메시지 */}
      <motion.h2
        className="problem-message"
        initial={{
          opacity: 0,
          x: -40,
        }}
        whileInView={{
          opacity: 1,
          x: 0,
        }}
        viewport={{
          once: true,
          amount: 0.6,
        }}
        transition={{
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        정보는 흩어져 있지만, 현장은 기다려주지 않습니다.
      </motion.h2>
    </section>
  );
}