"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useApp, api, MissionT, ModuleGate } from "@/components/app-provider";
import { Button, Card, PageHead, Spinner } from "@/components/ui";
import { addDays, mondayOf, todayStr, fmtFr, fmtDur, DAYS_FR, toMin, initials } from "@/lib/utils";

export default function HeuresPage() {
  return <ModuleGate k="heures"><Heures /></ModuleGate>;
}

function Heures() {
  const { users } = useApp();
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [missions, setMissions] = useState<MissionT[] | null>(null);
  const activeUsers = users.filter((u) => u.active);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    setMissions(null);
    setMissions(await api<MissionT[]>(`/api/missions?from=${weekStart}&to=${addDays(weekStart, 6)}`));
  }, [weekStart]);
  useEffect(() => { load().catch(() => setMissions([])); }, [load]);

  return (
    <div>
      <PageHead
        title="Heures de service" subtitle="Amplitudes journalières (prise de poste → fin de service) par chauffeur."
        icon={<Clock size={22} />}
        actions={<>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></Button>
          <Button variant="dark" onClick={() => setWeekStart(mondayOf(todayStr()))}>Cette semaine</Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></Button>
          <Button variant="outline" onClick={() => window.print()}><Printer size={16} /> Imprimer</Button>
        </>}
      />
      <p className="font-display text-lg font-bold uppercase tracking-wide mb-4">Semaine du {fmtFr(weekStart)} au {fmtFr(addDays(weekStart, 6))}</p>
      {missions == null ? <Spinner /> : (
        <Card className="overflow-x-auto print-area anim-fade-up">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-coal text-white">
                <th className="text-left px-4 py-2.5 font-display uppercase tracking-wider text-sm">Chauffeur</th>
                {days.map((d, i) => (
                  <th key={d} className={`px-2 py-2.5 text-center font-display uppercase text-sm ${d === todayStr() ? "bg-brand" : ""}`}>{DAYS_FR[i]} {fmtFr(d, { day: "2-digit", month: "2-digit" })}</th>
                ))}
                <th className="px-3 py-2.5 text-center font-display uppercase text-sm text-accent">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) => {
                let total = 0;
                return (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-bold">
                        <span className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: u.color }}>{initials(u.name)}</span>
                        {u.name}
                      </span>
                    </td>
                    {days.map((d) => {
                      const ms = missions.filter((m) => m.driverId === u.id && m.date === d);
                      if (ms.length === 0) return <td key={d} className="px-2 py-3 text-center text-gray-300">—</td>;
                      const start = Math.min(...ms.map((m) => toMin(m.startTime)));
                      const end = Math.max(...ms.map((m) => toMin(m.endTime)));
                      total += end - start;
                      const over = end - start > 10 * 60;
                      return (
                        <td key={d} className={`px-2 py-3 text-center font-mono text-xs font-semibold ${over ? "text-amber-600" : ""}`}>
                          {fmtDur(end - start)}
                          <span className="block text-[9px] text-steel font-sans">{ms.length} mission{ms.length > 1 ? "s" : ""}</span>
                        </td>
                      );
                    })}
                    <td className={`px-3 py-3 text-center font-display font-extrabold text-lg ${total > 48 * 60 ? "text-red-600" : total > 44 * 60 ? "text-amber-600" : "text-coal"}`}>{fmtDur(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-xs text-steel mt-3">Repères directive 2002/15/CE : 48h/semaine en moyenne (4 mois), 60h maximum ponctuel. Voir le module RSE pour la conduite.</p>
    </div>
  );
}
