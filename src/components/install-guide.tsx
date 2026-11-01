"use client";

import { useEffect, useState } from "react";
import { Smartphone, Apple, Monitor, QrCode, CheckCircle2, HelpCircle } from "lucide-react";

type Device = "android" | "iphone" | "pc";

type Step = {
  title: string;
  text: string;
  visual: React.ReactNode;
};

function PhoneMock({ menu }: { menu: "chrome" | "safari" | "qr" }) {
  return (
    <div className="w-full max-w-[190px] mx-auto">
      <div className="rounded-[22px] border-4 border-coal bg-white shadow-lg overflow-hidden">
        <div className="h-5 bg-coal flex items-center justify-center">
          <span className="w-10 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="px-2 py-2">
          <div className="h-6 rounded-full bg-gray-100 flex items-center px-2 mb-2">
            <span className="text-[8px] text-gray-500 font-mono truncate">votre-entreprise.com</span>
          </div>
          <div className="h-20 rounded-md bg-coal relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 hazard-thin" />
            <div className="p-2 pt-3">
              <div className="h-2 w-14 rounded bg-brand" />
              <div className="h-1.5 w-20 rounded bg-white/30 mt-1.5" />
              <div className="flex gap-1 mt-2">
                <span className="w-4 h-4 rounded-sm bg-white/15" />
                <span className="w-4 h-4 rounded-sm bg-white/15" />
                <span className="w-4 h-4 rounded-sm bg-white/15" />
                <span className="w-4 h-4 rounded-sm bg-white/15" />
              </div>
            </div>
          </div>

          {menu === "chrome" && (
            <div className="mt-2 border border-gray-200 rounded-md overflow-hidden shadow-md">
              {["Partager", "Ajouter à l'écran", "Installer l'application", "Traduire…"].map((x, i) => (
                <div key={x} className={`px-2 py-1.5 text-[8.5px] flex items-center gap-1.5 ${i === 2 ? "bg-brand text-white font-bold" : i < 2 ? "border-b border-gray-100 text-gray-700" : "text-gray-500"}`}>
                  {i === 2 && <CheckCircle2 size={9} />}{x}
                </div>
              ))}
            </div>
          )}

          {menu === "safari" && (
            <div className="mt-2 border border-gray-200 rounded-md overflow-hidden shadow-md">
              <div className="px-2 py-1.5 text-[8px] bg-gray-50 text-gray-500 border-b border-gray-100">Copier · Ajouter aux favoris</div>
              <div className="px-2 py-1.5 text-[8.5px] bg-brand text-white font-bold flex items-center gap-1.5"><CheckCircle2 size={9} /> Sur l'écran d'accueil</div>
              <div className="px-2 py-1.5 text-[8px] text-gray-500 border-t border-gray-100">Imprimer · Signaler un problème</div>
            </div>
          )}

          {menu === "qr" && (
            <div className="mt-2 border border-gray-200 rounded-md p-2 flex flex-col items-center">
              <QrCode size={34} className="text-coal" />
              <p className="text-[8px] text-gray-500 mt-1">Scanner avec l'appareil photo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InstallGuide() {
  const [device, setDevice] = useState<Device>("android");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setDevice("iphone");
    else if (/Android/i.test(ua)) setDevice("android");
    else setDevice("pc");
  }, []);

  const guides: Record<Device, { label: string; icon: React.ReactNode; note: string; steps: Step[] }> = {
    android: {
      label: "Téléphone Android",
      icon: <Smartphone size={17} />,
      note: "Samsung, Xiaomi, Oppo, Google Pixel… — navigateur Google Chrome (ou Samsung Internet).",
      steps: [
        {
          title: "Ouvrez le lien dans Google Chrome",
          text: "Cliquez sur le lien reçu par SMS, WhatsApp ou e-mail. S'il s'ouvre dans un autre navigateur, copiez-le et collez-le dans Chrome.",
          visual: <PhoneMock menu="qr" />,
        },
        {
          title: "Touchez les trois points ⋮ (menu)",
          text: "En haut à droite de l'écran Chrome, touchez le menu vertical ⋮ pour ouvrir les options.",
          visual: null,
        },
        {
          title: "Choisissez « Installer l'application »",
          text: "Dans la liste, touchez « Installer l'application » (parfois nommé « Ajouter à l'écran d'accueil »).",
          visual: <PhoneMock menu="chrome" />,
        },
        {
          title: "Confirmez « Installer »",
          text: "Une fenêtre demande confirmation : touchez « Installer ». L'icône orange de l'application apparaît sur votre écran d'accueil.",
          visual: null,
        },
        {
          title: "Ouvrez et entrez votre code",
          text: "L'appli s'ouvre en plein écran. Entrez votre code à 4 chiffres : le planning de l'équipe s'affiche.",
          visual: <PhoneMock menu="qr" />,
        },
      ],
    },
    iphone: {
      label: "iPhone / iPad",
      icon: <Apple size={17} />,
      note: "Impératif : utilisez le navigateur Safari (pas Chrome), sinon l'installation ne fonctionne pas.",
      steps: [
        {
          title: "Ouvrez le lien dans Safari",
          text: "Copiez le lien reçu et collez-le dans Safari. Si le lien s'ouvre dans une autre appli, touchez « Ouvrir dans Safari ».",
          visual: <PhoneMock menu="qr" />,
        },
        {
          title: "Touchez le bouton Partager (⬆ carré)",
          text: "En bas du milieu de Safari, le carré avec la flèche qui monte ⬆. C'est le bouton de partage.",
          visual: null,
        },
        {
          title: "Descendez et touchez « Sur l'écran d'accueil »",
          text: "Dans la liste qui apparaît, faites défiler puis touchez « Sur l'écran d'accueil » (icône + verte).",
          visual: <PhoneMock menu="safari" />,
        },
        {
          title: "Touchez « Ajouter » (en haut à droite)",
          text: "Vous pouvez renommer l'application. Touchez « Ajouter » : l'icône apparaît aussitôt sur votre écran d'accueil.",
          visual: null,
        },
        {
          title: "Ouvrez et entrez votre code",
          text: "L'appli s'ouvre en plein écran. Entrez votre code à 4 chiffres : le planning de l'équipe s'affiche.",
          visual: <PhoneMock menu="qr" />,
        },
      ],
    },
    pc: {
      label: "Ordinateur (PC / Mac)",
      icon: <Monitor size={17} />,
      note: "Google Chrome ou Microsoft Edge (Windows, Mac ou Linux).",
      steps: [
        {
          title: "Ouvrez le lien dans Chrome ou Edge",
          text: "Copiez le lien reçu et collez-le dans la barre d'adresse de votre navigateur.",
          visual: null,
        },
        {
          title: "Cliquez l'icône d'installation dans la barre d'adresse",
          text: "À droite de la barre d'adresse : une petite icône d'ordinateur ou de flèche ⬇. Si elle n'apparaît pas, ouvrez le menu du navigateur (⋮).",
          visual: null,
        },
        {
          title: "Cliquez « Installer »",
          text: "Une fenêtre de confirmation s'ouvre : cliquez « Installer ». L'application s'ouvre dans sa propre fenêtre, sans barre de navigateur.",
          visual: null,
        },
        {
          title: "L'icône est créée",
          text: "Vous la retrouvez dans le menu Démarrer (Windows) ou le Dock (Mac). Cliquez dessus à tout moment pour ouvrir le planning.",
          visual: null,
        },
        {
          title: "Entrez votre code",
          text: "Entrez votre code à 4 chiffres pour accéder au planning de l'équipe.",
          visual: null,
        },
      ],
    },
  };

  const g = guides[device];

  return (
    <div>
      {/* Choix de l'appareil */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(["android", "iphone", "pc"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDevice(d)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-display font-bold uppercase tracking-wide text-sm transition-all cursor-pointer ${
              device === d ? "bg-brand text-white shadow-md" : "bg-white border border-gray-300 text-gray-600 hover:border-brand hover:text-brand"
            }`}
          >
            {guides[d].icon}{guides[d].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-steel mb-5 flex items-center gap-1.5">
        <HelpCircle size={13} className="shrink-0" /> {g.note}
      </p>

      {/* Étapes */}
      <div className="space-y-3">
        {g.steps.map((s, i) => (
          <div key={i} className={`bg-white border border-gray-200 rounded-lg p-4 md:p-5 flex gap-4 items-start anim-fade-up delay-${Math.min(i + 1, 4)}`}>
            <span className="w-9 h-9 rounded-full bg-coal text-accent font-display font-extrabold text-lg flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg md:text-xl font-extrabold uppercase leading-tight">{s.title}</h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{s.text}</p>
            </div>
            {s.visual && <div className="w-[170px] shrink-0 hidden sm:block">{s.visual}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}


