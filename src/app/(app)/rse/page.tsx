"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gauge, ChevronLeft, ChevronRight, TriangleAlert, CheckCircle2, BookOpen, Moon } from "lucide-react";
import { useApp, api, MissionT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, PageHead, Select, Spinner } from "@/components/ui";
import { addDays, mondayOf, todayStr, fmtFr, fmtDur, DAYS_FR, toMin } from "@/lib/utils";
import { dayStats, dayIssues, weekStats, weekIssues, restIssue, RSE_LIMITS, RSE_MEMO, MissionLike, Issue } from "@/lib/rse";

function Bar({ value, max, warn }: { value: number; max: number; warn?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  const near = warn != null && value > warn && !over;
  return (
    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-600" : near ? "bg-amber-500" : "bg-green-600"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function RsePage() {
  return <ModuleGate k="rse"><Rse /></ModuleGate>;
}

function Rse() {
  const { me, users, chantiers } = useApp();
  const activeUsers = users.filter((u) => u.active);
  const [driver, setDriver] = useState(String(me.id));
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [missions, setMissions] = useState<MissionT[] | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);

  const cMap = useMemo(() => Object.fromEntries(chantiers.map((c) => [c.id, c])), [chantiers]);

  const load = useCallback(async () => {
    setMissions(null);
    const data = await api<MissionT[]>(`/api/missions?from=${addDays(weekStart, -7)}&to=${addDays(weekStart, 6)}&driverId=${driver}`);
    setMissions(data);
  }, [weekStart, driver]);
  useEffect(() => { load().catch(() => setMissions([])); }, [load]);

  const toLike = useCallback((m: MissionT): MissionLike => ({ ...m, travelMin: (m.chantierId ? cMap[m.chantierId]?.travelMin : 0) ?? 0 }), [cMap]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayData = useMemo(() => {
    if (!missions) return [];
    return days.map((d) => {
      const ms = missions.filter((m) => m.date === d).map(toLike);
      const st = dayStats(ms);
      return { date: d, st, issues: dayIssues(st) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions, weekStart, toLike]);

  const week = useMemo(() => weekStats(dayData.map((d) => d.st)), [dayData]);
  const prevWeekDriving = useMemo(() => {
    if (!missions) return 0;
    return missions.filter((m) => m.date < weekStart).map(toLike).reduce((a, m) => a + (m.travelMin ?? 0) * 2 + (m.extraDrivingMin ?? 0), 0);
  }, [missions, weekStart, toLike]);
  const wIssues = useMemo(() => weekIssues(week, prevWeekDriving), [week, prevWeekDriving]);

  const rests = useMemo(() => {
    const out: { date: string; issue: Issue }[] = [];
    for (let i = 1; i < dayData.length; i++) {
      const prev = dayData[i - 1]!, cur = dayData[i]!;
      const iss = restIssue(prev.st.lastEnd, cur.st.firstStart);
      if (iss && cur.st.missions > 0) out.push({ date: cur.date, issue: iss });
    }
    return out;
  }, [dayData]);

  const allIssues = [...wIssues, ...dayData.flatMap((d) => d.issues.map((i) => ({ ...i, text: `${fmtFr(d.date)} — ${i.text}` }))), ...rests.map((r) => ({ ...r.issue, text: `${fmtFr(r.date)} — ${r.issue.text}` }))];

  return (
    <div>
      <PageHead
        title="Réglementation RSE" subtitle="Contrôle des temps de conduite, amplitude et repos — règl. CE 561/2006 & directive 2002/15/CE."
        icon={<Gauge size={22} />}
        actions={<>
          <Select value={driver} onChange={(e) => setDriver(e.target.value)} className="w-44">
            {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></Button>
          <Button variant="dark" onClick={() => setWeekStart(mondayOf(todayStr()))}>Cette semaine</Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></Button>
        </>}
      />
      <p className="font-display text-lg font-bold uppercase tracking-wide mb-4">Semaine du {fmtFr(weekStart)} au {fmtFr(addDays(weekStart, 6))}</p>

      {missions == null ? <Spinner /> : (
        <div className="space-y-5">
          {/* Compteurs hebdo */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className="p-4 anim-fade-up delay-1">
              <p className="text-[11px] uppercase font-bold tracking-wider text-steel mb-1">Conduite semaine <span className="text-coal">/ 56h</span></p>
              <p className="font-display text-3xl font-extrabold mb-2">{fmtDur(week.driving)}</p>
              <Bar value={week.driving} max={RSE_LIMITS.driveWeek} warn={RSE_LIMITS.driveWeek - 240} />
            </Card>
            <Card className="p-4 anim-fade-up delay-2">
              <p className="text-[11px] uppercase font-bold tracking-wider text-steel mb-1">Conduite 2 semaines <span className="text-coal">/ 90h</span></p>
              <p className="font-display text-3xl font-extrabold mb-2">{fmtDur(week.driving + prevWeekDriving)}</p>
              <Bar value={week.driving + prevWeekDriving} max={RSE_LIMITS.driveTwoWeeks} warn={RSE_LIMITS.driveTwoWeeks - 360} />
            </Card>
            <Card className="p-4 anim-fade-up delay-3">
              <p className="text-[11px] uppercase font-bold tracking-wider text-steel mb-1">Travail semaine <span className="text-coal">/ 48h moy · 60h max</span></p>
              <p className="font-display text-3xl font-extrabold mb-2">{fmtDur(week.work)}</p>
              <Bar value={week.work} max={RSE_LIMITS.workWeekMax} warn={RSE_LIMITS.workWeekAvg} />
            </Card>
            <Card className="p-4 anim-fade-up delay-4">
              <p className="text-[11px] uppercase font-bold tracking-wider text-steel mb-1">Journées &gt; 9h conduite <span className="text-coal">/ 2 max</span></p>
              <p className={`font-display text-3xl font-extrabold mb-2 ${week.extendedDays > 2 ? "text-red-600" : ""}`}>{week.extendedDays} <span className="text-base text-steel">/ 2</span></p>
              <Bar value={week.extendedDays} max={2} warn={1} />
            </Card>
          </div>

          {/* Détail par jour */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {dayData.map((d, i) => (
              <Card key={d.date} className={`p-3.5 ${d.date === todayStr() ? "ring-2 ring-brand/50" : ""}`}>
                <p className="font-display uppercase font-bold text-sm">{DAYS_FR[i]} <span className="text-steel font-mono text-xs">{fmtFr(d.date, { day: "2-digit", month: "2-digit" })}</span></p>
                {d.st.missions === 0 ? (
                  <p className="text-xs text-steel mt-3 flex items-center gap-1"><Moon size={12} /> Repos</p>
                ) : (
                  <div className="mt-2 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-steel"><span>Conduite</span><span className={d.st.driving > RSE_LIMITS.driveDay ? "text-amber-600" : ""}>{fmtDur(d.st.driving)}</span></div>
                      <Bar value={d.st.driving} max={RSE_LIMITS.driveDayExtended} warn={RSE_LIMITS.driveDay} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase text-steel"><span>Amplitude</span><span>{fmtDur(d.st.service)}</span></div>
                      <Bar value={d.st.service} max={RSE_LIMITS.amplitudeMax} warn={RSE_LIMITS.amplitudeMax - 120} />
                    </div>
                    <p className="text-[10px] text-steel font-mono">{d.st.firstStart != null ? `${Math.floor(d.st.firstStart / 60)}h${String(d.st.firstStart % 60).padStart(2, "0")} → ${Math.floor((d.st.lastEnd ?? 0) / 60)}h${String((d.st.lastEnd ?? 0) % 60).padStart(2, "0")}` : ""}</p>
                    {d.issues.length > 0 ? <Badge color={d.issues.some((x) => x.level === "breach") ? "red" : "amber"}><TriangleAlert size={10} /> {d.issues.length} alerte{d.issues.length > 1 ? "s" : ""}</Badge> : <Badge color="green"><CheckCircle2 size={10} /> OK</Badge>}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Anomalies */}
          <Card className="p-5">
            <h2 className="font-display text-xl font-extrabold uppercase mb-3">Analyse de conformité</h2>
            {allIssues.length === 0 ? (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 size={16} /> Aucune anomalie RSE détectée sur cette semaine d'après le planning.
              </p>
            ) : (
              <div className="space-y-2">
                {allIssues.map((iss, i) => (
                  <p key={i} className={`text-sm font-semibold rounded-md px-3 py-2 border flex items-start gap-2 ${iss.level === "breach" ? "bg-red-50 border-red-300 text-red-700" : "bg-amber-50 border-amber-300 text-amber-700"}`}>
                    <TriangleAlert size={15} className="shrink-0 mt-0.5" /> {iss.text}
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-steel mt-3">⚠️ Estimation basée sur le planning (trajets dépôt ↔ chantier + conduite déclarée). Le chronotachygraphe fait foi.</p>
          </Card>

          {/* Mémo réglementaire */}
          <Card className="overflow-hidden">
            <button onClick={() => setMemoOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="font-display text-xl font-extrabold uppercase flex items-center gap-2"><BookOpen size={18} className="text-brand" /> Mémo réglementation transport PL</span>
              <span className="text-brand font-bold text-sm">{memoOpen ? "Replier ▲" : "Déplier ▼"}</span>
            </button>
            {memoOpen && (
              <div className="px-5 pb-5 grid md:grid-cols-2 gap-3 anim-fade-up">
                {RSE_MEMO.map((m) => (
                  <div key={m.title} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <p className="font-bold text-sm">{m.title}</p>
                    <p className="text-xs text-steel mt-1">{m.rule}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
