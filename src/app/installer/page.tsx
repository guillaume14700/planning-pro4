import Link from "next/link";
import { ArrowLeft, Smartphone, ShieldAlert, KeyRound, QrCode, Wifi, Users, HelpCircle, Printer, TriangleAlert } from "lucide-react";
import { getSettingsSafe } from "@/lib/server";
import InstallGuide from "@/components/install-guide";

export const dynamic = "force-dynamic";

export default async function InstallerPage() {
  const s = await getSettingsSafe();

  return (
    <div className="min-h-screen" style={{ background: "#eef0f2" }}>
      {/* Bandeau de sécurité BTP */}
      <div className="hazard h-3" />

      <header className="coal-texture text-white">
        <div className="max-w-3xl mx-auto px-5 py-7">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>
          <div className="hazard h-1.5 w-24 rounded-full mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none">
            Installer l&apos;application
          </h1>
          <p className="mt-3 text-gray-300 max-w-xl">
            Suivez les étapes ci-dessous selon votre téléphone ou votre ordinateur.
            <strong className="text-white"> C&apos;est gratuit</strong>, sans App Store ni Play Store — l&apos;application se pose directement sur votre écran d&apos;accueil.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-accent">
            <Smartphone size={17} />
            <span className="font-semibold">{s.appName} — {s.companyName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {/* Résumé rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { i: <QrCode size={18} />, t: "1. Ouvrir le lien", d: "reçu par SMS ou e-mail" },
            { i: <Printer size={18} />, t: "2. Installer", d: "3 touches en tout" },
            { i: <KeyRound size={18} />, t: "3. Code perso", d: "4 chiffres" },
            { i: <Users size={18} />, t: "4. Planning", d: "toute l'équipe" },
          ].map((x) => (
            <div key={x.t} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="w-8 h-8 rounded-md bg-brand/10 text-brand flex items-center justify-center mb-2">{x.i}</div>
              <p className="text-xs font-bold">{x.t}</p>
              <p className="text-[11px] text-steel">{x.d}</p>
            </div>
          ))}
        </div>

        {/* Le guide */}
        <section>
          <h2 className="font-display text-2xl font-extrabold uppercase mb-4">Le guide, étape par étape</h2>
          <InstallGuide />
        </section>

        {/* En cas de problème */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-1 flex items-center gap-2">
            <HelpCircle size={20} className="text-brand" /> Si ça ne marche pas
          </h2>
          <div className="space-y-2.5 mt-3">
            {[
              { q: "Je ne vois pas le bouton « Installer »", r: "Touchez d'abord le bouton Partager (iPhone) ou le menu ⋮ (Android). Sur iPhone, vérifiez que vous êtes bien dans Safari." },
              { q: "Le lien s'ouvre dans la mauvaise application", r: "Copiez le lien, puis collez-le dans Google Chrome (Android) ou Safari (iPhone). Dans WhatsApp, « Ouvrir dans le navigateur » fonctionne aussi." },
              { q: "L'application se ferme toute seule ou affiche « Pas de réseau »", r: "Vérifiez votre connexion 4G ou Wi-Fi. Le planning doit être en ligne pour recevoir les alertes panne et les modifications." },
              { q: "On me demande un code et je ne l'ai pas", r: "Appelez l'administrateur (votre responsable d'équipe) : il crée votre accès et vous donne un code à 4 chiffres, qu'il peut réinitialiser à tout moment." },
              { q: "Je veux désinstaller", r: "Comme toute application : appui long sur l'icône → « Supprimer ». Aucune donnée n'est perdue côté équipe." },
            ].map((x) => (
              <div key={x.q} className="flex gap-2.5 items-start">
                <TriangleAlert size={15} className="text-brand shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700"><strong>{x.q} — </strong>{x.r}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Notes pour l'admin */}
        <section className="coal-texture text-white rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-1 flex items-center gap-2">
            <ShieldAlert size={20} className="text-accent" /> Pour vous, l&apos;administrateur
          </h2>
          <p className="text-sm text-gray-400 mb-3">Comment inviter vos chauffeurs en 2 minutes :</p>
          <ol className="space-y-2.5">
            {[
              "Connectez-vous avec votre code administrateur.",
              "Allez dans Administration → Partage & installation : le lien et le QR code y sont prêts.",
              "Envoyez le lien à chaque chauffeur (SMS, WhatsApp, e-mail) ou faites-leur scanner le QR code.",
              "Dans Administration → Utilisateurs : créez un accès par chauffeur → un code à 4 chiffres est généré automatiquement, à lui communiquer.",
              "À tout moment : réinitialiser un code oublié, interdire ou rétablir un accès, supprimer un compte.",
            ].map((t, i) => (
              <li key={t} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
              <KeyRound size={16} /> Me connecter
            </Link>
            <a href="#top" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
              <Printer size={16} /> Imprimer ce guide
            </a>
          </div>
        </section>

        <p className="text-xs text-steel flex items-start gap-2 pb-6">
          <Wifi size={13} className="shrink-0 mt-0.5" />
          L&apos;application fonctionne en 4G comme en Wi-Fi. Elle est installable sur téléphone (Android et iPhone) et sur ordinateur (PC ou Mac).
        </p>
      </main>

      <div className="hazard h-3" />
    </div>
  );
}
