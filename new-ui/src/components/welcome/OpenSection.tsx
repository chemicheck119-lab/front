import { motion } from "framer-motion";
import "../../styles/welcome.css";

export default function OpenSection() {
  return (
    <section className="open-section">
      <div className="open-image" />

      <div className="open-title">
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          케미체크 119
        </motion.h1>

        <motion.p
          className="open-subtitle"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          화학재난대응지원서비스 : 119 상황실의 판단을 더 빠르게,
          현장을 더 안전하게
        </motion.p>
      </div>

      <motion.div
        className="open-description"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{
          once: true,
          amount: 0.5,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <p>
          화학사고 발생 시 흩어진 정보를 한곳에서 확인하고,
          <br />
          사고 물질 추정부터 초기 대응 검토까지 빠르게 지원합니다.
        </p>
      </motion.div>
    </section>
  );
}