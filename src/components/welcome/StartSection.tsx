import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/welcome.css";

export const stationData: Record<string, string[]> = {
  서울특별시: [
    "강남소방서",
    "강동소방서",
    "강북소방서",
    "강서소방서",
    "관악소방서",
    "광진소방서",
    "구로소방서",
    "노원소방서",
    "도봉소방서",
    "동대문소방서",
    "동작소방서",
    "마포소방서",
    "서대문소방서",
    "서초소방서",
    "성동소방서",
    "성북소방서",
    "송파소방서",
    "양천소방서",
    "영등포소방서",
    "용산소방서",
    "은평소방서",
    "종로소방서",
    "중부소방서",
    "중랑소방서",
  ],

  부산광역시: [
    "강서소방서",
    "금정소방서",
    "기장소방서",
    "남부소방서",
    "동래소방서",
    "부산진소방서",
    "북부소방서",
    "사상소방서",
    "사하소방서",
    "서부소방서",
    "수영소방서",
    "중부소방서",
    "해운대소방서",
  ],

  대구광역시: [
    "강북소방서",
    "달서소방서",
    "달성소방서",
    "동부소방서",
    "북부소방서",
    "서부소방서",
    "수성소방서",
    "중부소방서",
  ],

  인천광역시: [
    "강화소방서",
    "계양소방서",
    "공단소방서",
    "남동소방서",
    "미추홀소방서",
    "부평소방서",
    "서부소방서",
    "송도소방서",
    "영종소방서",
    "중부소방서",
  ],

  광주광역시: [
    "광산소방서",
    "남부소방서",
    "동부소방서",
    "북부소방서",
    "서부소방서",
  ],

  대전광역시: [
    "대덕소방서",
    "동부소방서",
    "둔산소방서",
    "서부소방서",
    "유성소방서",
  ],

  울산광역시: [
    "남부소방서",
    "동부소방서",
    "북부소방서",
    "서울주소방서",
    "온산소방서",
    "중부소방서",
  ],

  세종특별자치시: [
    "세종남부소방서",
    "세종북부소방서",
  ],

  경기도: [
    "수원소방서",
    "용인소방서",
    "성남소방서",
    "고양소방서",
    "화성소방서",
    "부천소방서",
    "안산소방서",
    "안양소방서",
    "평택소방서",
    "시흥소방서",
    "김포소방서",
    "광주소방서",
    "광명소방서",
    "군포소방서",
    "하남소방서",
    "오산소방서",
    "이천소방서",
    "안성소방서",
    "의왕소방서",
    "양평소방서",
    "여주소방서",
    "과천소방서",
  ],

  강원특별자치도: [
    "춘천소방서",
    "원주소방서",
    "강릉소방서",
    "동해소방서",
    "태백소방서",
    "속초소방서",
    "삼척소방서",
  ],

  충청북도: [
    "청주동부소방서",
    "청주서부소방서",
    "충주소방서",
    "제천소방서",
  ],

  충청남도: [
    "천안동남소방서",
    "천안서북소방서",
    "공주소방서",
    "보령소방서",
    "아산소방서",
    "서산소방서",
  ],

  전북특별자치도: [
    "전주덕진소방서",
    "전주완산소방서",
    "군산소방서",
    "익산소방서",
    "정읍소방서",
    "남원소방서",
  ],

  전라남도: [
    "목포소방서",
    "여수소방서",
    "순천소방서",
    "나주소방서",
    "광양소방서",
  ],

  경상북도: [
    "포항북부소방서",
    "포항남부소방서",
    "경주소방서",
    "김천소방서",
    "안동소방서",
    "구미소방서",
  ],

  경상남도: [
    "창원소방서",
    "진주소방서",
    "통영소방서",
    "사천소방서",
    "김해소방서",
    "밀양소방서",
    "거제소방서",
    "양산소방서",
  ],

  제주특별자치도: [
    "제주소방서",
    "서귀포소방서",
    "서부소방서",
    "동부소방서",
  ],
};

export default function StartSection() {
  const navigate = useNavigate();

  const [region, setRegion] = useState("");
  const [station, setStation] = useState("");

  const canStart = region !== "" && station !== "";

  const handleStart = () => {
    if (!canStart) return;

    navigate("/main", {
      state: {
        region,
        station,
      },
    });
  };

  return (
    <section className="start-section" id="start">
      <div className="start-background" />

      <motion.div
        className="start-content"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="section-kicker">READY WHEN YOU ARE</p>
        <h2>현장 대응을 더 빠르게,<br />더 안전하게 준비하세요.</h2>
        <p className="start-description">케미체크119는 현장 판단을 더 빠르게 준비하고, 대응의 안전성을 함께 지켜줍니다.</p>

        <div className="login-card">
          <div className="login-logo">
            <img
              src="/images/logowhite.jpg"
              alt="케미체크119 화학재난대응지원시스템"
            />
          </div>

          <div className="login-divider" />

          <div className="login-form">
            <label htmlFor="region">지역</label>

            <select
              id="region"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setStation("");
              }}
            >
              <option value="" disabled>
                지역을 선택해주세요
              </option>

              {Object.keys(stationData).map((regionName) => (
                <option key={regionName} value={regionName}>
                  {regionName}
                </option>
              ))}
            </select>

            <label htmlFor="station">소방서</label>

            <select
              id="station"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              disabled={!region}
            >
              <option value="" disabled>
                소방서를 선택해주세요
              </option>

              {region &&
                stationData[region].map((stationName) => (
                  <option key={stationName} value={stationName}>
                    {stationName}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className={
                canStart
                  ? "start-button active"
                  : "start-button"
              }
            >
              시작하기
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}