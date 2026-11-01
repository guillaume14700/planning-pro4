"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, HardHat, Truck, Siren, Bell, Gauge, Clock, BarChart3,
  ScrollText, Printer, CloudSun, ClipboardCheck, Wrench, Fuel, Contact, CalendarOff,
  Settings, Menu, X, LogOut, KeyRound, ChevronDown, Cog, CircleDot, Droplets, Zap,
  AlertTriangle, MapPin, Construction, ShieldCheck, Smartphone,
} from "lucide-react";
import { useApp, api, AlertT } from "./app-provider";
import { InstallMenuItem } from "./pwa";
import { ShareLinkButton } from "./share-link";
import { MODULES } from "@/lib/modules";
import { initials, fmtDateTime } from "@/lib/utils";
import { Button, Modal, Field, Select, Input, Textarea, ErrorNote, Badge } from "./ui";

const ICONS: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />, CalendarDays: <CalendarDays size={18} />,
  HardHat: <HardHat size={18} />, Truck: <Truck size={18} />, Siren: <Siren size={18} />,
  Bell: <Bell size={18} />, Gauge: <Gauge size={18} />, Clock: <Clock size={18} />,
  BarChart3: <BarChart3 size={18} />, ScrollText: <ScrollText size={18} />, Printer: <Printer size={18} />,
  CloudSun: <CloudSun size={18} />, ClipboardCheck: <ClipboardCheck size={18} />, Wrench: <Wrench size={18} />,
  Fuel: <Fuel size={18} />, Contact: <Contact size={18} />, CalendarOff: <CalendarOff size={18} />,
  Settings: <Settings size={18} />,
};

