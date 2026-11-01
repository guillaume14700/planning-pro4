import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* Services gratuits sans clé API :
   - ?q=ADRESSE            → géocodage Nominatim (OpenStreetMap) : lat/lon d'une adresse
   - ?from=lat,lon&to=lat,lon → itinéraire OSRM : distance km + durée estimée (profil routier) */

export async function GET(req: NextRequest) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const sp = req.nextUrl.searchParams;

  const q = sp.get("q");
  if (q) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": "PLanningPro-BTP/1.0 (gestion chantiers)" }, next: { revalidate: 86400 } }
      );
      if (!res.ok) throw new Error("nominatim");
      const arr = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (!arr.length) {
        // nouvelle tentative sans restriction pays (adresses hors France)
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { "User-Agent": "PLanningPro-BTP/1.0 (gestion chantiers)" }, next: { revalidate: 86400 } }
        );
        const arr2 = (await res2.json()) as { lat: string; lon: string; display_name: string }[];
        if (!arr2.length) return Response.json({ error: "Adresse introuvable. Précisez le numéro, la ville et le code postal." }, { status: 404 });
        return Response.json({ lat: Number(arr2[0]!.lat), lon: Number(arr2[0]!.lon), displayName: arr2[0]!.display_name });
      }
      return Response.json({ lat: Number(arr[0]!.lat), lon: Number(arr[0]!.lon), displayName: arr[0]!.display_name });
    } catch {
      return Response.json({ error: "Service de carte momentanément indisponible. Réessayez dans quelques secondes." }, { status: 502 });
    }
  }

  const from = sp.get("from");
  const to = sp.get("to");
  if (from && to) {
    const [flat, flon] = from.split(",").map(Number);
    const [tlat, tlon] = to.split(",").map(Number);
    if ([flat, flon, tlat, tlon].some((v) => v == null || isNaN(v)))
      return Response.json({ error: "Coordonnées invalides (format attendu : lat,lon)." }, { status: 400 });
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${flon},${flat};${tlon},${tlat}?overview=false`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error("osrm");
      const d = (await res.json()) as { routes?: { distance: number; duration: number }[] };
      const r = d.routes?.[0];
      if (!r) return Response.json({ error: "Itinéraire introuvable entre ces deux points." }, { status: 404 });
      return Response.json({
        distanceKm: Math.round(r.distance / 100) / 10,
        travelMin: Math.max(1, Math.round(r.duration / 60)),
      });
    } catch {
      return Response.json({ error: "Calcul d'itinéraire momentanément indisponible. Réessayez." }, { status: 502 });
    }
  }

  return Response.json({ error: "Paramètres manquants (?q=adresse ou ?from=lat,lon&to=lat,lon)." }, { status: 400 });
}
