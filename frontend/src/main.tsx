import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadRuntimeApiConfig, syncApiClientBaseUrl } from "@/lib/api";

async function bootstrap() {
  await loadRuntimeApiConfig();
  syncApiClientBaseUrl();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
