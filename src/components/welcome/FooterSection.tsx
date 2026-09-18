import "../../styles/welcome.css";

export default function FooterSection() {
  return (
    <footer className="welcome-footer">
      <strong>케미체크119</strong>
      <p>화학재난대응지원서비스</p>
      <span>현장의 판단을 더 빠르고 안전하게</span>
      <details className="welcome-footer-policy">
        <summary>데이터·음성 처리 안내</summary>
        <p>
          음성은 전사 초안으로만 사용되며, 반드시 사용자가 확인·수정한 뒤 분석에
          전달됩니다. 원본 음성은 저장하지 않으며, 음성 모델은 물질 확정·CAS 확인·
          위험 판단을 수행하지 않습니다. 공개 시연에서는 개인정보 없는 합성 데이터를
          사용합니다.
        </p>
      </details>
    </footer>
  );
}
