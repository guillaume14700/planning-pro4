"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Printer, Trash2, TriangleAlert,
  ArrowRight, MapPin, Truck, Phone, Save,
} from "lucide-react";
import { useApp, api, MissionT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Confirm, ErrorNote, Field, Input, Modal, PageHead, Select, Spinner, Textarea } from "@/components/ui";
import { addDays, mondayOf, todayStr, fmtFr, toMin, toHHMM, fmtDur, DAYS_FR, TASKS, initials, parseDate } from "@/lib/utils";
import { dayStats, dayIssues, restIssue, MissionLike } from "@/lib/rse";

type FormState = {
  id?: number; date: string; driverId: string; chantierId: string; vehicleId: string;
  startTime: string; endTime: string; extraDrivingMin: string; task: string; notes: string;
};

export default function PlanningPage() {
  return (
    <ModuleGate k="planning">
      <Suspense fallback={<Spinner />}>
        <Planning />
      </Suspense>
    </ModuleGate>
  );
}

function Planning() {
  const { me, users, chantiers, vehicles, toast } = useApp();
  const isAdmin = me.role === "admin";
  const params = useSearchParams();
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [missions, setMissions] = useState<MissionT[] | null>(null);
  const [filter, setFilter] = useState("0");
  const [modal, setModal] = useState<FormState | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const cMap = useMemo(() => Object.fromEntries(chantiers.map((c) => [c.id, c])), [chantiers]);
  const vMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const activeUsers = users.filter((u) => u.active);
  const shownUsers = filter === "0" ? activeUsers : activeUsers.filter((u) => u.id === Number(filter));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayStr();

  const load = useCallback(async () => {
    setMissions(null);
    const data = await api<MissionT[]>(`/api/missions?from=${addDays(weekStart, -7)}&to=${addDays(weekStart, 13)}`);
    setMissions(data);
  }, [weekStart]);

  useEffect(() => { load().catch(() => setMissions([])); }, [load]);

  const openCreate = useCallback((date: string, driverId: number) => {
    setError("");
    setReadOnly(false);
    setModal({
      date, driverId: String(driverId), chantierId: String(chantiers.find((c) => c.active)?.id ?? chantiers[0]?.id ?? ""),
      vehicleId: String(vehicles.find((v) => v.status === "disponible")?.id ?? vehicles[0]?.id ?? ""),
      startTime: "07:00", endTime: "16:00", extraDrivingMin: "0", task: TASKS[0]!, notes: "",
    });
  }, [chantiers, vehicles]);

  useEffect(() => {
    if (params.get("new") === "1" && chantiers.length) openCreate(today, me.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, chantiers.length]);

  function openMission(m: MissionT) {
    setError("");
    // Modifiable par l'admin (tout) et par l'utilisateur qui a créé la mission.
    setReadOnly(!(isAdmin || m.createdBy === me.id));
    setModal({
      id: m.id, date: m.date, driverId: String(m.driverId), chantierId: String(m.chantierId),
      vehicleId: String(m.vehicleId), startTime: m.startTime, endTime: m.endTime,
      extraDrivingMin: String(m.extraDrivingMin ?? 0), task: m.task, notes: m.notes,
    });
  }

  /* Conflits véhicule (chevauchement horaire le même jour) */
  const conflicts = useMemo(() => {
    const set = new Set<number>();
    const ms = missions ?? [];
    for (let i = 0; i < ms.length; i++)
      for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i]!, b = ms[j]!;
        if (a.date === b.date && a.vehicleId === b.vehicleId && toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime)) {
          set.add(a.id); set.add(b.id);
        }
      }
    return set;
  }, [missions]);

  /* Aperçu RSE + trajets dans la modale */
  const preview = useMemo(() => {
    if (!modal) return null;
    const c = cMap[Number(modal.chantierId)];
    const travel = c?.travelMin ?? 0;
    const start = toMin(modal.startTime), end = toMin(modal.endTime);
    if (end <= start) return { invalid: true } as const;
    const current: MissionLike = { date: modal.date, driverId: Number(modal.driverId), startTime: modal.startTime, endTime: modal.endTime, extraDrivingMin: Number(modal.extraDrivingMin || 0), travelMin: travel };
    const others = (missions ?? []).filter((m) => m.date === modal.date && m.driverId === Number(modal.driverId) && m.id !== modal.id)
      .map((m) => ({ ...m, travelMin: cMap[m.chantierId]?.travelMin ?? 0 } as MissionLike));
    const st = dayStats([...others, current]);
    const issues = dayIssues(st);
    const prevDay = (missions ?? []).filter((m) => m.date === addDays(modal.date, -1) && m.driverId === Number(modal.driverId));
    const prevEnd = prevDay.length ? Math.max(...prevDay.map((m) => toMin(m.endTime))) : null;
    const rest = restIssue(prevEnd, st.firstStart);
    if (rest) issues.push(rest);
    const v = vMap[Number(modal.vehicleId)];
    return { invalid: false as const, travel, km: c?.distanceKm ?? 0, onSite: toHHMM(start + travel), leaveSite: toHHMM(end - travel), st, issues, vehicle: v };
  }, [modal, missions, cMap, vMap]);

  async function save() {
    if (!modal) return;
    setBusy(true); setError("");
    try {
      const payload = {
        date: modal.date, driverId: Number(modal.driverId), chantierId: Number(modal.chantierId),
        vehicleId: Number(modal.vehicleId), startTime: modal.startTime, endTime: modal.endTime,
        extraDrivingMin: Number(modal.extraDrivingMin || 0), task: modal.task, notes: modal.notes,
      };
      if (modal.id) await api(`/api/missions/${modal.id}`, "PATCH", payload);
      else await api("/api/missions", "POST", payload);
      toast(modal.id ? "✏️ Planning modifié — équipe notifiée" : "📅 Mission ajoutée — équipe notifiée", "ok");
      setModal(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!modal?.id) return;
    try {
      await api(`/api/missions/${modal.id}`, "DELETE");
      toast("🗑️ Mission annulée — équipe notifiée", "ok");
      setModal(null);
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  const weekLabel = `${fmtFr(weekStart, { day: "numeric", month: "short" })} → ${fmtFr(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      <PageHead
        title="Planning hebdo" subtitle="Prise de poste au dépôt — trajets et retours calculés automatiquement."
        icon={<CalendarDays size={22} />}
        actions={
          <>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
              <option value="0">Toute l'équipe</option>
              {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))} title="Semaine précédente"><ChevronLeft size={16} /></Button>
            <Button variant="dark" onClick={() => setWeekStart(mondayOf(todayStr()))}>Aujourd'hui</Button>
            <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))} title="Semaine suivante"><ChevronRight size={16} /></Button>
          </>
        }
      />

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-coal">Semaine du {weekLabel}</p>
        <div className="flex items-center gap-3 text-xs text-steel">
          <span className="hidden sm:inline">Cliquez sur une case pour planifier · sur une mission pour la voir / la modifier</span>
          <a href="/feuille" className="inline-flex items-center gap-1 font-bold text-brand hover:underline"><Printer size={14} /> Feuille de route</a>
        </div>
      </div>

      {missions == null ? <Spinner /> : (
        <Card className="overflow-x-auto anim-fade-up">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-coal text-white">
                <th className="text-left px-3 py-2.5 font-display uppercase tracking-wider text-sm w-44 sticky left-0 bg-coal">Chauffeur</th>
                {days.map((d, i) => (
                  <th key={d} className={`px-2 py-2.5 text-center font-display uppercase tracking-wide text-sm ${d === today ? "bg-brand" : ""}`}>
                    {DAYS_FR[i]} <span className="font-mono text-xs opacity-80">{parseDate(d).getDate()}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shownUsers.map((u) => {
                const weekMs = missions.filter((m) => m.driverId === u.id && days.includes(m.date));
                const total = weekMs.reduce((a, m) => a + toMin(m.endTime) - toMin(m.startTime), 0);
                return (
                  <tr key={u.id} className="border-b border-gray-200 last:border-0 align-top">
                    <td className="px-3 py-2 sticky left-0 bg-white border-r border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold shrink-0" style={{ background: u.color }}>{initials(u.name)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{u.name}</p>
                          <p className="text-[10px] text-steel uppercase tracking-wide">{fmtDur(total)} / sem.</p>
                        </div>
                      </div>
                    </td>
                    {days.map((d) => {
                      const cell = missions.filter((m) => m.driverId === u.id && m.date === d).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
                      return (
                        <td key={d} className={`px-1.5 py-1.5 border-r border-gray-100 last:border-0 group/cell min-w-32 ${d === today ? "bg-brand/6" : ""}`}>
                          <div className="space-y-1.5">
                            {cell.map((m) => {
                              const c = cMap[m.chantierId];
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => openMission(m)}
                                  className="w-full text-left rounded-md border border-gray-200 bg-white hover:border-brand hover:shadow-md p-1.5 transition-all cursor-pointer relative overflow-hidden"
                                  style={{ borderLeftWidth: 4, borderLeftColor: c?.color ?? "#999" }}
                                >
                                  <p className="font-mono text-[11px] font-semibold leading-none">{m.startTime}–{m.endTime}
                                    {conflicts.has(m.id) && <TriangleAlert size={11} className="inline ml-1 text-amber-500" />}
                                  </p>
                                  <p className="text-[11.5px] font-bold leading-tight truncate mt-1">{c?.name ?? "?"}</p>
                                  <p className="text-[10px] text-steel truncate">{vMap[m.vehicleId]?.name ?? "?"}</p>
                                </button>
                              );
                            })}
                            <button
                              onClick={() => openCreate(d, u.id)}
                              className="w-full rounded-md border border-dashed border-gray-300 text-steel hover:border-brand hover:text-brand hover:bg-brand/5 py-1 text-xs font-bold sm:opacity-0 sm:group-hover/cell:opacity-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                              aria-label="Ajouter une mission"
                            >
                              <Plus size={12} /> Mission
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Légende chantiers */}
      <div className="flex flex-wrap gap-3 mt-3">
        {chantiers.filter((c) => c.active).map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 text-xs text-steel">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} /> {c.name} · {c.distanceKm} km
          </span>
        ))}
      </div>

      {/* Modale mission */}
      <Modal
        open={modal != null} onClose={() => setModal(null)} wide
        title={readOnly ? "Détail de la mission" : modal?.id ? "Modifier la mission" : "Nouvelle mission"}
        footer={readOnly ? <Button variant="ghost" onClick={() => setModal(null)}>Fermer</Button> : (
          <>
            {modal?.id && <Button variant="danger" onClick={() => setConfirmDel(true)} className="mr-auto"><Trash2 size={15} /> Annuler la mission</Button>}
            <Button variant="ghost" onClick={() => setModal(null)}>Fermer</Button>
            <Button onClick={save} disabled={busy}><Save size={15} /> {busy ? "Enregistrement…" : "Enregistrer & notifier"}</Button>
          </>
        )}
      >
        {modal && (
          <div className="space-y-4">
            {!readOnly && (
              <p className="text-xs text-steel bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                📢 Toute création / modification / annulation est <strong>automatiquement notifiée à tous les utilisateurs</strong>.
              </p>
            )}
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Date" required><Input type="date" value={modal.date} disabled={readOnly} onChange={(e) => setModal({ ...modal, date: e.target.value })} /></Field>
              <Field label="Chauffeur / grutier" required>
                <Select value={modal.driverId} disabled={readOnly} onChange={(e) => setModal({ ...modal, driverId: e.target.value })}>
                  {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </Field>
              <Field label="Véhicule" required>
                <Select value={modal.vehicleId} disabled={readOnly} onChange={(e) => setModal({ ...modal, vehicleId: e.target.value })}>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.plate}{v.status !== "disponible" ? ` (${v.status})` : ""}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Chantier" required>
              <Select value={modal.chantierId} disabled={readOnly} onChange={(e) => setModal({ ...modal, chantierId: e.target.value })}>
                {chantiers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.distanceKm} km / {c.travelMin} min</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Prise de poste (dépôt)" required><Input type="time" value={modal.startTime} disabled={readOnly} onChange={(e) => setModal({ ...modal, startTime: e.target.value })} /></Field>
              <Field label="Fin de service (dépôt)" required><Input type="time" value={modal.endTime} disabled={readOnly} onChange={(e) => setModal({ ...modal, endTime: e.target.value })} /></Field>
              <Field label="Conduite en + (min)" hint="rotations, navettes…"><Input type="number" min={0} value={modal.extraDrivingMin} disabled={readOnly} onChange={(e) => setModal({ ...modal, extraDrivingMin: e.target.value })} /></Field>
              <Field label="Tâche">
                <Select value={modal.task} disabled={readOnly} onChange={(e) => setModal({ ...modal, task: e.target.value })}>
                  {TASKS.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Consignes / notes">
              <Textarea value={modal.notes} disabled={readOnly} onChange={(e) => setModal({ ...modal, notes: e.target.value })} placeholder="Accès chantier, contact, sécurité, arrimage…" />
            </Field>

            {/* Aperçu trajets + RSE */}
            {preview && !preview.invalid && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="bg-coal text-white rounded px-2 py-1 font-mono">{modal.startTime} Dépôt</span>
                  <ArrowRight size={13} className="text-steel" />
                  <span className="text-steel">{preview.travel} min · {preview.km} km</span>
                  <ArrowRight size={13} className="text-steel" />
                  <span className="bg-brand text-white rounded px-2 py-1 font-mono">{preview.onSite} Sur site</span>
                  <ArrowRight size={13} className="text-steel" />
                  <span className="bg-brand/15 text-brand rounded px-2 py-1 font-mono">{preview.leaveSite} Fin chantier</span>
                  <ArrowRight size={13} className="text-steel" />
                  <span className="bg-coal text-white rounded px-2 py-1 font-mono">{modal.endTime} Retour dépôt</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge color="coal">Amplitude {fmtDur(preview.st.service)}</Badge>
                  <Badge color="coal">Conduite jour {fmtDur(preview.st.driving)}</Badge>
                  <Badge color="coal"><MapPin size={11} /> {preview.km * 2} km A/R</Badge>
                  {preview.vehicle && preview.vehicle.status !== "disponible" && <Badge color="red"><Truck size={11} /> Véhicule {preview.vehicle.status} !</Badge>}
                </div>
                {preview.issues.length > 0 && (
                  <div className="space-y-1.5">
                    {preview.issues.map((iss, i) => (
                      <p key={i} className={`text-xs font-semibold rounded px-2.5 py-1.5 border flex items-center gap-1.5 ${iss.level === "breach" ? "bg-red-50 border-red-300 text-red-700" : "bg-amber-50 border-amber-300 text-amber-700"}`}>
                        <TriangleAlert size={13} className="shrink-0" /> RSE : {iss.text}
                      </p>
                    ))}
                  </div>
                )}
                {cMap[Number(modal.chantierId)]?.contactPhone && (
                  <p className="text-xs text-steel flex items-center gap-1.5"><Phone size={12} /> Contact chantier : {cMap[Number(modal.chantierId)]?.contactName} — {cMap[Number(modal.chantierId)]?.contactPhone}</p>
                )}
              </div>
            )}
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </Modal>

      <Confirm
        open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={remove}
        title="Annuler cette mission"
        message="La mission sera supprimée du planning et TOUS les utilisateurs recevront un message d'annulation. Continuer ?"
        confirmLabel="Annuler la mission" danger
      />
    </div>
  );
}