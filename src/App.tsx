import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import OnboardingPage from "./pages/OnboardingPage";
import MainPage from "./pages/MainPage";
import RecordsPage from "./pages/RecordsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/records" element={<RecordsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;