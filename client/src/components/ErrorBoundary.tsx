import { Component, type ErrorInfo, type ReactNode } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";
import { Logo } from "./Logo";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-state">
        <Logo />
        <span><CircleAlert /></span>
        <h1>Let&apos;s get you back on track.</h1>
        <p>An unexpected interface error occurred. Your saved data is safe.</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>
          <RefreshCw />Reload Trackly
        </button>
      </main>
    );
  }
}
