"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Share2, Copy, CheckCircle2, Smartphone, Apple, Monitor, ExternalLink,
  ShieldAlert, Cloud, Server, KeyRound, QrCode, Users,
} from "lucide-react";

import { useApp } from "./app-provider";
import { InstallButton } from "./pwa";
import { PreviewWarning } from "./share-link";
import { Badge, Button, Card } from "./ui";

function CodeLine({ children }: { children: string }) {
  const { toast } = useApp();
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(children); toast("Commande copiée", "ok"); }}
      title="Copier la commande"
      className="w-full text-left font-mono text-xs bg-coal text-accent rounded-md px-3 py-2 hover:bg-coal-2 transition-colors cursor-pointer flex items-center justify-between gap-2"
    >
      <span className="truncate">{children}</span>
      <Copy size={12} className="shrink-0 opacity-60" />
    </button>
  );
}

export default function ShareTab({ onGoUsers }: { onGoUsers: () => void }) {
  const { settings, users, toast } = useApp();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  const url = origin || "…";

  function copy() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Lien copié — envoyez-le à vos chauffeurs", "ok");
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${settings.appName} — ${settings.companyName}`,
          text: `Accède au planning de l'équipe ${settings.companyName}. Connecte-toi avec ton code personnel.`,
          url,
        });
      } catch { /* annulé */ }
    } else copy();
  }

  return (
    <div className="space-y-5">
      {/* ---- LE LIEN, en grand, impossible à rater ---- */}
      <div className="coal-texture rounded-lg p-5 text-white anim-fade-up space-y-3">
        <PreviewWarning />
        <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-accent mb-2">🔗 Le lien de votre application — à envoyer aux chauffeurs</p>
        <p className="font-mono text-lg md:text-2xl break-all leading-snug">{url}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copy} className="inline-flex items-center gap-2 bg-accent hover:brightness-105 text-coal font-display font-extrabold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all cursor-pointer">
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied ? "Copié !" : "Copier le lien"}
          </button>
          <button onClick={share} className="inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-extrabold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all cursor-pointer">
            <Share2 size={16} /> Partager (SMS / WhatsApp)
          </button>
          <a href="/installer" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 font-display font-extrabold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
            <Smartphone size={16} /> Guide d'installation
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">Chaque chauffeur ouvre ce lien, saisit son code personnel, puis installe l'application sur son téléphone (bouton « Installer » dans le menu du navigateur).</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ---- Inviter l'équipe ---- */}
        <Card className="p-5 anim-fade-up">
          <h3 className="font-display text-xl font-extrabold uppercase flex items-center gap-2 mb-1">
            <QrCode size={19} className="text-brand" /> Inviter l'équipe
          </h3>
          <p className="text-sm text-steel mb-4">Partagez le lien ou faites scanner le QR code : chacun arrive sur l'écran de connexion et saisit <strong className="text-coal">son code personnel</strong>.</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="shrink-0 mx-auto sm:mx-0 bg-white border-2 border-coal rounded-lg p-3 shadow-sm">
              {origin ? (
                <QRCodeSVG value={url} size={148} bgColor="#ffffff" fgColor="#16191e" level="M" />
              ) : (
                <div className="w-[148px] h-[148px] bg-gray-100 animate-pulse rounded" />
              )}
              <p className="text-[9px] uppercase font-bold tracking-widest text-center mt-2 text-steel">Scannez pour accéder</p>
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="font-mono text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 break-all">{url}</div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={copy} variant="dark">{copied ? <CheckCircle2 size={15} /> : <Copy size={15} />} {copied ? "Copié !" : "Copier le lien"}</Button>
                <Button onClick={share}><Share2 size={15} /> Partager</Button>
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline py-2"><ExternalLink size={13} /> Ouvrir</a>
              </div>
              <a
                href="/installer"
                className="inline-flex items-center gap-2 bg-accent text-coal rounded-md px-3.5 py-2 text-xs font-display font-extrabold uppercase tracking-wide hover:brightness-105 transition-all"
              >
                <Smartphone size={14} /> Voir le guide d'installation pas à pas
              </a>
              <div className="text-xs text-steel space-y-1 pt-1">
                <p><strong className="text-coal">1.</strong> Le chauffeur ouvre le lien (SMS, WhatsApp, e-mail…)</p>
                <p><strong className="text-coal">2.</strong> Il saisit son code à 4 chiffres</p>
                <p><strong className="text-coal">3.</strong> Vous gérez ses accès à tout moment</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-steel flex items-center gap-1.5"><Users size={13} /> {users.filter((u) => u.active).length} utilisateur(s) actif(s) — codes dans l'onglet Utilisateurs</p>
            <Button variant="outline" className="!py-1.5 text-xs" onClick={onGoUsers}><KeyRound size={13} /> Gérer les codes</Button>
          </div>

          <p className="mt-3 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-3 py-2.5 flex gap-2">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            Avant de partager largement : changez votre code admin « 2468 » (menu profil → Changer mon code) et réinitialisez ou supprimez les comptes de démonstration.
          </p>
        </Card>

        {/* ---- Installer ---- */}
        <Card className="p-5 anim-fade-up delay-1">
          <h3 className="font-display text-xl font-extrabold uppercase flex items-center gap-2 mb-1">
            <Smartphone size={19} className="text-brand" /> Installer sur téléphone & PC
          </h3>
          <p className="text-sm text-steel mb-3">L'application s'installe comme une vraie appli (icône sur l'écran d'accueil, plein écran) — <strong className="text-coal">gratuit, sans passer par un store</strong>.</p>
          <div className="mb-4"><InstallButton /></div>
          <div className="space-y-3">
            <div className="flex gap-3 border border-gray-200 rounded-md p-3 hover:border-brand/50 transition-colors">
              <span className="w-9 h-9 rounded-md bg-green-100 text-green-700 flex items-center justify-center shrink-0"><Smartphone size={18} /></span>
              <div className="text-sm">
                <p className="font-bold">Android — Chrome</p>
                <p className="text-xs text-steel mt-0.5">Ouvrez le lien → menu <strong>⋮</strong> → « <strong>Installer l'application</strong> » (ou « Ajouter à l'écran d'accueil »).</p>
              </div>
            </div>
            <div className="flex gap-3 border border-gray-200 rounded-md p-3 hover:border-brand/50 transition-colors">
              <span className="w-9 h-9 rounded-md bg-gray-200 text-coal flex items-center justify-center shrink-0"><Apple size={18} /></span>
              <div className="text-sm">
                <p className="font-bold">iPhone — Safari</p>
                <p className="text-xs text-steel mt-0.5">Ouvrez le lien dans <strong>Safari</strong> → bouton <strong>Partager</strong> (carré avec flèche) → « <strong>Sur l'écran d'accueil</strong> ».</p>
              </div>
            </div>
            <div className="flex gap-3 border border-gray-200 rounded-md p-3 hover:border-brand/50 transition-colors">
              <span className="w-9 h-9 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0"><Monitor size={18} /></span>
              <div className="text-sm">
                <p className="font-bold">PC / Mac — Chrome ou Edge</p>
                <p className="text-xs text-steel mt-0.5">Cliquez sur l'icône <strong>d'installation</strong> à droite de la barre d'adresse, ou menu → « Installer ».</p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-steel mt-3">⚠️ L'installation nécessite une adresse en <strong>HTTPS</strong> (c'est le cas du lien actuel). Le planning reste synchronisé en temps réel via le réseau mobile.</p>
        </Card>
      </div>

      {/* ---- Mise en production ---- */}
      <Card className="p-5 anim-fade-up delay-2">
        <h3 className="font-display text-xl font-extrabold uppercase flex items-center gap-2 mb-1">
          <Server size={19} className="text-brand" /> Héberger l'application durablement
        </h3>
        <p className="text-sm text-steel mb-3">
          Le lien actuel est l'<strong>aperçu arena.ai</strong> : il ne s'ouvre que dans le panneau d'aperçu Arena. Pour une utilisation quotidienne par l'entreprise, déployez votre propre instance — <strong className="text-coal">aucune commande technique n'est nécessaire</strong> : les tables et votre compte admin (code 2468) se créent tout seuls au premier lancement.
        </p>
        <a
          href="/deploiement"
          className="mb-4 inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-extrabold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all"
        >
          <Cloud size={16} /> Ouvrir le guide de déploiement pas à pas
        </a>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 space-y-2.5">
            <p className="font-bold text-sm flex items-center gap-2"><Cloud size={16} className="text-brand" /> Option A — Vercel, tout-en-un <Badge color="green">Recommandé · gratuit</Badge></p>
            <ol className="text-xs text-steel space-y-1.5 list-decimal list-inside">
              <li>Mettez le code sur <strong>GitHub</strong> (mini-guide illustré : <span className="font-mono text-coal">/guide-github</span>), puis sur <strong>vercel.com</strong> : « Add New → Project » → importez le dépôt → <strong>Deploy</strong>.</li>
              <li>Dans Vercel : menu <strong>Storage → Create Database → Neon</strong> (gratuit, via votre compte GitHub) → <strong>connectez la base au projet</strong> : Vercel ajoute la variable de connexion tout seul (l'app reconnaît <span className="font-mono text-coal">POSTGRES_URL</span> et <span className="font-mono text-coal">DATABASE_URL</span>), puis « Redeploy ».</li>
              <li>Ouvrez votre nouveau lien Vercel : tout se configure seul. Connectez-vous avec le code <span className="font-mono text-coal">2468</span>, changez-le, créez vos chantiers et vos chauffeurs.</li>
              <li><strong className="text-coal">Ce lien Vercel est celui à partager</strong> : il fonctionne partout et permet d'installer l'appli sur les téléphones.</li>
            </ol>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 space-y-2.5">
            <p className="font-bold text-sm flex items-center gap-2"><Server size={16} className="text-brand" /> Option B — Votre serveur (VPS / entreprise)</p>
            <ol className="text-xs text-steel space-y-1.5 list-decimal list-inside">
              <li>Installez <strong>Node.js 20+</strong> et <strong>PostgreSQL</strong>, puis récupérez le code (bouton « Accéder au code de l'arène » sur arena.ai).</li>
              <li>Créez le fichier <span className="font-mono text-coal">.env</span> à la racine :</li>
            </ol>
            <CodeLine>DATABASE_URL=postgresql://user:motdepasse@hote:5432/planning</CodeLine>
            <div className="space-y-1.5">
              <CodeLine>npm install</CodeLine>
              <CodeLine>npm run build</CodeLine>
              <CodeLine>npm run start</CodeLine>
            </div>
            <p className="text-xs text-steel">La base se crée au premier lancement (admin : 2468). Gardez le processus actif avec <span className="font-mono text-coal">pm2</span> et placez <strong>Nginx + certificat HTTPS</strong> (Let's Encrypt) devant — indispensable pour installer la PWA sur les téléphones. Détails complets dans le <span className="font-mono text-coal">README.md</span> du projet.</p>
          </div>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-2 text-xs">
          <p className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex gap-2"><ShieldAlert size={14} className="shrink-0 text-amber-600" /> Changez le code admin 2468 dès la première connexion sur votre instance.</p>
          <p className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex gap-2"><Users size={14} className="shrink-0 text-brand" /> Une instance déployée démarre vide (sans les données de démonstration Karim / Julien / Sophie) : créez vos vrais chantiers, véhicules et chauffeurs.</p>
          <p className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex gap-2"><KeyRound size={14} className="shrink-0 text-green-700" /> Sauvegardez la base régulièrement (dump PostgreSQL quotidien).</p>
        </div>
      </Card>
    </div>
  );
}