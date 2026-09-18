import { motion } from "framer-motion";
import "../../styles/welcome.css";

export default function OpenSection() {
  return (
    <section className="open-section">
      <div className="open-image" />

      <div className="open-title">
        <p className="open-kicker">CHEMICAL INCIDENT RESPONSE SUPPORT</p>
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          화학사고 대응의 첫 판단을
          <br />
          더 빠르고 안전하게
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
          케미체크119가 흩어진 현장 정보를 연결하고
          <br />
          초기 대응을 위한 근거를 준비합니다.
        </motion.p>

        <a className="open-cta" href="#start">
          대응 시작하기
          <span aria-hidden="true">↓</span>
        </a>
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
          신고 접수부터 현장 대응까지,
          <br />
          필요한 정보를 한 흐름으로 확인합니다.
        </p>
      </motion.div>
    </section>
  );
}