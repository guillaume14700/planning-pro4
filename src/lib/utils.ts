/* Utilitaires isomorphes (client + serveur) */

export function toMin(hhmm: string): number {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function fmtDur(min: number): string {
  const sign = min < 0 ? "-" : "";
  const a = Math.abs(Math.round(min));
  return `${sign}${Math.floor(a / 60)}h${String(a % 60).padStart(2, "0")}`;
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayStr(): string {
  return dateStr(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

export function mondayOf(s: string): string {
  const d = parseDate(s);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return dateStr(d);
}

export function fmtFr(s: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!s) return "—";
  return parseDate(s).toLocaleDateString("fr-FR", opts ?? { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtFrLong(s: string): string {
  return fmtFr(s, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function fmtFrShort(s: string): string {
  return fmtFr(s, { weekday: "short", day: "numeric", month: "short" });
}

export function fmtDateTime(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) +
    " " + dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const VEHICLE_TYPES: Record<string, string> = {
  porteur: "Camion porteur",
  semi: "Semi-remorque",
  benne: "Benne TP",
  grue_mobile: "Grue mobile",
  camion_grue: "Camion-grue (auxiliaire)",
};

export const TASKS = [
  "Livraison matériaux",
  "Levage / grutage",
  "Rotation benne / évacuation",
  "Terrassement",
  "Transport d'engins",
  "Béton / toupie",
  "Montage / démontage grue",
  "Tâche libre / note de mission",
  "Formation / CACES",
  "Entretien / nettoyage véhicule",
  "Administratif",
  "Autre",
];

export const PALETTE = [
  "#F26A1B", "#0E7490", "#4D7C0F", "#B91C1C", "#7C3AED",
  "#0F766E", "#B45309", "#1D4ED8", "#BE185D", "#525252",
];

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}