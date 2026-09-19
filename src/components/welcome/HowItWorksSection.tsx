import { motion } from "framer-motion";
import "../../styles/welcome.css";

const insights = [
  ["01", "속도만큼 정확한 근거가 필요합니다."],
  ["02", "연결된 정보가 초기 판단의 위험을 줄입니다."],
  ["03", "기록은 다음 판단과 책임을 지키는 기반입니다."],
];

export default function HowItWorksSection() {
  return (
    <section className="workflow-section data-insight-section">
      <div className="workflow-heading">
        <p className="section-kicker">DATA &amp; INSIGHT</p>
        <h2>안전한 대응은 정보의 연결에서 시작됩니다.</h2>
        <p className="workflow-description">
          화학사고 대응은 속도만이 아니라 책임 있는 의사결정을 요구합니다. 근거가 연결된 대응은 위험을 줄이고, 기록은 이후 판단을 지키는 기반이 됩니다.
        </p>
      </div>

      <ol className="workflow-list">
        {insights.map(([number, title], index) => (
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
