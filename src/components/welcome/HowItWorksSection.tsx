import { motion } from "framer-motion";
import "../../styles/welcome.css";

const workflow = [
  ["01", "사고 정보 입력"],
  ["02", "주변 물질과 시설 확인"],
  ["03", "대응 위험 검토"],
  ["04", "현장 대응 시작"],
  ["05", "대응 결과 기록"],
];

export default function HowItWorksSection() {
  return (
    <section className="workflow-section">
      <div className="workflow-heading">
        <p className="section-kicker">HOW IT WORKS</p>
        <h2>신고 접수부터 대응 기록까지</h2>
        <p className="workflow-description">
          필요한 정보를 순서대로 확인하고, 판단의 흐름을 끊지 않습니다.
        </p>
      </div>

      <ol className="workflow-list">
        {workflow.map(([number, title], index) => (
          <motion.li
            className="workflow-item"
            key={number}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: index * 0.1, duration: 0.45 }}
          >
            <span className="workflow-number">{number}</span>
            <span className="workflow-title">{title}</span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
