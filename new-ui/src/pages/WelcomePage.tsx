import OpenSection from "../components/welcome/OpenSection";
import ProblemSection from "../components/welcome/ProblemSection";
import FeatureSection from "../components/welcome/FeatureSection";
import StartSection from "../components/welcome/StartSection";

function WelcomePage() {
  return (
    <main>
      <OpenSection />
      <ProblemSection />
      <FeatureSection />
      <StartSection />
    </main>
  );
}

export default WelcomePage;