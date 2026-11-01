"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Truck, HardHat, Siren, Wind, Sun, CloudSun, Cloud, CloudRain,
  CloudSnow, CloudLightning, CloudFog, ArrowRight, Bell, Plus, MapPin, Route,
  Gauge, Clock, BarChart3, Printer, ClipboardCheck, Wrench, Fuel, Contact, CalendarOff,
  Download, ChevronRight,
} from "lucide-react";
import { useApp, api, MissionT, NotifT } from "@/components/app-provider";
import { ShareLinkStrip } from "@/components/share-link";
import { Card, Stat, Badge, Spinner, Empty } from "@/components/ui";
import { MODULES } from "@/lib/modules";
import { todayStr, addDays, toMin, toHHMM, fmtDateTime, initials, fmtDur } from "@/lib/utils";

type Daily = {
  time?: string[]; weather_code?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[];
  wind_speed_10m_max?: number[]; wind_gusts_10m_max?: number[]; precipitation_probability_max?: number[];
};

export function weatherIcon(code: number, size = 22) {
  if (code === 0) return <Sun size={size} className="text-amber-500" />;
  if (code <= 2) return <CloudSun size={size} className="text-amber-500" />;
  if (code === 3) return <Cloud size={size} className="text-gray-500" />;
  if (code === 45 || code === 48) return <CloudFog size={size} className="text-gray-500" />;
  if (code >= 95) return <CloudLightning size={size} className="text-violet-600" />;
  if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-sky-500" />;
  if (code >= 85) return <CloudSnow size={size} className="text-sky-500" />;
  return <CloudRain size={size} className="text-sky-600" />;
}

