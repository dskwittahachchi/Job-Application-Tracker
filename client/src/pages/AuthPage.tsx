import { ArrowRight, BarChart3, BriefcaseBusiness, Check, Eye, EyeOff, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";

export function AuthPage() {
  const { login, register, useDemo } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign you in");
    } finally {
      setLoading(false);
    }
  };
  const demo = async () => {
    setLoading(true);
    setError("");
    try { await useDemo(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Demo is unavailable"); } finally { setLoading(false); }
  };
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story__content">
          <span className="feature-pill"><Sparkles />Your job search, beautifully organized</span>
          <h1>Make every application <em>count.</em></h1>
          <p>One focused workspace for opportunities, follow-ups, interviews, and the momentum behind your next move.</p>
          <div className="auth-benefits">
            <div><span><BriefcaseBusiness /></span><div><strong>A clear pipeline</strong><p>Know what is moving, waiting, and worth your attention.</p></div></div>
            <div><span><BarChart3 /></span><div><strong>Progress you can see</strong><p>Turn activity into useful funnel and monthly insights.</p></div></div>
            <div><span><ShieldCheck /></span><div><strong>Private by design</strong><p>Your workspace is protected and scoped to your account.</p></div></div>
          </div>
        </div>
        <div className="auth-proof"><div className="proof-avatars"><span>AM</span><span>JK</span><span>SR</span><span>+2k</span></div><p><strong>Stay ready for the next conversation.</strong><br />Built for focused, ambitious job seekers.</p></div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__heading"><span className="auth-card__mark"><Logo compact /></span><h2>{mode === "login" ? "Welcome back" : "Start your search"}</h2><p>{mode === "login" ? "Sign in to pick up where you left off." : "Create a private workspace in under a minute."}</p></div>
          <div className="auth-tabs" role="tablist"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button></div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" ? <label className="field"><span>Full name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Alex Morgan" autoComplete="name" required /></label> : null}
            <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" autoComplete="email" required /></label>
            <label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            {mode === "register" ? <div className="password-hint"><Check />Use 8+ characters, one uppercase letter, and one number.</div> : null}
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="button button--primary auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : null}{mode === "login" ? "Sign in to Trackly" : "Create my workspace"}<ArrowRight /></button>
          </form>
          <div className="divider"><span>or explore instantly</span></div>
          <button className="button button--demo" onClick={demo} disabled={loading}><span>AM</span>Continue with demo workspace<ArrowRight /></button>
          <p className="auth-terms">By continuing, you agree to keep your job search wonderfully organized.</p>
        </div>
      </section>
    </main>
  );
}
