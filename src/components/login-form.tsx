"use client";

import { useEffect, useState } from "react";
import { Delete, KeyRound, Loader2, LogIn, Truck, ChevronDown, Smartphone, Rocket } from "lucide-react";

export default function LoginForm({ appName, companyName, logoData }: { appName: string; companyName: string; logoData: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  async function submit(value?: string) {
    const c = value ?? code;
    if (c.length < 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", code: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de connexion");
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setShake(true);
      setTimeout(() => setShake(false), 550);
      setCode("");
      setBusy(false);
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setCode((c) => (c.length < 8 ? c + e.key : c));
      else if (e.key === "Backspace") setCode((c) => c.slice(0, -1));
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, busy]);

  return (
    <div className="w-full max-w-sm anim-fade-up">
      <div className="flex items-center gap-3 mb-8">
        {logoData ? (
          <img src={logoData} alt="Logo entreprise" className="w-14 h-14 rounded-lg object-contain bg-white p-1" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <Truck size={30} className="text-white" />
          </div>
        )}
        <div>
          <div className="font-display text-3xl font-extrabold uppercase leading-none">{appName}</div>
          <div className="text-sm text-gray-400">{companyName}</div>
        </div>
      </div>

      <div className={`bg-coal-2/80 border border-white/10 rounded-xl p-6 shadow-2xl ${shake ? "anim-shake" : ""}`}>
        <div className="hazard-thin h-1.5 -mx-6 -mt-6 mb-6 rounded-t-xl" />
        <div className="flex items-center gap-2 text-accent mb-1">
          <KeyRound size={16} />
          <span className="font-display uppercase font-bold tracking-widest text-sm">Accès par code</span>
        </div>
        <p className="text-sm text-gray-400 mb-5">Saisissez votre code personnel fourni par l'administrateur.</p>

        <div className="flex justify-center gap-2.5 mb-6 h-4" aria-label="Code saisi">
          {Array.from({ length: Math.max(4, code.length) }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${i < code.length ? "bg-accent border-accent scale-110" : "border-gray-600"}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => setCode((c) => (c.length < 8 ? c + d : c))}
              className="h-14 rounded-lg bg-white/5 border border-white/10 font-display text-2xl font-bold hover:bg-brand hover:border-brand hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setCode((c) => c.slice(0, -1))}
            className="h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            aria-label="Effacer"
          >
            <Delete size={22} />
          </button>
          <button
            onClick={() => setCode((c) => (c.length < 8 ? c + "0" : c))}
            className="h-14 rounded-lg bg-white/5 border border-white/10 font-display text-2xl font-bold hover:bg-brand hover:border-brand active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            onClick={() => submit()}
            disabled={code.length < 4 || busy}
            className="h-14 rounded-lg bg-brand text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            aria-label="Valider le code"
          >
            {busy ? <Loader2 size={22} className="animate-spin" /> : <LogIn size={22} />}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">{error}</p>}
      </div>

      <details className="mt-5 text-sm text-gray-400 group">
        <summary className="cursor-pointer flex items-center gap-1.5 hover:text-gray-200 select-none">
          <ChevronDown size={15} className="group-open:rotate-180 transition-transform" />
          Codes de démonstration
        </summary>
        <div className="mt-2 bg-white/5 border border-white/10 rounded-lg p-3 space-y-1 font-mono text-xs">
          <p><span className="text-accent">2468</span> — Administrateur principal (vous)</p>
          <p><span className="text-gray-200">1111</span> — Karim (chauffeur PL)</p>
          <p><span className="text-gray-200">2222</span> — Julien (grutier)</p>
          <p><span className="text-gray-200">3333</span> — Sophie (conductrice PL)</p>
          <p className="text-gray-500 pt-1 font-sans">L'administrateur peut réinitialiser ces codes et interdire les accès.</p>
        </div>
      </details>

      <a
        href="/installer"
        className="mt-5 flex items-center justify-center gap-2 w-full border border-white/15 hover:border-accent hover:text-accent text-gray-300 rounded-lg px-4 py-3 text-sm font-display font-bold uppercase tracking-wide transition-colors"
      >
        <Smartphone size={16} /> Installer l'application — guide pas à pas
      </a>
      <a
        href="/deploiement"
        className="mt-2 flex items-center justify-center gap-2 w-full border border-white/15 hover:border-accent hover:text-accent text-gray-300 rounded-lg px-4 py-3 text-sm font-display font-bold uppercase tracking-wide transition-colors"
      >
        <Rocket size={16} /> Mettre l'application en ligne — guide de déploiement
      </a>
    </div>
  );
}