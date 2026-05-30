import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import App from "./App";
import { installProductionHardening } from "./hardening/productionHardening";
import "./hardening/productionHardening.css";
import { ThemeProvider } from "./theme/ThemeContext";
import "./index.css";
import "./graph-edges.css";

installProductionHardening();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
