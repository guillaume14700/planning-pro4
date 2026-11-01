import { getSettingsSafe } from "@/lib/server";
import LoginForm from "@/components/login-form";
import { HardHat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getSettingsSafe();
  return (
    <div className="min-h-screen coal-texture text-white grid lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau visuel chantier */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src="/images/login-hero.jpg" alt="Chantier BTP — grue mobile et camion PL" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/40 to-coal/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-coal/80" />
        <div className="relative h-full flex flex-col justify-end p-10">
          <div className="hazard h-2.5 w-40 rounded-full mb-5" />
          <h1 className="font-display text-6xl xl:text-7xl font-extrabold uppercase leading-[0.95] tracking-tight">
            {s.appName}
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-md font-medium">
            Planning chauffeurs PL & grutiers — chantiers, trajets, RSE et alertes panne en temps réel.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <HardHat size={16} className="text-accent" />
            {s.companyName}
          </div>
        </div>
      </div>

      {/* Pavé code */}
      <div className="flex items-center justify-center p-6 py-10">
        <LoginForm appName={s.appName} companyName={s.companyName} logoData={s.logoData} />
      </div>
    </div>
  );
}