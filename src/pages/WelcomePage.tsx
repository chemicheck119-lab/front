import { useEffect } from "react";
import OpenSection from "../components/welcome/OpenSection";
import ProblemSection from "../components/welcome/ProblemSection";
import SolutionSection from "../components/welcome/SolutionSection";
import FeatureSection from "../components/welcome/FeatureSection";
import HowItWorksSection from "../components/welcome/HowItWorksSection";
import TrustSection from "../components/welcome/TrustSection";
import StartSection from "../components/welcome/StartSection";
import FooterSection from "../components/welcome/FooterSection";

const WELCOME_SLIDE_KEY = "welcome-slide-index";
const WHEEL_GESTURE_END_MS = 140;
const WHEEL_TRIGGER_DELTA = 18;

function WelcomePage() {
  useEffect(() => {
    document.documentElement.classList.add("welcome-scroll-root");
    const slides = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".welcome-page > section, .welcome-page > footer",
      ),
    );
    const previousScrollRestoration = window.history.scrollRestoration;
    let wheelGestureActive = false;
    let wheelGestureTriggered = false;
    let wheelDelta = 0;
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
      event.preventDefault();

      if (wheelGestureTriggered) {
        if (unlockTimer) window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(() => {
          wheelGestureActive = false;
          wheelGestureTriggered = false;
          wheelDelta = 0;
        }, WHEEL_GESTURE_END_MS);
        return;
      }

      wheelDelta += event.deltaY;
      wheelGestureActive = true;
      if (unlockTimer) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        wheelGestureActive = false;
        wheelDelta = 0;
      }, WHEEL_GESTURE_END_MS);

      if (Math.abs(wheelDelta) < WHEEL_TRIGGER_DELTA) return;

      const direction = wheelDelta > 0 ? 1 : -1;
      wheelDelta = 0;
      wheelGestureTriggered = true;

      const currentIndex = slides.reduce(
        (closestIndex, slide, index) =>
          Math.abs(slide.offsetTop - window.scrollY) <
          Math.abs(slides[closestIndex].offsetTop - window.scrollY)
            ? index
            : closestIndex,
        0,
      );
      const nextIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction));
      if (nextIndex === currentIndex) return;

      sessionStorage.setItem(WELCOME_SLIDE_KEY, String(nextIndex));
      window.scrollTo({
        top: slides[nextIndex].offsetTop,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
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
      <HowItWorksSection />
      <FeatureSection />
      <TrustSection />
      <StartSection />
      <FooterSection />
    </main>
  );
}

export default WelcomePage;