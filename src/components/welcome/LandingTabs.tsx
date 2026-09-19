import { NavLink } from "react-router-dom";

export const LANDING_TABS = [
  { id: "home", label: "홈", to: "/", end: true },
  { id: "features", label: "기능 소개", to: "/features", end: true },
  { id: "public-data", label: "공공데이터", to: "/public-data", end: true },
  { id: "trends", label: "정부 동향", to: "/trends", end: true },
] as const;

export default function LandingTabs() {
  return (
    <nav className="landing-tabs" aria-label="케미체크119 주요 메뉴">
      {LANDING_TABS.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `landing-tab${isActive ? " is-active" : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
