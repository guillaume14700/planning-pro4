"use client";

import { useCallback, useEffect, useState } from "react";
import { Printer, MapPin, Phone, Truck, FileText } from "lucide-react";
import { useApp, api, MissionT, ModuleGate } from "@/components/app-provider";
import { Button, Card, Field, Input, PageHead, Select, Spinner, Empty } from "@/components/ui";
import { todayStr, fmtFrLong, toMin, toHHMM, fmtDur, VEHICLE_TYPES } from "@/lib/utils";

export default function FeuillePage() {
  return <ModuleGate k="feuille"><Feuille /></ModuleGate>;
}

function Feuille() {
  const { me, users, chantiers, vehicles, settings } = useApp();
  const [date, setDate] = useState(todayStr());
  const [driver, setDriver] = useState(String(me.id));
  const [missions, setMissions] = useState<MissionT[] | null>(null);

  const load = useCallback(async () => {
    setMissions(null);
    const data = await api<MissionT[]>(`/api/missions?from=${date}&to=${date}&driverId=${driver}`);
    setMissions(data.sort((a, b) => toMin(a.startTime) - toMin(b.startTime)));
  }, [date, driver]);
  useEffect(() => { load().catch(() => setMissions([])); }, [load]);

  const u = users.find((x) => x.id === Number(driver));
  const totalKm = (missions ?? []).reduce((a, m) => a + (chantiers.find((c) => c.id === m.chantierId)?.distanceKm ?? 0) * 2, 0);
  const totalService = (missions ?? []).reduce((a, m) => a + toMin(m.endTime) - toMin(m.startTime), 0);

  return (
    <div>
      <div className="no-print">
        <PageHead
          title="Feuille de route" subtitle="Feuille de mission du jour, prête à imprimer pour la cabine."
          icon={<Printer size={22} />}
          actions={<Button onClick={() => window.print()} disabled={!missions?.length}><Printer size={16} /> Imprimer</Button>}
        />
        <Card className="p-4 mb-5 flex flex-wrap gap-3 items-end">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Chauffeur / grutier">
            <Select value={driver} onChange={(e) => setDriver(e.target.value)} className="w-52">
              {users.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
          </Field>
        </Card>
      </div>

      {missions == null ? <Spinner /> : missions.length === 0 ? (
        <Card className="no-print"><Empty text="Aucune mission ce jour pour ce chauffeur." icon={<FileText size={28} />} /></Card>
      ) : (
        <div className="print-area bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8 anim-fade-up">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-4 border-coal">
            <div className="flex items-center gap-3">
              {settings.logoData ? (
                <img src={settings.logoData} alt="Logo" className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-brand flex items-center justify-center"><Truck size={26} className="text-white" /></div>
              )}
              <div>
                <p className="font-display text-2xl font-extrabold uppercase leading-none">{settings.companyName}</p>
                <p className="text-xs text-steel mt-1">{settings.depotName} — {settings.depotAddress}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-extrabold uppercase text-brand">Feuille de route</p>
              <p className="text-sm font-bold capitalize">{fmtFrLong(date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 text-sm border-b border-gray-200">
            <div><p className="text-[10px] uppercase font-bold text-steel">Chauffeur</p><p className="font-bold">{u?.name}</p><p className="text-xs text-steel">{u?.job}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-steel">Missions</p><p className="font-display text-2xl font-extrabold">{missions.length}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-steel">Km A/R estimés</p><p className="font-display text-2xl font-extrabold">{Math.round(totalKm)} km</p></div>
            <div><p className="text-[10px] uppercase font-bold text-steel">Amplitude totale</p><p className="font-display text-2xl font-extrabold">{fmtDur(totalService)}</p></div>
          </div>

          {/* Missions */}
          <div className="divide-y divide-gray-200">
            {missions.map((m, idx) => {
              const c = chantiers.find((x) => x.id === m.chantierId);
              const v = vehicles.find((x) => x.id === m.vehicleId);
              const travel = c?.travelMin ?? 0;
              return (
                <div key={m.id} className="py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-md bg-coal text-accent font-display font-extrabold flex items-center justify-center">{idx + 1}</span>
                    <h3 className="font-display text-xl font-extrabold uppercase">{c?.name ?? "Chantier"}</h3>
                    <span className="text-sm text-steel">— {m.task}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {[
                      { l: "Départ dépôt", t: m.startTime },
                      { l: "Arrivée chantier", t: toHHMM(toMin(m.startTime) + travel) },
                      { l: "Fin chantier", t: toHHMM(toMin(m.endTime) - travel) },
                      { l: "Retour dépôt", t: m.endTime },
                    ].map((x) => (
                      <div key={x.l} className="border border-gray-300 rounded-md px-3 py-2">
                        <p className="text-[9px] uppercase font-bold text-steel">{x.l}</p>
                        <p className="font-mono font-semibold text-lg">{x.t}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 text-steel shrink-0" /><span><strong>Chantier :</strong> {c?.address || "—"} · {c?.distanceKm ?? "?"} km / {travel} min</span></p>
                    <p className="flex items-start gap-1.5"><Phone size={14} className="mt-0.5 text-steel shrink-0" /><span><strong>Contact :</strong> {c?.contactName || "—"} {c?.contactPhone ? `· ${c.contactPhone}` : ""}</span></p>
                    <p className="flex items-start gap-1.5"><Truck size={14} className="mt-0.5 text-steel shrink-0" /><span><strong>Véhicule :</strong> {v?.name} · {v?.plate} ({VEHICLE_TYPES[v?.type ?? ""] ?? "—"})</span></p>
                    {m.notes && <p className="flex items-start gap-1.5"><FileText size={14} className="mt-0.5 text-steel shrink-0" /><span><strong>Consignes :</strong> {m.notes}</span></p>}
                  </div>
                  {c?.notes && <p className="text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 mt-2"><strong>Accès / sécurité :</strong> {c.notes}</p>}
                </div>
              );
            })}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-6 mt-2 border-t border-gray-300">
            <div><p className="text-[10px] uppercase font-bold text-steel mb-8">Signature chauffeur</p><div className="border-b border-gray-400" /></div>
            <div><p className="text-[10px] uppercase font-bold text-steel mb-8">Visa responsable / client</p><div className="border-b border-gray-400" /></div>
          </div>
          <p className="text-[10px] text-steel mt-4">Document généré par {settings.appName} — respecter la RSE (pause 45 min après 4h30 de conduite). Km réels à reporter au chronotachygraphe.</p>
        </div>
      )}
    </div>
  );
}
