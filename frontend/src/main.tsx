import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { GlobalLabProvider } from "./context/GlobalLabContext";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalLabProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GlobalLabProvider>
  </StrictMode>,
);
