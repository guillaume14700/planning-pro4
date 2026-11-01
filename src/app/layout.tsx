import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getSettingsSafe } from "@/lib/server";
import { PWARegister } from "@/components/pwa";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettingsSafe();
  return {
    title: `${s.appName} — Planning chauffeurs PL & grutiers`,
    description: "Planning chantiers BTP, réglementation RSE, alertes panne et gestion d'équipe.",
    applicationName: s.appName,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: s.appName },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await getSettingsSafe();
  return { themeColor: s.primaryColor, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettingsSafe();
  return (
    <html lang="fr">
      <body
        className="font-sans antialiased"
        style={{ "--brand": s.primaryColor, "--accent": s.accentColor } as React.CSSProperties}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  );
}