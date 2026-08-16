import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Logo } from "./components/Logo";
import { useAuth } from "./context/AuthContext";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UpcomingPage } from "./pages/UpcomingPage";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><Logo /><span className="loading-orbit" /></div>;
  if (!user) return <AuthPage />;
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="upcoming" element={<UpcomingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
