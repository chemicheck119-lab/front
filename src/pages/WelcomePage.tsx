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
    let wheelLocked = false;
    let unlockTimer: number | undefined;
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

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 1) return;
      if (wheelLocked) {
        event.preventDefault();
        if (unlockTimer) window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(() => {
          wheelLocked = false;
        }, 280);
        return;
      }

      const currentIndex = slides.reduce(
        (closestIndex, slide, index) =>
          Math.abs(slide.offsetTop - window.scrollY) <
          Math.abs(slides[closestIndex].offsetTop - window.scrollY)
            ? index
            : closestIndex,
        0,
      );
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction));
      if (nextIndex === currentIndex) return;

      event.preventDefault();
      wheelLocked = true;
      sessionStorage.setItem(WELCOME_SLIDE_KEY, String(nextIndex));
      window.scrollTo({
        top: slides[nextIndex].offsetTop,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      unlockTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, 280);
    };

    window.addEventListener("scroll", saveCurrentSlide, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    requestAnimationFrame(() => requestAnimationFrame(restoreSlide));

    return () => {
      window.removeEventListener("scroll", saveCurrentSlide);
      window.removeEventListener("wheel", handleWheel);
      if (unlockTimer) window.clearTimeout(unlockTimer);
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