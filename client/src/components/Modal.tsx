import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({ title, eyebrow, children, onClose, size = "medium" }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; size?: "medium" | "large" }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2 id="modal-title">{title}</h2></div>
          <button className="icon-button icon-button--bordered" aria-label="Close dialog" onClick={onClose}><X /></button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