const KINDS = [
  { key: "moteur", label: "Moteur", icon: <Cog size={18} /> },
  { key: "crevaison", label: "Crevaison", icon: <CircleDot size={18} /> },
  { key: "hydraulique", label: "Hydraulique", icon: <Droplets size={18} /> },
  { key: "electrique", label: "Électrique", icon: <Zap size={18} /> },
  { key: "autre", label: "Autre", icon: <AlertTriangle size={18} /> },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { me, settings, modules, unread, activeAlerts, panneOpen, setPanneOpen } = useApp();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [codeModal, setCodeModal] = useState(false);
  const isAdmin = me.role === "admin";

  const visible = MODULES.filter((m) => {
    if (m.adminOnly && !isAdmin) return false;
    if (m.locked) return true;
    return isAdmin ? true : modules[m.key] !== false;
  });
  const groups = ["Exploitation", "Suivi & conformité", "Outils terrain", "Administration"] as const;

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {groups.map((g) => {
        const items = visible.filter((m) => m.group === g);
        if (!items.length) return null;
        return (
          <div key={g}>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{g}</p>
            <div className="space-y-0.5">
              {items.map((m) => {
                const active = pathname === m.href;
                const off = !m.locked && modules[m.key] === false;
                return (
                  <Link
                    key={m.key}
                    href={m.href}
                    onClick={() => setDrawer(false)}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-semibold transition-all duration-150 relative ${
                      active ? "bg-brand text-white shadow-md shadow-brand/25" : "text-gray-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {active && <span className="absolute -left-3 top-1 bottom-1 w-1 hazard-thin rounded-r" />}
                    <span className={active ? "text-white" : "text-gray-400 group-hover:text-accent"}>{ICONS[m.icon]}</span>
                    <span className="flex-1">{m.label}</span>
                    {m.key === "notifications" && unread > 0 && (
                      <span className="bg-accent text-coal text-[10px] font-extrabold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{unread}</span>
                    )}
                    {m.key === "alertes" && activeAlerts.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 anim-blink" />}
                    {off && <span className="text-[9px] uppercase font-bold text-gray-500 border border-gray-600 rounded px-1">off</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-3 px-5 py-4 border-b border-white/10" onClick={() => setDrawer(false)}>
      {settings.logoData ? (
        <img src={settings.logoData} alt="Logo" className="w-10 h-10 rounded-md object-contain bg-white p-0.5" />
      ) : (
        <div className="w-10 h-10 rounded-md bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
          <Truck size={22} className="text-white" />
        </div>
      )}
      <div className="min-w-0">
        <div className="font-display text-xl font-extrabold uppercase tracking-tight text-white leading-none truncate">{settings.appName}</div>
        <div className="text-[11px] text-gray-400 truncate">{settings.companyName}</div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 coal-texture flex-col z-40 no-print">
        {brand}
        {nav}
        <div className="px-5 py-3 border-t border-white/10 text-[10px] text-gray-500 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-accent" /> RSE — Règl. CE 561/2006
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className="absolute inset-0 bg-coal/70" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 coal-texture flex flex-col anim-fade-up">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setDrawer(false)} className="text-gray-400 p-2 cursor-pointer" aria-label="Fermer le menu"><X size={20} /></button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 no-print">
          <div className="flex items-center gap-2 px-4 md:px-6 h-14">
            <button onClick={() => setDrawer(true)} className="lg:hidden p-2 -ml-2 rounded hover:bg-gray-100 cursor-pointer" aria-label="Menu">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="font-display uppercase font-bold tracking-wide text-sm text-coal">{today}</span>
              <span className="ml-3 text-[11px] text-steel inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 anim-blink" /> synchro auto
              </span>
            </div>
            <div className="flex-1" />

            {(modules["alertes"] !== false || isAdmin) && (
              <button
                onClick={() => setPanneOpen(true)}
                title="Alerte panne — prévenir toute l'équipe"
                className="anim-siren inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-display font-extrabold uppercase tracking-wider text-sm px-3.5 py-2 rounded-md transition-colors cursor-pointer"
              >
                <Siren size={17} />
                <span className="hidden xs:inline sm:inline">Alerte panne</span>
              </button>
            )}

            {isAdmin && <ShareLinkButton />}

            <Link href="/notifications" className="relative p-2 rounded-md hover:bg-gray-100 transition-colors" aria-label={`Messages${unread ? ` (${unread} non lus)` : ""}`}>
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-extrabold rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center">{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>

            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
                <span className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-extrabold" style={{ background: me.color }}>
                  {initials(me.name)}
                </span>
                <span className="hidden md:block text-left">
                  <span className="block text-sm font-bold leading-none">{me.name}</span>
                  <span className="block text-[10px] uppercase tracking-wider text-steel mt-0.5">{isAdmin ? "Admin principal" : "Utilisateur"}</span>
                </span>
                <ChevronDown size={14} className="text-steel" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden anim-fade-up">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold">{me.name}</p>
                      <p className="text-xs text-steel">{me.job}</p>
                    </div>
                    <InstallMenuItem onDone={() => setUserMenu(false)} />
                    <a href="/installer" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer">
                      <Smartphone size={15} className="text-steel" /> Guide d'installation
                    </a>
                    <button onClick={() => { setUserMenu(false); setCodeModal(true); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer">
                      <KeyRound size={15} className="text-steel" /> Changer mon code
                    </button>
                    <button
                      onClick={async () => { await api("/api/auth", "POST", { action: "logout" }); window.location.href = "/login"; }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bandeau alertes panne actives */}
          {activeAlerts.length > 0 && (modules["alertes"] !== false || isAdmin) && (
            <div className="bg-red-700 text-white">
              <div className="hazard-red h-1.5" />
              {activeAlerts.slice(0, 2).map((a: AlertT) => (
                <div key={a.id} className="px-4 md:px-6 py-2 flex items-center gap-3 text-sm">
                  <Siren size={17} className="anim-blink shrink-0" />
                  <p className="flex-1 min-w-0 truncate font-semibold">
                    PANNE {a.severity === "immobilise" ? "— VÉHICULE IMMOBILISÉ" : ""} : {a.vehicleName} ({a.vehiclePlate}) · {KINDS.find((k) => k.key === a.kind)?.label ?? a.kind} · {a.message || "sans détail"} — {a.createdByName}, {fmtDateTime(a.createdAt)}
                  </p>
                  <Link href="/alertes" className="shrink-0 bg-white/15 hover:bg-white/25 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors">
                    Voir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 md:px-6 py-5 md:py-6 max-w-[1500px] w-full mx-auto">{children}</main>

        <footer className="no-print px-6 py-3 text-[11px] text-steel flex items-center gap-2 border-t border-gray-200/70">
          <Construction size={13} />
          {settings.appName} — {settings.companyName} · {settings.depotName}
        </footer>
      </div>

      <PanneModal open={panneOpen} onClose={() => setPanneOpen(false)} />
      <ChangeCodeModal open={codeModal} onClose={() => setCodeModal(false)} />
    </div>
  );
}

/* ---------- Modale ALERTE PANNE ---------- */
function PanneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { vehicles, toast, refresh } = useApp();
  const [vehicleId, setVehicleId] = useState("");
  const [kind, setKind] = useState("moteur");
  const [severity, setSeverity] = useState("immobilise");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!vehicleId) { setError("Sélectionnez le véhicule en panne."); return; }
    setBusy(true); setError("");
    try {
      await api("/api/alerts", "POST", { vehicleId: Number(vehicleId), kind, severity, message, location });
      toast("🚨 Alerte panne envoyée à toute l'équipe", "panne", "Tous les utilisateurs sont informés en temps réel.");
      setMessage(""); setLocation(""); setVehicleId("");
      onClose();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={<span className="text-red-700 flex items-center gap-2"><Siren size={20} /> Alerte panne PL</span>} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="danger" onClick={send} disabled={busy}><Siren size={16} /> {busy ? "Envoi…" : "Diffuser à tous"}</Button>
      </>
    }>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Le message sera <strong>immédiatement diffusé à tous les utilisateurs</strong> et le véhicule passera en statut « panne ».
        </p>
        <Field label="Véhicule concerné" required>
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">— Choisir le véhicule —</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.plate}</option>)}
          </Select>
        </Field>
        <Field label="Type de panne" required>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {KINDS.map((k) => (
              <button key={k.key} type="button" onClick={() => setKind(k.key)}
                className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${kind === k.key ? "border-red-600 bg-red-600 text-white shadow" : "border-gray-300 hover:border-red-400 text-gray-600"}`}>
                {k.icon}{k.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Gravité">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSeverity("immobilise")} className={`rounded-md border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${severity === "immobilise" ? "border-red-600 bg-red-50 text-red-700" : "border-gray-300 text-gray-600 hover:border-red-300"}`}>
              🛑 Véhicule immobilisé
            </button>
            <button type="button" onClick={() => setSeverity("degrade")} className={`rounded-md border px-3 py-2 text-sm font-bold cursor-pointer transition-all ${severity === "degrade" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-300 text-gray-600 hover:border-amber-300"}`}>
              ⚠️ Dégradé, peut rouler
            </button>
          </div>
        </Field>
        <Field label="Lieu / position">
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-2.5 text-steel" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex : A7 sens nord, PR 42 — aire de Givors" className="pl-9" />
          </div>
        </Field>
        <Field label="Détails de la panne">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex : voyant moteur rouge, perte de puissance, arrêt sur bande d'arrêt d'urgence…" />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}

/* ---------- Changement de code personnel ---------- */
function ChangeCodeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (next !== confirm) { setError("La confirmation ne correspond pas."); return; }
    setBusy(true); setError("");
    try {
      await api("/api/auth", "POST", { action: "change-code", current, next });
      toast("Code d'accès modifié", "ok");
      setCurrent(""); setNext(""); setConfirm("");
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Changer mon code" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}><KeyRound size={15} /> Enregistrer</Button>
      </>
    }>
      <div className="space-y-3">
        <Field label="Code actuel" required><Input type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="Nouveau code (4 à 8 chiffres)" required><Input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Confirmer le nouveau code" required><Input type="password" inputMode="numeric" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <p className="text-xs text-steel flex items-center gap-1.5"><Badge color="coal">Info</Badge> L'administrateur peut réinitialiser votre code en cas d'oubli.</p>
      </div>
    </Modal>
  );
}