import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import OnboardingPage from "./pages/OnboardingPage";
import MainPage from "./pages/MainPage";
import RecordsPage from "./pages/RecordsPage";
import FeaturesPage from "./pages/FeaturesPage";
import PublicDataPage from "./pages/PublicDataPage";
import TrendsPage from "./pages/TrendsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/public-data" element={<PublicDataPage />} />
        <Route path="/trends" element={<TrendsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;