import { Bell, Check, Laptop, LogOut, Mail, Moon, Palette, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../lib/format";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem("trackly_theme") ?? "light");
  const [emailReminders, setEmailReminders] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  useEffect(() => {
    const resolvedTheme = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.dataset.theme = resolvedTheme;
    localStorage.setItem("trackly_theme", theme);
  }, [theme]);
  const initials = user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="settings-layout">
      <section className="panel settings-profile"><div className="settings-profile__avatar">{initials}</div><div><p className="eyebrow">Your profile</p><h2>{user?.name}</h2><p>{user?.email}</p><span><Check />Member since {formatDate(user?.createdAt, "MMMM yyyy")}</span></div><button className="button button--secondary" onClick={() => showToast("Profile editing is ready for a future account-service integration")}>Edit profile</button></section>
      <section className="settings-grid">
        <article className="panel settings-card"><div className="settings-card__heading"><span><Palette /></span><div><h3>Appearance</h3><p>Choose the atmosphere that helps you focus.</p></div></div><div className="theme-options"><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><span className="theme-preview theme-preview--light"><i /><i /><i /></span><strong><Sun />Light</strong><small>Bright and airy</small></button><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><span className="theme-preview theme-preview--dark"><i /><i /><i /></span><strong><Moon />Dark</strong><small>Easy on the eyes</small></button><button className={theme === "system" ? "active" : ""} onClick={() => setTheme("system")}><span className="theme-preview theme-preview--system"><i /><i /><i /></span><strong><Laptop />System</strong><small>Match your device</small></button></div></article>
        <article className="panel settings-card"><div className="settings-card__heading"><span><Bell /></span><div><h3>Notifications</h3><p>Set the rhythm for helpful nudges.</p></div></div><div className="settings-list"><label><span><strong><Mail />Email reminders</strong><small>Get a note before a scheduled follow-up.</small></span><input type="checkbox" checked={emailReminders} onChange={(event) => setEmailReminders(event.target.checked)} /><i /></label><label><span><strong><Bell />Weekly digest</strong><small>A compact summary of your pipeline every Monday.</small></span><input type="checkbox" checked={weeklyDigest} onChange={(event) => setWeeklyDigest(event.target.checked)} /><i /></label></div><p className="settings-note">Email delivery is an optional roadmap integration. Preferences are saved visually for this demo.</p></article>
        <article className="panel settings-card"><div className="settings-card__heading"><span><ShieldCheck /></span><div><h3>Account & privacy</h3><p>Your workspace is private to your signed-in account.</p></div></div><dl className="security-list"><div><dt><UserRound />Account ID</dt><dd>{user?.id.slice(0, 12)}...</dd></div><div><dt><ShieldCheck />Data access</dt><dd>User-owned only</dd></div></dl><button className="button button--danger button--full" onClick={logout}><LogOut />Sign out of Trackly</button></article>
      </section>
    </div>
  );
}
