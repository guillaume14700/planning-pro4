"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { MODULE_MAP } from "@/lib/modules";
import { Siren, CalendarDays, Info, CheckCircle2, Lock, PowerOff, X } from "lucide-react";

/* ---------- Types partagés ---------- */
export type Me = { id: number; name: string; role: string; job: string; color: string; phone: string; active: boolean };
export type UserT = { id: number; name: string; role: string; job: string; phone: string; color: string; active: boolean };
export type SettingsT = {
  appName: string; companyName: string; logoData: string; primaryColor: string; accentColor: string;
  depotName: string; depotAddress: string; depotLat: number; depotLng: number;
};
export type ChantierT = {
  id: number; name: string; client: string; address: string; contactName: string; contactPhone: string;
  distanceKm: number; travelMin: number; lat: number | null; lng: number | null; color: string; notes: string; active: boolean;
};
export type VehicleT = { id: number; name: string; plate: string; type: string; status: string; km: number; notes: string };
export type MissionT = {
  id: number; date: string; driverId: number; chantierId: number; vehicleId: number;
  startTime: string; endTime: string; extraDrivingMin: number; task: string; notes: string; updatedAt?: string;
};
export type NotifT = { id: number; type: string; title: string; body: string; createdBy: number; createdByName: string; createdAt: string; read?: boolean };
export type AlertT = {
  id: number; vehicleId: number; kind: string; severity: string; message: string; location: string; status: string;
  createdBy: number; createdByName: string; createdAt: string; resolvedByName?: string; resolvedAt?: string | null;
  vehicleName?: string; vehiclePlate?: string;
};

type Toast = { id: number; title: string; body?: string; tone: "info" | "panne" | "ok" };

type AppState = {
  me: Me; settings: SettingsT; modules: Record<string, boolean>;
  users: UserT[]; chantiers: ChantierT[]; vehicles: VehicleT[];
  unread: number; activeAlerts: AlertT[];
  refresh: () => Promise<void>;
  setUnread: (n: number) => void;
  toast: (title: string, tone?: Toast["tone"], body?: string) => void;
  panneOpen: boolean; setPanneOpen: (v: boolean) => void;
};

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp hors AppProvider");
  return v;
}

export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth")) {
    window.location.href = "/login";
    throw new Error("Session expirée");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Erreur ${res.status}`);
  return data as T;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AppState, "refresh" | "toast" | "setUnread" | "panneOpen" | "setPanneOpen"> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [panneOpen, setPanneOpen] = useState(false);
  const lastNotifId = useRef<number | null>(null);
  const versionRef = useRef<string>("");
  const toastId = useRef(1);

  const toast = useCallback((title: string, tone: Toast["tone"] = "info", body?: string) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, title, body, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6500);
  }, []);

  const refresh = useCallback(async () => {
    const data = await api<{
      me: Me; settings: SettingsT; modules: Record<string, boolean>;
      users: UserT[]; chantiers: ChantierT[]; vehicles: VehicleT[]; version: string;
    }>("/api/state");
    versionRef.current = data.version;
    document.body.style.setProperty("--brand", data.settings.primaryColor);
    document.body.style.setProperty("--accent", data.settings.accentColor);
    setState((prev) => ({ ...data, unread: prev?.unread ?? 0, activeAlerts: prev?.activeAlerts ?? [] }));
  }, []);

  const setUnread = useCallback((n: number) => {
    setState((prev) => (prev ? { ...prev, unread: n } : prev));
  }, []);

  useEffect(() => { refresh().catch(() => { window.location.href = "/login"; }); }, [refresh]);

  /* Sondage temps réel : alertes panne + messages + version (modules/couleurs) */
  useEffect(() => {
    if (!state) return;
    let stop = false;
    const tick = async () => {
      try {
        const p = await api<{ unread: number; activeAlerts: AlertT[]; lastNotif: NotifT | null; version: string }>("/api/pulse");
        if (stop) return;
        setState((prev) => (prev ? { ...prev, unread: p.unread, activeAlerts: p.activeAlerts } : prev));
        if (p.lastNotif && lastNotifId.current != null && p.lastNotif.id > lastNotifId.current) {
          const n = p.lastNotif;
          setState((prev) => {
            if (prev && n.createdBy !== prev.me.id) {
              toast(n.title, n.type === "panne" ? "panne" : "info", n.body);
            }
            return prev;
          });
        }
        if (p.lastNotif) lastNotifId.current = Math.max(lastNotifId.current ?? 0, p.lastNotif.id);
        if (p.version && versionRef.current && p.version !== versionRef.current) {
          await refresh();
          toast("Application mise à jour par l'administrateur", "info");
        }
      } catch { /* silencieux */ }
    };
    tick();
    const iv = setInterval(tick, 20000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => { stop = true; clearInterval(iv); window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state != null]);

  if (!state) {
    return (
      <div className="min-h-screen coal-texture flex flex-col items-center justify-center gap-4 text-white">
        <div className="hazard h-2 w-40 rounded-full" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-widest animate-pulse">Chargement du poste…</div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ ...state, refresh, toast, setUnread, panneOpen, setPanneOpen }}>
      {children}
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[95] flex flex-col gap-2 w-[min(92vw,380px)] no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast rounded-lg shadow-2xl border overflow-hidden ${
              t.tone === "panne" ? "bg-red-700 border-red-500 text-white" : t.tone === "ok" ? "bg-green-700 border-green-500 text-white" : "bg-coal border-white/15 text-white"
            }`}
          >
            {t.tone === "panne" && <div className="hazard-red h-1.5" />}
            <div className="p-3.5 flex gap-3">
              <span className="shrink-0 mt-0.5">
                {t.tone === "panne" ? <Siren size={19} className="anim-blink" /> : t.tone === "ok" ? <CheckCircle2 size={19} /> : t.title.startsWith("📅") || t.title.startsWith("✏️") || t.title.startsWith("🗑") ? <CalendarDays size={19} className="text-accent" /> : <Info size={19} className="text-accent" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{t.title}</p>
                {t.body && <p className="text-xs opacity-85 mt-0.5 line-clamp-3">{t.body}</p>}
              </div>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer" aria-label="Fermer">
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ---------- Garde d'accès aux modules ---------- */
export function ModuleGate({ k, children }: { k: string; children: ReactNode }) {
  const { modules, me } = useApp();
  const def = MODULE_MAP[k];
  const enabled = modules[k] ?? true;
  const isAdmin = me.role === "admin";

  if (def?.adminOnly && !isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-gray-200 rounded-lg p-8 text-center anim-fade-up">
        <Lock size={32} className="mx-auto text-steel mb-3" />
        <h2 className="font-display text-2xl font-extrabold uppercase">Accès réservé</h2>
        <p className="text-sm text-steel mt-2">Ce module est réservé à l'administrateur principal.</p>
      </div>
    );
  }
  if (!enabled && !isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-gray-200 rounded-lg p-8 text-center anim-fade-up">
        <PowerOff size={32} className="mx-auto text-steel mb-3" />
        <h2 className="font-display text-2xl font-extrabold uppercase">Module désactivé</h2>
        <p className="text-sm text-steel mt-2">L'administrateur principal a désactivé ce module. Contactez-le pour y accéder.</p>
      </div>
    );
  }
  return (
    <>
      {!enabled && isAdmin && (
        <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-4 py-2.5 text-sm flex items-center gap-2 anim-fade-up">
          <PowerOff size={16} /> Module désactivé pour les utilisateurs — visible uniquement par vous (admin).
        </div>
      )}
      {children}
    </>
  );
}
