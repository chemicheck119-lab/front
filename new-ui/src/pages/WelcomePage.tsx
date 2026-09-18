import { useEffect } from "react";
import OpenSection from "../components/welcome/OpenSection";
import ProblemSection from "../components/welcome/ProblemSection";
import SolutionSection from "../components/welcome/SolutionSection";
import FeatureSection from "../components/welcome/FeatureSection";
import HowItWorksSection from "../components/welcome/HowItWorksSection";
import StartSection from "../components/welcome/StartSection";
import FooterSection from "../components/welcome/FooterSection";

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
      <SolutionSection />
      <FeatureSection />
      <HowItWorksSection />
      <StartSection />
      <FooterSection />
    </main>
  );
}

export default WelcomePage;