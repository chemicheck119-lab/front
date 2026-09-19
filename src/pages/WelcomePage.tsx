import { useEffect } from "react";
import OpenSection from "../components/welcome/OpenSection";
import ProblemSection from "../components/welcome/ProblemSection";
import SolutionSection from "../components/welcome/SolutionSection";
import FeatureSection from "../components/welcome/FeatureSection";
import HowItWorksSection from "../components/welcome/HowItWorksSection";
import StartSection from "../components/welcome/StartSection";
import FooterSection from "../components/welcome/FooterSection";

const WELCOME_SLIDE_KEY = "welcome-slide-index";

function WelcomePage() {
  useEffect(() => {
    document.documentElement.classList.add("welcome-scroll-root");
    const slides = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".welcome-page > section, .welcome-page > footer",
      ),
    );
    const previousScrollRestoration = window.history.scrollRestoration;
    const restoreSlide = () => {
      const savedIndex = Number(sessionStorage.getItem(WELCOME_SLIDE_KEY));
      const slide = Number.isInteger(savedIndex) ? slides[savedIndex] : undefined;

      if (!slide) return;

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, slide.offsetTop);
      root.style.scrollBehavior = previousBehavior;
    };

    const saveCurrentSlide = () => {
      const currentIndex = slides.reduce(
        (closestIndex, slide, index) =>
          Math.abs(slide.offsetTop - window.scrollY) <
          Math.abs(slides[closestIndex].offsetTop - window.scrollY)
            ? index
            : closestIndex,
        0,
      );
      sessionStorage.setItem(WELCOME_SLIDE_KEY, String(currentIndex));
    };

    window.addEventListener("scroll", saveCurrentSlide, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(restoreSlide));

    return () => {
      window.removeEventListener("scroll", saveCurrentSlide);
      sessionStorage.removeItem(WELCOME_SLIDE_KEY);
      window.history.scrollRestoration = previousScrollRestoration;
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