export default function Dashboard() {
  const { me, settings, users, chantiers, vehicles, modules, activeAlerts, unread } = useApp();
  const isAdmin = me.role === "admin";
  const [missions, setMissions] = useState<MissionT[] | null>(null);
  const [notifs, setNotifs] = useState<NotifT[]>([]);
  const [scope, setScope] = useState<"team" | "me">(isAdmin ? "team" : "me");
  const [weather, setWeather] = useState<Daily | null>(null);
  const today = todayStr();

  useEffect(() => {
    api<MissionT[]>(`/api/missions?from=${today}&to=${addDays(today, 1)}`).then(setMissions).catch(() => setMissions([]));
    api<NotifT[]>("/api/notifications").then((n) => setNotifs(n.slice(0, 5))).catch(() => {});
    fetch(`/api/weather?lat=${settings.depotLat}&lon=${settings.depotLng}`).then((r) => r.json()).then((d) => setWeather(d?.time ? d : null)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cMap = useMemo(() => Object.fromEntries(chantiers.map((c) => [c.id, c])), [chantiers]);
  const vMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const uMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const todays = (missions ?? []).filter((m) => m.date === today && (scope === "team" || m.driverId === me.id))
    .sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const allToday = (missions ?? []).filter((m) => m.date === today);
  const kmToday = allToday.reduce((a, m) => a + (cMap[m.chantierId]?.distanceKm ?? 0) * 2, 0);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const dispo = vehicles.filter((v) => v.status === "disponible").length;

  const quick = MODULES.filter((m) => !m.locked && m.href !== "/" && (isAdmin ? !m.adminOnly : modules[m.key] !== false && !m.adminOnly)).slice(0, 8);
  const gust = weather?.wind_gusts_10m_max?.[0] ?? 0;

  return (
    <div className="space-y-5">
      {/* Bandeau déploiement (admin) — étape 1 : télécharger le code */}
      {isAdmin && (
        <Link
          href="/telecharger"
          className="block bg-coal hover:bg-coal-2 text-white rounded-lg p-4 flex items-center gap-3.5 transition-all hover:shadow-lg anim-fade-up group"
        >
          <span className="w-11 h-11 rounded-md bg-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Download size={22} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-display font-extrabold uppercase text-base md:text-lg leading-tight">
              Mettre l'application en ligne — Étape 1 : télécharger le code (.zip)
            </span>
            <span className="block text-xs text-gray-400 mt-0.5">
              Cliquez ici : le fichier se télécharge tout seul, puis suivez le mini-guide pour GitHub
            </span>
          </span>
          <ChevronRight size={22} className="text-accent shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Entête caractéristique */}
      <div className="coal-texture rounded-lg text-white p-5 md:p-6 relative overflow-hidden anim-fade-up">
        <div className="hazard absolute top-0 left-0 right-0 h-1.5" />
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-1">Poste de commandement · {settings.depotName}</p>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none">
              Bonjour, {me.name.split(" ")[0]}
            </h1>
            <p className="text-gray-400 text-sm mt-2 capitalize">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — {me.job}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/planning" className="inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
              <CalendarDays size={16} /> Planning
            </Link>
            <Link href="/planning?new=1" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
              <Plus size={16} /> Mission
            </Link>
          </div>
        </div>
        {isAdmin && <div className="mt-5"><ShareLinkStrip /></div>}
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="anim-fade-up delay-1"><Stat label="Missions aujourd'hui" value={allToday.length} icon={<CalendarDays size={20} />} tone="brand" /></div>
        <div className="anim-fade-up delay-2"><Stat label="Km A/R estimés" value={`${Math.round(kmToday)}`} sub="dépôt ↔ chantiers" icon={<Route size={20} />} /></div>
        <div className="anim-fade-up delay-3"><Stat label="Véhicules disponibles" value={`${dispo}/${vehicles.length}`} icon={<Truck size={20} />} tone={dispo === vehicles.length ? "ok" : "default"} /></div>
        <div className="anim-fade-up delay-4"><Stat label="Pannes en cours" value={activeAlerts.length} icon={<Siren size={20} />} tone={activeAlerts.length ? "danger" : "ok"} /></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Journée */}
        <Card className="lg:col-span-2 p-5 anim-fade-up delay-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-2xl font-extrabold uppercase">
              {scope === "me" ? "Ma journée" : "Journée de l'équipe"}
            </h2>
            <div className="flex bg-gray-100 rounded-md p-0.5">
              {(["me", "team"] as const).map((s) => (
                <button key={s} onClick={() => setScope(s)} className={`px-3 py-1 rounded text-xs font-display font-bold uppercase tracking-wide cursor-pointer transition-all ${scope === s ? "bg-coal text-accent" : "text-steel hover:text-coal"}`}>
                  {s === "me" ? "Moi" : "Équipe"}
                </button>
              ))}
            </div>
          </div>
          {missions == null ? <Spinner /> : todays.length === 0 ? (
            <Empty text="Aucune mission aujourd'hui pour ce filtre." icon={<HardHat size={28} />} />
          ) : (
            <div className="space-y-2.5">
              {todays.map((m) => {
                const c = cMap[m.chantierId];
                const v = vMap[m.vehicleId];
                const u = uMap[m.driverId];
                const running = nowMin >= toMin(m.startTime) && nowMin <= toMin(m.endTime);
                const done = nowMin > toMin(m.endTime);
                return (
                  <div key={m.id} className={`flex gap-3 rounded-md border p-3 transition-all hover:shadow-sm ${running ? "border-brand/60 bg-brand/5" : "border-gray-200"} ${done ? "opacity-60" : ""}`}>
                    <div className="w-1.5 rounded-full shrink-0" style={{ background: c?.color ?? "#999" }} />
                    <div className="font-mono text-sm font-semibold w-[86px] shrink-0 leading-tight">
                      {m.startTime}<br /><span className="text-steel">{m.endTime}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{c?.name ?? "Chantier"} <span className="text-steel font-normal">· {m.task}</span></p>
                      <p className="text-xs text-steel truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {c?.distanceKm ?? "?"} km · {c?.travelMin ?? "?"} min — sur site {toHHMM(toMin(m.startTime) + (c?.travelMin ?? 0))} · <Truck size={11} /> {v?.name ?? "?"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {u && scope === "team" && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: u.color }}>{initials(u.name)}</span>
                          <span className="hidden sm:inline">{u.name.split(" ")[0]}</span>
                        </span>
                      )}
                      {running ? <Badge color="brand"><span className="w-1.5 h-1.5 rounded-full bg-brand anim-blink" /> En cours</Badge> : done ? <Badge>Terminée</Badge> : <Badge color="blue">À venir</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/planning" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand hover:gap-2 transition-all">
            Voir le planning complet <ArrowRight size={15} />
          </Link>
        </Card>

        {/* Colonne droite */}
        <div className="space-y-5">
          <Card className="p-5 anim-fade-up delay-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-extrabold uppercase">Météo dépôt</h2>
              {modules["meteo"] !== false && <Link href="/meteo" className="text-xs font-bold text-brand hover:underline">Chantiers →</Link>}
            </div>
            {weather?.time?.length ? (
              <div>
                <div className="flex items-center gap-3">
                  {weatherIcon(weather.weather_code?.[0] ?? 0, 40)}
                  <div>
                    <div className="font-display text-4xl font-extrabold leading-none">{Math.round(weather.temperature_2m_max?.[0] ?? 0)}°<span className="text-lg text-steel font-bold"> / {Math.round(weather.temperature_2m_min?.[0] ?? 0)}°</span></div>
                    <p className="text-xs text-steel mt-1 flex items-center gap-1"><Wind size={12} /> rafales {Math.round(gust)} km/h · pluie {weather.precipitation_probability_max?.[0] ?? 0}%</p>
                  </div>
                </div>
                <div className={`mt-3 text-xs font-bold rounded-md px-3 py-2 border ${gust >= 50 ? "bg-red-50 border-red-300 text-red-700" : gust >= 38 ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                  {gust >= 50 ? "🛑 Levage déconseillé — rafales ≥ 50 km/h" : gust >= 38 ? "⚠️ Vigilance grutage — rafales ≥ 38 km/h" : "✅ Conditions favorables au levage"}
                </div>
              </div>
            ) : <p className="text-sm text-steel">Météo indisponible.</p>}
          </Card>

          <Card className="p-5 anim-fade-up delay-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-extrabold uppercase flex items-center gap-2">Messages {unread > 0 && <Badge color="brand">{unread} non lus</Badge>}</h2>
              <Link href="/notifications" className="text-xs font-bold text-brand hover:underline">Tout voir →</Link>
            </div>
            {notifs.length === 0 ? <Empty text="Aucun message." icon={<Bell size={24} />} /> : (
              <div className="space-y-3">
                {notifs.map((n) => (
                  <div key={n.id} className={`text-sm border-l-2 pl-3 ${n.read ? "border-gray-200" : "border-brand"}`}>
                    <p className="font-semibold leading-snug line-clamp-1">{n.title}</p>
                    <p className="text-xs text-steel line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-steel/70 mt-0.5 uppercase tracking-wide">{fmtDateTime(n.createdAt)} · {n.createdByName}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Accès rapide modules */}
      <div className="anim-fade-up delay-4">
        <h2 className="font-display text-xl font-extrabold uppercase mb-3 text-coal">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quick.map((m) => (
            <Link key={m.key} href={m.href} className="group bg-white border border-gray-200 rounded-lg p-3.5 flex items-center gap-3 hover:border-brand hover:shadow-md transition-all">
              <span className="w-9 h-9 rounded-md bg-gray-100 group-hover:bg-brand group-hover:text-white text-coal flex items-center justify-center transition-colors">
                <QuickIcon name={m.icon} />
              </span>
              <span className="text-sm font-bold leading-tight">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickIcon({ name }: { name: string }) {
  const map: Record<string, React.ReactNode> = {
    HardHat: <HardHat size={18} />, Truck: <Truck size={18} />, Siren: <Siren size={18} />,
    Bell: <Bell size={18} />, Gauge: <Gauge size={18} />, Clock: <Clock size={18} />,
    BarChart3: <BarChart3 size={18} />, Printer: <Printer size={18} />, CloudSun: <CloudSun size={18} />,
    ClipboardCheck: <ClipboardCheck size={18} />, Wrench: <Wrench size={18} />, Fuel: <Fuel size={18} />,
    Contact: <Contact size={18} />, CalendarOff: <CalendarOff size={18} />,
  };
  return <>{map[name] ?? <ArrowRight size={18} />}</>;
}
