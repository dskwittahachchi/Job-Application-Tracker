import { BarChart3, BriefcaseBusiness, CalendarDays, ChevronDown, LogOut, Menu, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

const navigation = [
  { to: "/", label: "Overview", icon: BarChart3, end: true },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings2 },
];
const pageCopy: Record<string, { title: string; description: string }> = {
  "/": { title: "Good morning", description: "Here is the latest on your job search." },
  "/applications": { title: "Applications", description: "Keep every opportunity moving forward." },
  "/upcoming": { title: "Upcoming", description: "Interviews and follow-ups in one calm timeline." },
  "/settings": { title: "Settings", description: "Personalize your Trackly workspace." },
};

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = pageCopy[location.pathname] ?? pageCopy["/"]!;
  const firstName = user?.name.split(" ")[0] ?? "there";
  const initials = user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() ?? "TR";
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__top"><Logo /><button className="icon-button sidebar__close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X /></button></div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item--active" : ""}`}><Icon /><span>{label}</span></NavLink>
          ))}
        </nav>
        <div className="sidebar__focus">
          <span className="sidebar__focus-icon"><BriefcaseBusiness /></span>
          <strong>Stay in motion</strong>
          <p>Small, consistent follow-ups turn applications into conversations.</p>
          <Link to="/upcoming">View next actions</Link>
        </div>
        <div className="user-menu">
          <span className="avatar">{initials}</span>
          <span><strong>{user?.name}</strong><small>{user?.email}</small></span>
          <button className="icon-button" aria-label="Sign out" onClick={logout}><LogOut /></button>
        </div>
      </aside>
      {menuOpen ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /> : null}
      <main className="app-main">
        <header className="topbar">
          <div className="topbar__heading">
            <button className="icon-button icon-button--bordered mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu /></button>
            <div><h1>{location.pathname === "/" ? `${copy.title}, ${firstName}` : copy.title}</h1><p>{copy.description}</p></div>
          </div>
          <div className="topbar__actions">
            <span className="date-chip">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}<ChevronDown /></span>
            <Link className="button button--primary" to="/applications?new=1"><Plus />Add application</Link>
          </div>
        </header>
        <div className="page"><Outlet /></div>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 4).map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}><Icon /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
