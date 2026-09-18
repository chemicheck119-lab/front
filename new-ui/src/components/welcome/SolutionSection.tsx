import { motion } from "framer-motion";
import "../../styles/welcome.css";

const solutionSteps = [
  {
    number: "01",
    title: "사고 정보를 모읍니다",
    text: "신고 내용과 현장 위치를 한곳에 정리해 초기 판단에 필요한 맥락을 만듭니다.",
  },
  {
    number: "02",
    title: "주변 위험을 확인합니다",
    text: "사고 지점 주변 시설과 화학물질 정보를 함께 확인해 놓치기 쉬운 위험을 살핍니다.",
  },
  {
    number: "03",
    title: "대응 근거를 남깁니다",
    text: "확인한 정보와 대응 과정을 기록해 다음 판단과 현장 대응에 활용합니다.",
  },
];

export default function SolutionSection() {
  return (
    <section className="solution-section">
      <div className="solution-intro">
        <motion.p
          className="section-kicker"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          HOW CHEMICHECK 119 HELPS
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          흩어진 정보를 연결해
          <br />
          다음 판단을 준비합니다.
        </motion.h2>
      </div>

      <div className="solution-step-list">
        {solutionSteps.map((step, index) => (
          <motion.article
            className="solution-step"
            key={step.number}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.12, duration: 0.55 }}
          >
            <span className="solution-step-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
