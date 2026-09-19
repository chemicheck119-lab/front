import "../../styles/welcome.css";

export default function FooterSection() {
  return (
    <footer className="welcome-footer">
      <div className="welcome-footer-inner">
        <div className="welcome-footer-brand">
          <strong>일분일초 팀</strong>
          <p>케미체크119</p>
        </div>

        <div className="welcome-footer-meta">
          <div>
            <span className="label">프로젝트 리드</span>
            <strong>최현준</strong>
          </div>
          <div>
            <span className="label">엔지니어</span>
            <strong>백승효</strong>
          </div>
          <div>
            <span className="label">디자인 / UX</span>
            <strong>이준희</strong>
          </div>
        </div>

        <details className="welcome-footer-policy">
          <summary>데이터·음성 처리 안내</summary>
          <p>
            음성은 전사 초안으로만 사용되며, 반드시 사용자가 확인·수정한 뒤 분석에
            전달됩니다. 원본 음성은 저장하지 않으며, 음성 모델은 물질 확정·CAS 확인·
            위험 판단을 수행하지 않습니다. 공개 시연에서는 개인정보 없는 합성 데이터를
            사용합니다.
          </p>
        </details>
      </div>
    </footer>
  );
}
