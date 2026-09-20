import { motion } from "framer-motion";
import { BookOpenCheck, CircleCheck, ClipboardCheck, FileAudio, FileText } from "lucide-react";
import "../../styles/welcome.css";

const features = [
  ["01", "신고·현장 정보 통합", "신고 내용과 위치, 시설 맥락", FileText],
  ["02", "음성·ClawOps 연계", "전화 전사 초안과 음성 입력", FileAudio],
  ["03", "현장 대응 브리프", "확인된 사실과 다음 행동", ClipboardCheck],
  ["04", "공식 근거 연결", "KOSHA·CAMEO와 확인 자료", BookOpenCheck],
  ["05", "대응 기록 관리", "확인 과정과 판단의 기록", FileText],
] as const;

export default function FeatureSection() {
  return (
    <motion.section
      className="feature-section"
      id="features"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
    >
      <div className="feature-heading">
        <p>ONE RESPONSE WORKSPACE / 02</p>
        <h2>신고 하나를<br />대응의 흐름으로 바꿉니다.</h2>
        <span>필요한 도구를 따로 찾지 않고, 하나의 사고 맥락 안에서 확인합니다.</span>
      </div>

      <div className="feature-showcase">
        <div className="feature-index" role="list" aria-label="케미체크119 기능 목록">
          {features.map(([number, title, detail, Icon]) => (
            <div className="feature-index-item" key={number} role="listitem">
              <span>{number}</span>
              <Icon size={16} />
              <div><strong>{title}</strong><small>{detail}</small></div>
            </div>
          ))}
        </div>

        <div className="feature-product-panel">
          <div className="product-panel-top"><span>INCIDENT / HX-2409</span><b>검토 필요</b></div>
          <h3>사고 대응 작업공간</h3>
          <p>신고 내용과 전사 초안을 확인한 뒤 다음 분석 단계를 선택합니다.</p>
          <div className="product-panel-message">
            <span><FileAudio size={15} /></span>
            <div><small>CLAWOPS / FINAL TRANSCRIPT DRAFT</small><strong>"흰 연기가 보이고 냄새가 납니다."</strong><em>소방대원 확인 후 분석에 사용</em></div>
          </div>
          <div className="product-panel-steps">
            <div><CircleCheck size={15} /> 신고 분석 <b>완료</b></div>
            <div><CircleCheck size={15} /> 공식 근거 탐색 <b>완료</b></div>
            <div className="pending"><ClipboardCheck size={15} /> 두 CAS 현장 확인 <b>대기</b></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
