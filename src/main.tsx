
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import App from "../new-ui/src/App";
  import "../new-ui/src/styles/global.css";

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  