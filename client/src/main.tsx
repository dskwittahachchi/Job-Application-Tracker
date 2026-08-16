import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles.css";

const savedTheme = localStorage.getItem("trackly_theme");
document.documentElement.dataset.theme = savedTheme === "dark" || (savedTheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider><ErrorBoundary><App /></ErrorBoundary></ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
