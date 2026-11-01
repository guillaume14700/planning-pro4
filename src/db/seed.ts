import "dotenv/config";
import { createHash } from "crypto";
import { db, pool } from "./index";
import {
  users, settings, modules, chantiers, vehicles, missions,
  contacts, maintenance, fuelLogs, notifications,
} from "./schema";
import { MODULES, DEFAULT_DISABLED } from "../lib/modules";
import { mondayOf, todayStr, addDays } from "../lib/utils";

const hash = (code: string) => createHash("sha256").update(`planning-pl::${code.trim()}`).digest("hex");

async function main() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log("Seed déjà appliqué — rien à faire.");
    await pool.end();
    return;
  }

  /* Utilisateurs — admin principal = le chauffeur (vous), code 2468 */
  const us = await db.insert(users).values([
    { name: "Administrateur", role: "admin", job: "Chauffeur PL / Grutier — Admin principal", phone: "06 00 00 00 01", codeHash: hash("2468"), color: "#F26A1B" },
    { name: "Karim Benali", role: "user", job: "Chauffeur PL benne", phone: "06 12 34 56 78", codeHash: hash("1111"), color: "#0E7490" },
    { name: "Julien Moreau", role: "user", job: "Grutier", phone: "06 23 45 67 89", codeHash: hash("2222"), color: "#4D7C0F" },
    { name: "Sophie Durand", role: "user", job: "Conductrice PL / Camion-grue", phone: "06 34 56 78 90", codeHash: hash("3333"), color: "#7C3AED" },
  ]).returning();
  const [admin, karim, julien, sophie] = us;

  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  await db.insert(modules).values(
    MODULES.map((m) => ({ key: m.key, enabled: !DEFAULT_DISABLED.includes(m.key) }))
  ).onConflictDoNothing();

  const cs = await db.insert(chantiers).values([
    { name: "Résidence Les Cèdres", client: "Bouygues Bâtiment", address: "8 cours Émile Zola, 69100 Villeurbanne", contactName: "M. Lambert (chef de chantier)", contactPhone: "06 71 22 33 44", distanceKm: 14, travelMin: 25, lat: 45.7719, lng: 4.8902, color: "#0E7490", notes: "Livraisons avant 9h — portail code 4512B. Zone étroite, prévoir guide." },
    { name: "Échangeur A7 — Givors", client: "Eiffage Route", address: "Zone des Vernes, 69700 Givors", contactName: "Mme Roux", contactPhone: "06 82 33 44 55", distanceKm: 26, travelMin: 35, lat: 45.5906, lng: 4.7689, color: "#B45309", notes: "Accès piste poids lourds par sud. Port du casque + chaussures obligatoire." },
    { name: "ZAC Confluence — Lot B", client: "Vinci Construction", address: "Quai Rambaud, 69002 Lyon", contactName: "T. Nguyen", contactPhone: "06 93 44 55 66", distanceKm: 9, travelMin: 20, lat: 45.7426, lng: 4.8156, color: "#4D7C0F", notes: "Grutage fenêtres 6h-14h. Balisage à prévoir, arrêtés de voirie affichés." },
    { name: "Ecoquartier Part-Dieu", client: "Sogelym Dixence", address: "Rue Garibaldi, 69003 Lyon", contactName: "A. Petit", contactPhone: "06 14 55 66 77", distanceKm: 6, travelMin: 18, lat: 45.7605, lng: 4.8570, color: "#7C3AED", notes: "Créneaux levage stricts (école à proximité) : 9h-11h30 / 13h30-16h." },
    { name: "Entrepôt logistique Sud", client: "GLP Saint-Priest", address: "ZI Mi-Plaine, 69800 Saint-Priest", contactName: "Quai 12 — D. Garcia", contactPhone: "06 25 66 77 88", distanceKm: 12, travelMin: 22, lat: 45.7005, lng: 4.9345, color: "#BE185D", notes: "Dock n°12. Téléphoner 15 min avant arrivée." },
  ]).returning();

  const vs = await db.insert(vehicles).values([
    { name: "Volvo FH16 plateau + Hiab", plate: "AB-123-CD", type: "camion_grue", km: 187400, notes: "Auxiliaire Hiab X-HiPro 358 — télécommande dans la cabine." },
    { name: "Mercedes Arocs 8x4 benne", plate: "EF-456-GH", type: "benne", km: 142300, notes: "Bâche électrique. PTAC 32t." },
    { name: "Liebherr LTM 1090-4.2", plate: "IJ-789-KL", type: "grue_mobile", km: 96800, notes: "Grue mobile 90t — CACES R483. VGP à jour." },
    { name: "Renault T High 480 semi", plate: "MN-012-OP", type: "semi", km: 310500, notes: "Plateau extensible — arrimage renforcé." },
  ]).returning();

  const mon = mondayOf(todayStr());
  const D = (n: number) => addDays(mon, n);
  const M = (date: string, driverId: number, chantierId: number, vehicleId: number, startTime: string, endTime: string, task: string, extraDrivingMin = 0, notes = "") =>
    ({ date, driverId, chantierId, vehicleId, startTime, endTime, task, extraDrivingMin, notes, createdBy: admin!.id });

  await db.insert(missions).values([
    M(D(0), karim!.id, cs[0]!.id, vs[1]!.id, "07:00", "16:00", "Rotation benne / évacuation", 90, "Gravats à évacuer quai B — benne bâchée obligatoire."),
    M(D(0), julien!.id, cs[2]!.id, vs[2]!.id, "06:30", "15:30", "Levage / grutage", 0, "Levage panneaux préfa — vent à surveiller."),
    M(D(0), sophie!.id, cs[4]!.id, vs[0]!.id, "08:00", "17:00", "Livraison matériaux", 20, "Palettes parpaings + linteaux, déchargement à la grue auxiliaire."),
    M(D(1), karim!.id, cs[1]!.id, vs[1]!.id, "06:00", "15:00", "Terrassement", 120, "Navrottes terre vers décharge d'Yvours."),
    M(D(1), julien!.id, cs[3]!.id, vs[2]!.id, "07:00", "16:00", "Levage / grutage", 0, "Créneaux école : 9h-11h30."),
    M(D(1), admin!.id, cs[4]!.id, vs[3]!.id, "06:30", "14:30", "Transport d'engins", 30, "Mini-pelle 8t à livrer, sangles vérifiées."),
    M(D(2), sophie!.id, cs[1]!.id, vs[0]!.id, "07:30", "16:30", "Livraison matériaux", 0, ""),
    M(D(2), karim!.id, cs[4]!.id, vs[1]!.id, "07:00", "15:00", "Rotation benne / évacuation", 60, ""),
    M(D(2), admin!.id, cs[2]!.id, vs[2]!.id, "08:00", "17:00", "Montage / démontage grue", 0, "Contrepoids à suivre."),
    M(D(3), julien!.id, cs[2]!.id, vs[2]!.id, "06:30", "15:30", "Levage / grutage", 0, ""),
    M(D(3), sophie!.id, cs[0]!.id, vs[0]!.id, "07:00", "16:00", "Livraison matériaux", 15, "Livraison avant 9h impérative."),
    M(D(3), karim!.id, cs[3]!.id, vs[1]!.id, "09:00", "17:00", "Rotation benne / évacuation", 45, ""),
    M(D(4), karim!.id, cs[0]!.id, vs[1]!.id, "06:00", "15:00", "Rotation benne / évacuation", 120, ""),
    M(D(4), admin!.id, cs[1]!.id, vs[3]!.id, "07:00", "16:00", "Transport d'engins", 30, ""),
    M(D(4), julien!.id, cs[3]!.id, vs[2]!.id, "07:00", "15:00", "Levage / grutage", 0, ""),
    M(D(4), sophie!.id, cs[4]!.id, vs[0]!.id, "08:00", "16:00", "Livraison matériaux", 0, ""),
    M(D(5), karim!.id, cs[0]!.id, vs[1]!.id, "07:00", "12:00", "Rotation benne / évacuation", 30, "Samedi matin — chantier fermé à 12h30."),
    M(D(7), karim!.id, cs[1]!.id, vs[1]!.id, "06:00", "15:00", "Terrassement", 120, ""),
    M(D(7), julien!.id, cs[2]!.id, vs[2]!.id, "06:30", "15:30", "Levage / grutage", 0, ""),
    M(D(8), sophie!.id, cs[4]!.id, vs[0]!.id, "08:00", "17:00", "Livraison matériaux", 0, ""),
  ]);

  await db.insert(contacts).values([
    { name: "M. Lambert", company: "Bouygues Bâtiment", role: "Chef de chantier — Les Cèdres", phone: "06 71 22 33 44", email: "lambert@bouygues.example", notes: "Portail code 4512B" },
    { name: "Dépannage PL Rhône", company: "DPPL 69", role: "Dépanneur poids lourds 24/7", phone: "04 78 00 11 22", email: "", notes: "Contrat assistance — donner n° de flotte" },
    { name: "Liebherr Service Lyon", company: "Liebherr", role: "SAV grue mobile", phone: "04 72 11 33 55", email: "sav.lyon@liebherr.example", notes: "Intervention sous 4h ouvrées" },
    { name: "Mme Roux", company: "Eiffage Route", role: "Conductrice de travaux — A7", phone: "06 82 33 44 55", email: "roux@eiffage.example", notes: "" },
  ]);

  await db.insert(maintenance).values([
    { vehicleId: vs[2]!.id, date: addDays(todayStr(), -40), kind: "VGP grue (semestrielle)", description: "Vérification générale périodique — rapport APAVE OK.", km: 96200, cost: 480, nextDate: addDays(todayStr(), 140) },
    { vehicleId: vs[1]!.id, date: addDays(todayStr(), -20), kind: "Vidange + filtres", description: "Vidange moteur 10W40, filtres huile/gasoil/air.", km: 139800, cost: 620, nextDate: addDays(todayStr(), 70) },
    { vehicleId: vs[0]!.id, date: addDays(todayStr(), -10), kind: "Contrôle technique", description: "CT poids lourd — favorable.", km: 185900, cost: 130, nextDate: addDays(todayStr(), 355) },
  ]);

  await db.insert(fuelLogs).values([
    { vehicleId: vs[1]!.id, userId: karim!.id, date: addDays(todayStr(), -2), liters: 280, cost: 462.5, km: 142100, station: "Total Corbas" },
    { vehicleId: vs[2]!.id, userId: julien!.id, date: addDays(todayStr(), -1), liters: 190, cost: 318.9, km: 96750, station: "AS24 Saint-Priest" },
    { vehicleId: vs[0]!.id, userId: sophie!.id, date: todayStr(), liters: 210, cost: 349.0, km: 187350, station: "Total Corbas" },
  ]);

  await db.insert(notifications).values([
    { type: "systeme", title: "👋 Bienvenue sur votre espace planning", body: "L'administrateur gère le planning, les modules et les accès. Toute modification du planning vous est notifiée ici. En cas de panne du PL, utilisez le bouton rouge « Alerte panne ».", createdByName: "Système" },
    { type: "planning", title: "📅 Planning de la semaine publié", body: "Le planning de la semaine est en ligne. Vérifiez vos prises de poste et les temps de trajet dépôt → chantier.", createdByName: "Administrateur", createdBy: admin!.id },
  ]);

  console.log("Seed OK — Admin: 2468 | Karim: 1111 | Julien: 2222 | Sophie: 3333");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});