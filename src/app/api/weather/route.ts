import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* Open-Meteo — gratuit, sans clé API. Cache 30 min. */
export async function GET(req: NextRequest) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const lat = Number(req.nextUrl.searchParams.get("lat") ?? 45.7);
  const lon = Number(req.nextUrl.searchParams.get("lon") ?? 4.9);
  if (isNaN(lat) || isNaN(lon)) return Response.json({ error: "Coordonnées invalides" }, { status: 400 });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=Europe%2FParis&forecast_days=4`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error("open-meteo");
    const data = await res.json();
    return Response.json(data.daily ?? {});
  } catch {
    return Response.json({ error: "Météo indisponible (connexion extérieure)." }, { status: 502 });
  }
}