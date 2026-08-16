import { Orbit } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Trackly">
      <span className="brand__mark"><Orbit /></span>
      {compact ? null : <span>trackly</span>}
    </div>
  );
}
