import { useEffect } from "react";
import OpenSection from "../components/welcome/OpenSection";
import ProblemSection from "../components/welcome/ProblemSection";
import FeatureSection from "../components/welcome/FeatureSection";
import StartSection from "../components/welcome/StartSection";

function WelcomePage() {
  useEffect(() => {
    document.documentElement.classList.add("welcome-scroll-root");

    return () => {
      document.documentElement.classList.remove("welcome-scroll-root");
    };
  }, []);

  return (
    <main className="welcome-page">
      <OpenSection />
      <ProblemSection />
      <FeatureSection />
      <StartSection />
    </main>
  );
}

export default WelcomePage;