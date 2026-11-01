/* Registre central des modules — seul l'admin principal peut (dés)activer.
   locked = module cœur, non désactivable. adminOnly = visible admin uniquement. */

export type ModuleDef = {
  key: string;
  label: string;
  desc: string;
  icon: string; // nom Lucide
  href: string;
  locked?: boolean;
  adminOnly?: boolean;
  group: "Exploitation" | "Suivi & conformité" | "Outils terrain" | "Administration";
};

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Tableau de bord", desc: "Vue du jour : missions, alertes, météo et messages.", icon: "LayoutDashboard", href: "/", locked: true, group: "Exploitation" },
  { key: "planning", label: "Planning hebdo", desc: "Planning des chauffeurs et grutiers, semaine par semaine.", icon: "CalendarDays", href: "/planning", locked: true, group: "Exploitation" },
  { key: "chantiers", label: "Chantiers", desc: "Fiches chantiers : distance dépôt, temps de trajet, contacts.", icon: "HardHat", href: "/chantiers", group: "Exploitation" },
  { key: "vehicules", label: "Parc véhicules", desc: "PL, grues mobiles, camions-grues : état et disponibilités.", icon: "Truck", href: "/vehicules", group: "Exploitation" },
  { key: "alertes", label: "Alertes panne", desc: "Bouton SOS panne (moteur, crevaison…) diffusé à toute l'équipe.", icon: "Siren", href: "/alertes", group: "Exploitation" },
  { key: "notifications", label: "Messages", desc: "Fil des messages : planning modifié, pannes, infos système.", icon: "Bell", href: "/notifications", group: "Exploitation" },
  { key: "rse", label: "Réglementation RSE", desc: "Contrôle des temps de conduite / repos (règl. CE 561/2006).", icon: "Gauge", href: "/rse", group: "Suivi & conformité" },
  { key: "heures", label: "Heures de service", desc: "Récapitulatif hebdomadaire des amplitudes par chauffeur.", icon: "Clock", href: "/heures", group: "Suivi & conformité" },
  { key: "stats", label: "Statistiques", desc: "Graphiques : heures, kilomètres, missions par chantier.", icon: "BarChart3", href: "/stats", group: "Suivi & conformité" },
  { key: "journal", label: "Journal d'activité", desc: "Traçabilité complète des actions (admin uniquement).", icon: "ScrollText", href: "/journal", adminOnly: true, group: "Suivi & conformité" },
  { key: "feuille", label: "Feuille de route", desc: "Feuille de mission imprimable : horaires, adresses, contacts.", icon: "Printer", href: "/feuille", group: "Outils terrain" },
  { key: "meteo", label: "Météo chantiers", desc: "Prévisions et vigilance vent pour le levage (grutier).", icon: "CloudSun", href: "/meteo", group: "Outils terrain" },
  { key: "checklist", label: "Checklist départ", desc: "Contrôle avant prise de poste : pneus, freins, arrimage, EPI.", icon: "ClipboardCheck", href: "/checklist", group: "Outils terrain" },
  { key: "entretien", label: "Entretien véhicules", desc: "Carnet d'entretien, VGP grue, contrôles techniques.", icon: "Wrench", href: "/entretien", group: "Outils terrain" },
  { key: "carburant", label: "Carburant", desc: "Suivi des pleins : litres, coût, kilométrage.", icon: "Fuel", href: "/carburant", group: "Outils terrain" },
  { key: "contacts", label: "Annuaire", desc: "Contacts clients, chefs de chantier, dépanneurs, collègues.", icon: "Contact", href: "/contacts", group: "Outils terrain" },
  { key: "conges", label: "Absences & congés", desc: "Demandes d'absence, validation par l'administrateur.", icon: "CalendarOff", href: "/conges", group: "Outils terrain" },
  { key: "admin", label: "Administration", desc: "Utilisateurs, codes d'accès, modules, logo et couleurs.", icon: "Settings", href: "/admin", locked: true, adminOnly: true, group: "Administration" },
];

export const MODULE_MAP: Record<string, ModuleDef> = Object.fromEntries(MODULES.map((m) => [m.key, m]));

export const DEFAULT_DISABLED = ["conges", "carburant"];

export const CHECKLIST_ITEMS = [
  "Pneus & écrous (état, pression)",
  "Freins & ABS",
  "Feux / clignotants / gyro",
  "Niveaux (huile, liquide, AdBlue)",
  "Arrimage / sangles / chaînes",
  "Calage & stabilisateurs grue",
  "VGP / CT à jour",
  "EPI (casque, gilet, chaussures)",
  "Documents de bord & chronotachygraphe",
  "Extincteur & trousse de secours",
];