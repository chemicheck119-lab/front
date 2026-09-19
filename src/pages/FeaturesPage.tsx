import { ArrowRight, Bot, BookOpenCheck, Check, FileAudio, FileText, MapPin, ShieldCheck } from "lucide-react";
import LandingHeader from "../components/welcome/LandingHeader";
import ProofStrip from "../components/welcome/ProofStrip";
import "../styles/welcome.css";

const featureSections = [
  { id: "intake", number: "01", label: "THE PROBLEM", title: "신고문이 비정형적이면 대응은 늦어집니다.", text: "신고 내용, 사고 위치, 시설 정보와 현장 관찰이 섞여 있어 필요한 확인 항목이 빠르게 정리되지 않습니다. 초기 판단의 지연은 이후 대응 속도와 품질을 모두 떨어뜨립니다.", icon: FileText },
  { id: "voice", number: "02", label: "VOICE / CLAWOPS", title: "전화와 현장 음성을 검토 가능한 초안으로 정리합니다.", text: "ClawOps 전사와 음성 기록을 연결해, 사용자가 읽고 수정할 수 있는 구조화된 초안을 만듭니다. 초안은 자동 확정하지 않고 보완 검토를 거쳐 분석에 사용합니다.", icon: FileAudio },
  { id: "agent", number: "03", label: "OPERATIONS AGENT", title: "다음 행동이 보이도록 운영 흐름을 연결합니다.", text: "신고 유형, 물질 후보, 시설 이력, 현장 확인, 공식 근거까지 각 단계의 상태를 투명하게 보여주고, 다음으로 무엇을 확인해야 하는지 안내합니다.", icon: Bot },
  { id: "evidence", number: "04", label: "OFFICIAL EVIDENCE", title: "후보가 아니라 확인된 근거를 기준으로 판단합니다.", text: "KOSHA·CAMEO와 공식 출처를 연결해 판단의 근거를 남기고, 두 CAS가 확인되기 전에는 충돌 등급과 권고를 표시하지 않습니다.", icon: BookOpenCheck },
  { id: "records", number: "05", label: "RESPONSE RECORD", title: "대응 기록이 다음 판단의 근거가 됩니다.", text: "확인된 정보와 판단 과정을 기록으로 남겨 현장 대응을 이어가고, 책임의 근거를 체계적으로 보존합니다.", icon: ShieldCheck },
];

function FeatureVisual({ id }: { id: string }) {
  if (id === "intake") return <div className="feature-ui intake-ui"><div className="feature-ui-bar">신고 분석 <span>대기</span></div><div className="feature-ui-meta"><span>사고 HX-2409</span><span>경기 화성 산업단지</span></div><strong>신고 내용을 입력하세요</strong><div className="feature-ui-lines"><i>흰 연기가 보이고 냄새가 납니다.</i><i>사고물질 · 후보 검색 필요</i><i>시설물질 · 현장 확인 필요</i></div><button type="button">사고 분석 실행</button></div>;
  if (id === "voice") return <div className="feature-ui voice-ui"><div className="feature-ui-bar">상황실 연결 <span>검토 필요</span></div><div className="feature-ui-meta"><span>전화 전사 초안</span><span>통화 ID CL-2409</span></div><div className="voice-wave">••• ━━━ ••• ━━━ •••</div><strong>“흰 연기가 보이고 냄새가 납니다.”</strong><small>최종 전사 초안 · 소방대원이 확인·수정한 뒤 분석에 사용</small><div className="feature-ui-actions"><button type="button">듣고 수정</button><button type="button">분석에 사용</button></div></div>;
  if (id === "agent") return <div className="feature-ui agent-ui"><div className="feature-ui-bar">운영 에이전트 <span>진행 중</span></div><ol><li className="done"><b>✓</b> 신고 분석 <em>완료</em></li><li className="done"><b>✓</b> 시설 과거 이력 조회 <em>완료</em></li><li className="active"><b>!</b> 후보·공식 근거 탐색 <em>진행 중</em></li><li><b>○</b> 현장 확인 게이트 점검 <em>대기</em></li><li><b>○</b> RuleEngine 실행 조건 검사 <em>잠김</em></li></ol></div>;
  if (id === "evidence") return <div className="feature-ui evidence-ui"><div className="feature-ui-bar">공식 화학자료 <span>후보 2건</span></div><div className="evidence-row"><BookOpenCheck size={16} /><div><strong>사고물질 후보</strong><small>CAS 7681-52-9 · KOSHA 원문 연결</small></div><b className="muted">확인 필요</b></div><div className="evidence-row"><ShieldCheck size={16} /><div><strong>시설물질 후보</strong><small>CAS 7647-01-0 · 현장 라벨 확인 필요</small></div><b className="muted">확인 필요</b></div><p className="feature-ui-warning">두 CAS 확인 전에는 충돌 등급을 표시하지 않습니다.</p></div>;
  return <div className="feature-ui records-ui"><div className="feature-ui-bar">현재 사고 기록 <span>저장됨</span></div><div className="feature-ui-meta"><span>사고 HX-2409</span><span>세션 기록 3건</span></div><strong>대응 기록을 이어갑니다</strong><div className="record-grid"><span>신고</span><b>접수 완료</b><span>확인</span><b>필수 CAS 0/2</b><span>판단</span><b>사람이 확정</b></div><button type="button">기록 상세 보기</button></div>;
}

