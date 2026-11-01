"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "./ui";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/* Capture au plus tôt (avant le montage React) de l'événement d'installation */
let deferred: BIPEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    window.dispatchEvent(new Event("pwa-installable"));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    window.dispatchEvent(new Event("pwa-installable"));
  });
}

export function useInstallable() {
  const [can, setCan] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const check = () => {
      setCan(!!deferred);
      setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    };
    check();
    window.addEventListener("pwa-installable", check);
    return () => window.removeEventListener("pwa-installable", check);
  }, []);
  async function install(): Promise<boolean> {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    setCan(false);
    return choice.outcome === "accepted";
  }
  return { can, installed, install };
}

/** Enregistre le service worker (installabilité + page hors-ligne). */
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

/** Bouton d'installation (Chrome / Edge / Android). Sinon, guide manuel affiché à côté. */
export function InstallButton() {
  const { can, installed, install } = useInstallable();
  const [done, setDone] = useState(false);
  if (installed || done) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        <CheckCircle2 size={16} /> Application installée sur cet appareil
      </p>
    );
  }
  if (can) {
    return (
      <Button onClick={async () => { if (await install()) setDone(true); }}>
        <Download size={16} /> Installer l'application
      </Button>
    );
  }
  return (
    <p className="text-xs text-steel bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      💡 Bouton automatique indisponible sur ce navigateur (souvent iPhone/Safari) : suivez le guide ci-dessous, c'est aussi simple.
    </p>
  );
}

/** Entrée « Installer l'application » dans le menu utilisateur — visible seulement si installable. */
export function InstallMenuItem({ onDone }: { onDone?: () => void }) {
  const { can, install } = useInstallable();
  if (!can) return null;
  return (
    <button
      onClick={async () => { await install(); onDone?.(); }}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand/5 text-brand font-semibold cursor-pointer"
    >
      <Download size={15} /> Installer l'application
    </button>
  );
}