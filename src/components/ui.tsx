"use client";

import { ReactNode, useEffect } from "react";
import { X, AlertTriangle, Inbox, Loader2 } from "lucide-react";

/* ---------- Boutons ---------- */
export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "", title,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "dark" | "ghost" | "danger" | "outline" | "accent";
  type?: "button" | "submit"; disabled?: boolean; className?: string; title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide text-sm font-bold rounded-md px-4 py-2 transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none";
  const styles: Record<string, string> = {
    primary: "bg-brand text-white hover:brightness-110 shadow-sm shadow-black/20",
    dark: "bg-coal text-white hover:bg-coal-2 shadow-sm",
    accent: "bg-accent text-coal hover:brightness-105 shadow-sm",
    ghost: "bg-transparent text-coal hover:bg-black/8",
    outline: "bg-white border border-gray-300 text-coal hover:border-brand hover:text-brand",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- Cartes & en-têtes ---------- */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function PageHead({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 anim-fade-up">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-md bg-coal text-accent flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-sm text-steel mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, icon, tone = "default" }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; tone?: "default" | "brand" | "danger" | "ok" }) {
  const tones: Record<string, string> = {
    default: "text-coal", brand: "text-brand", danger: "text-red-600", ok: "text-green-700",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      {icon && <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-coal shrink-0">{icon}</div>}
      <div className="min-w-0">
        <div className={`font-display text-3xl font-extrabold leading-none ${tones[tone]}`}>{value}</div>
        <div className="text-[11px] uppercase tracking-wider font-semibold text-steel mt-1">{label}</div>
        {sub && <div className="text-xs text-steel">{sub}</div>}
      </div>
    </Card>
  );
}

/* ---------- Formulaires ---------- */
export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-coal mb-1">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-steel mt-1">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-shadow";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-20 ${props.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer disabled:opacity-40 ${checked ? "bg-brand" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/* ---------- Badges ---------- */
export function Badge({ children, color = "gray", className = "" }: { children: ReactNode; color?: "gray" | "brand" | "green" | "red" | "amber" | "blue" | "coal"; className?: string }) {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    brand: "bg-brand/10 text-brand border-brand/30",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    coal: "bg-coal text-white border-coal",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide border rounded px-1.5 py-0.5 ${map[color]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------- Modale ---------- */
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-coal/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] flex flex-col rounded-t-xl sm:rounded-lg shadow-2xl anim-fade-up overflow-hidden`}>
        <div className="hazard-thin h-1.5 shrink-0" />
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <h3 className="font-display text-xl font-extrabold uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 cursor-pointer" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>
    }>
      <div className="flex gap-3 items-start">
        <AlertTriangle className={danger ? "text-red-600 shrink-0" : "text-brand shrink-0"} size={22} />
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </Modal>
  );
}

/* ---------- Divers ---------- */
export function Empty({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-steel gap-2">
      {icon ?? <Inbox size={28} />}
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-steel">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; icon?: ReactNode }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 bg-gray-200/70 p-1 rounded-lg overflow-x-auto mb-5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-display font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer ${active === t.key ? "bg-coal text-accent shadow" : "text-gray-600 hover:bg-white/70"}`}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" />{children}</p>;
}