function ArchitectureStrip() {
  return (
    <section className="feature-architecture" aria-label="분석 처리 구조">
      <div className="feature-architecture-copy">
        <p className="product-kicker">HOW IT HOLDS TOGETHER</p>
        <h2>정보는 정리하고,<br />판단은 사람에게 맡깁니다.</h2>
        <p>브라우저가 모델을 직접 호출하지 않습니다. FE는 BFF 계약을 통해 분석 서버와 공식 규칙을 연결하고, 확인되지 않은 정보는 다음 단계로 넘기지 않습니다. 이 구조는 속도와 안전성을 함께 확보합니다.</p>
      </div>
      <div className="feature-architecture-flow">
        <div><strong>FE</strong><span>입력·검토</span></div><b>→</b><div><strong>BFF</strong><span>계약·권한</span></div><b>→</b><div><strong>AI</strong><span>후보·요약</span></div><b>→</b><div><strong>CAMEO</strong><span>확인된 규칙</span></div>
        <small>두 CAS 확인 전에는 마지막 규칙 단계로 넘어가지 않습니다.</small>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <main className="product-page landing-v2">
      <LandingHeader />
      <section className="product-hero">
        <div><p className="product-kicker">FEATURES / RESPONSE WORKSPACE</p><h1>신고문을 구조화하고,<br />다음 행동까지 연결합니다.</h1><p>신고를 접수하는 순간, 필요한 확인 항목과 다음 행동을 정리해 현장 대응자가 빠르게 판단할 수 있도록 돕습니다. AI는 후보를 제시하고, 사람은 최종 확인을 결정합니다.</p></div>
        <div className="product-hero-board"><div className="board-top"><span><i /> LIVE MVP</span><b>INCIDENT / HX-2409</b></div><div className="board-location"><MapPin size={15} /> 경기 화성 산업단지 인근</div><div className="board-flow"><div className="done"><Check size={14} /> 신고 접수</div><div className="done"><Check size={14} /> 음성 전사 검토</div><div className="active"><Bot size={14} /> 분석 에이전트 진행</div><div><ShieldCheck size={14} /> 두 CAS 확인 대기</div></div><p className="board-note">최종 확인 전 정보는 보류 상태로 표시됩니다.</p></div>
      </section>
      <ProofStrip items={[
        { value: "7", label: "BFF 핵심 operation", detail: "사고 분석·물질·근거·확인·기록 계약" },
        { value: "2-CAS", label: "확인 게이트", detail: "두 물질 확인 전 충돌 규칙 미실행" },
        { value: "141", label: "자동화 테스트", detail: "34개 테스트 파일로 안전 경계 검증" },
        { value: "0/2→2/2", label: "확인 흐름", detail: "확인 전 보류에서 규칙 실행까지" },
      ]} />
      <ArchitectureStrip />
      <section className="feature-detail-list" aria-label="케미체크119 기능 소개">
        {featureSections.map(({ id, number, label, title, text, icon: Icon }, index) => (
          <article className={`feature-detail feature-detail-${index % 2 === 0 ? "image-right" : "image-left"}`} id={id} key={id}>
            <div className="feature-detail-index"><Icon size={20} /><span>{number}</span></div>
            <div className="feature-detail-copy"><p className="product-kicker">{label}</p><h2>{title}</h2><p>{text}</p><span className="feature-detail-count">{String(index + 1).padStart(2, "0")} / {String(featureSections.length).padStart(2, "0")}</span></div>
            <div className="feature-detail-visual"><FeatureVisual id={id} /></div>
          </article>
        ))}
      </section>
      <section className="product-cta"><p className="product-kicker">READY FOR THE FIELD</p><h2>현장 대응 화면에서 직접 시작해보세요.</h2><a className="open-cta" href="/onboarding">대응 화면 열기 <ArrowRight size={15} /></a></section>
    </main>
  );
}
