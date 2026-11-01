import type { MetadataRoute } from "next";
import { getSettingsSafe } from "@/lib/server";

export const dynamic = "force-dynamic";

/* Manifest PWA dynamique : reprend le nom et les couleurs personnalisés par l'admin. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettingsSafe();
  return {
    name: `${s.appName} — ${s.companyName}`,
    short_name: s.appName,
    description: "Planning chauffeurs PL & grutiers : chantiers, RSE, alertes panne et messagerie d'équipe.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#16191e",
    theme_color: s.primaryColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}