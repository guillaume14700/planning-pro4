/* Calculs RSE — Réglementation Sociale Européenne (règl. CE 561/2006 + directive 2002/15/CE)
   Isomorphe : utilisé côté serveur et dans l'UI. */

import { toMin } from "./utils";

export const RSE_LIMITS = {
  driveDay: 9 * 60, // conduite journalière 9h
  driveDayExtended: 10 * 60, // 10h max 2x / semaine
  driveWeek: 56 * 60,
  driveTwoWeeks: 90 * 60,
  driveContinuous: 4 * 60 + 30, // 4h30 sans pause
  breakMin: 45, // pause 45 min (fractionnable 15 + 30)
  restDay: 11 * 60, // repos journalier 11h
  restDayReduced: 9 * 60,
  amplitudeMax: 13 * 60, // amplitude indicative (12h + pauses)
  workWeekMax: 60 * 60, // directive temps de travail
  workWeekAvg: 48 * 60,
};

export type MissionLike = {
  id?: number;
  date: string;
  driverId: number;
  startTime: string;
  endTime: string;
  extraDrivingMin?: number | null;
  travelMin?: number; // trajet aller chantier (min)
};

export type DayStats = {
  date: string;
  driving: number; // minutes de conduite
  service: number; // amplitude totale
  work: number; // temps de travail (amplitude - pauses)
  firstStart: number | null;
  lastEnd: number | null;
  maxGap: number; // plus grande coupure dans la journée
  missions: number;
};

export function dayStats(ms: MissionLike[]): DayStats {
  if (ms.length === 0)
    return { date: "", driving: 0, service: 0, work: 0, firstStart: null, lastEnd: null, maxGap: 0, missions: 0 };
  const sorted = [...ms].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const first = toMin(sorted[0]!.startTime);
  const last = Math.max(...sorted.map((m) => toMin(m.endTime)));
  let driving = 0;
  let occupied = 0;
  let maxGap = 0;
  let cursor = first;
  for (const m of sorted) {
    const s = toMin(m.startTime);
    const e = toMin(m.endTime);
    driving += (m.travelMin ?? 0) * 2 + (m.extraDrivingMin ?? 0);
    if (s > cursor) maxGap = Math.max(maxGap, s - cursor);
    occupied += Math.max(0, e - Math.max(s, cursor));
    cursor = Math.max(cursor, e);
  }
  const service = last - first;
  return {
    date: sorted[0]!.date,
    driving,
    service,
    work: occupied,
    firstStart: first,
    lastEnd: last,
    maxGap,
    missions: sorted.length,
  };
}

export type Issue = { level: "warn" | "breach"; text: string };

export function dayIssues(st: DayStats): Issue[] {
  const out: Issue[] = [];
  if (st.missions === 0) return out;
  if (st.driving > RSE_LIMITS.driveDayExtended)
    out.push({ level: "breach", text: `Conduite ${fmt(st.driving)} > 10h — plafond absolu dépassé` });
  else if (st.driving > RSE_LIMITS.driveDay)
    out.push({ level: "warn", text: `Conduite ${fmt(st.driving)} > 9h — extension 10h max 2 fois/semaine` });
  if (st.driving > RSE_LIMITS.driveContinuous && st.maxGap < RSE_LIMITS.breakMin)
    out.push({ level: "breach", text: `Plus de 4h30 de conduite sans pause de 45 min détectée` });
  if (st.service > RSE_LIMITS.amplitudeMax)
    out.push({ level: "warn", text: `Amplitude ${fmt(st.service)} — vérifier repos et coupures` });
  return out;
}

export function restIssue(prevEnd: number | null, nextStart: number | null): Issue | null {
  if (prevEnd == null || nextStart == null) return null;
  const rest = 24 * 60 - prevEnd + nextStart;
  if (rest < RSE_LIMITS.restDayReduced)
    return { level: "breach", text: `Repos journalier ${fmt(rest)} < 9h — infraction` };
  if (rest < RSE_LIMITS.restDay)
    return { level: "warn", text: `Repos réduit ${fmt(rest)} (< 11h) — 3 max entre deux repos hebdo` };
  return null;
}

export type WeekStats = {
  driving: number;
  work: number;
  extendedDays: number;
  days: DayStats[];
};

export function weekStats(byDay: DayStats[]): WeekStats {
  return {
    driving: byDay.reduce((a, d) => a + d.driving, 0),
    work: byDay.reduce((a, d) => a + d.work, 0),
    extendedDays: byDay.filter((d) => d.driving > RSE_LIMITS.driveDay).length,
    days: byDay,
  };
}

export function weekIssues(w: WeekStats, prevWeekDriving: number): Issue[] {
  const out: Issue[] = [];
  if (w.driving > RSE_LIMITS.driveWeek)
    out.push({ level: "breach", text: `Conduite hebdo ${fmt(w.driving)} > 56h` });
  else if (w.driving > RSE_LIMITS.driveWeek - 4 * 60)
    out.push({ level: "warn", text: `Conduite hebdo ${fmt(w.driving)} — proche de la limite 56h` });
  if (w.driving + prevWeekDriving > RSE_LIMITS.driveTwoWeeks)
    out.push({ level: "breach", text: `Conduite sur 2 semaines ${fmt(w.driving + prevWeekDriving)} > 90h` });
  if (w.extendedDays > 2)
    out.push({ level: "breach", text: `${w.extendedDays} journées à plus de 9h de conduite (2 max/semaine)` });
  if (w.work > RSE_LIMITS.workWeekMax)
    out.push({ level: "breach", text: `Temps de travail hebdo ${fmt(w.work)} > 60h` });
  else if (w.work > RSE_LIMITS.workWeekAvg)
    out.push({ level: "warn", text: `Temps de travail ${fmt(w.work)} > 48h — moyenne à compenser sur 4 mois` });
  return out;
}

function fmt(min: number): string {
  const a = Math.round(min);
  return `${Math.floor(a / 60)}h${String(a % 60).padStart(2, "0")}`;
}

export const RSE_MEMO = [
  { title: "Conduite continue", rule: "4h30 maximum, puis pause de 45 min (fractionnable 15 min + 30 min)." },
  { title: "Conduite journalière", rule: "9h par jour, extensible à 10h deux fois par semaine." },
  { title: "Conduite hebdomadaire", rule: "56h maximum sur une semaine, 90h sur deux semaines consécutives." },
  { title: "Repos journalier", rule: "11h consécutives, réductible à 9h (3 fois max entre deux repos hebdomadaires)." },
  { title: "Repos hebdomadaire", rule: "45h consécutives, réductible à 24h sous conditions de compensation." },
  { title: "Temps de travail (2002/15/CE)", rule: "48h en moyenne sur 4 mois, 60h maximum sur une semaine isolée." },
  { title: "Chronotachygraphe", rule: "Carte conducteur obligatoire, enregistrement des temps et respect des modes (conduite, travail, disponibilité, repos)." },
];