import { motion } from "framer-motion";
import { Check, CircleAlert, UserRound } from "lucide-react";
import "../../styles/welcome.css";

const principles = [
  ["확정은 사람이 합니다.", "시스템은 최종 결정을 대신하지 않습니다.", UserRound],
  ["불확실한 정보는 보류합니다.", "확인 전 정보는 명확히 구분해 표시합니다.", CircleAlert],
  ["검증된 근거를 연결합니다.", "판단을 뒷받침하는 자료와 기록을 함께 제공합니다.", Check],
] as const;

export default function TrustSection() {
  return (
    <section className="trust-section" id="trust">
      <div className="trust-heading">
        <p className="section-kicker">RESPONSIBLE SUPPORT</p>
        <h2>분석 에이전트는 진행을 보여주고,<br />최종 결정은 사람에게 남깁니다.</h2>
        <p>서버가 실제로 완료·대기·차단한 업무 단계와 다음 행동을 보여줍니다. 내부 추론을 과장하거나 판단을 자동 확정하지 않습니다.</p>
      </div>
      <div className="trust-list">
        {principles.map(([title, text, Icon]) => (
          <motion.article key={title} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} viewport={{ once: true }}>
            <Icon size={20} strokeWidth={1.8} />
            <div><h3>{title}</h3><p>{text}</p></div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}