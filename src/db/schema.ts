import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

/* ---------- Utilisateurs & sessions ---------- */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // 'admin' | 'user'
  job: text("job").notNull().default("Chauffeur PL"),
  phone: text("phone").notNull().default(""),
  codeHash: text("code_hash").notNull(),
  active: boolean("active").notNull().default(true),
  color: text("color").notNull().default("#F26A1B"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- Personnalisation & modules ---------- */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  appName: text("app_name").notNull().default("PLanning Pro"),
  companyName: text("company_name").notNull().default("Transports & Levage"),
  logoData: text("logo_data").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#F26A1B"),
  accentColor: text("accent_color").notNull().default("#FFC400"),
  depotName: text("depot_name").notNull().default("Dépôt principal"),
  depotAddress: text("depot_address").notNull().default(""),
  depotLat: real("depot_lat").notNull().default(45.7),
  depotLng: real("depot_lng").notNull().default(4.9),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const modules = pgTable("modules", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
});

/* ---------- Référentiels chantier / transport ---------- */
export const chantiers = pgTable("chantiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  client: text("client").notNull().default(""),
  address: text("address").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  distanceKm: real("distance_km").notNull().default(0),
  travelMin: integer("travel_min").notNull().default(0),
  lat: real("lat"),
  lng: real("lng"),
  color: text("color").notNull().default("#F26A1B"),
  notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plate: text("plate").notNull().default(""),
  type: text("type").notNull().default("porteur"), // porteur | semi | benne | grue_mobile | camion_grue
  status: text("status").notNull().default("disponible"), // disponible | panne | entretien
  km: integer("km").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- Planning ---------- */
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  driverId: integer("driver_id").notNull(),
  chantierId: integer("chantier_id"), // null = tâche libre (sans chantier)
  vehicleId: integer("vehicle_id"), // null = tâche sans véhicule (formation, administratif…)
  startTime: text("start_time").notNull(), // HH:MM prise de poste au dépôt
  endTime: text("end_time").notNull(), // HH:MM fin de service au dépôt
  extraDrivingMin: integer("extra_driving_min").notNull().default(0),
  task: text("task").notNull().default("Livraison matériaux"),
  notes: text("notes").notNull().default(""),
  createdBy: integer("created_by").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------- Alertes panne ---------- */
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  kind: text("kind").notNull().default("autre"), // moteur | crevaison | hydraulique | electrique | autre
  severity: text("severity").notNull().default("immobilise"), // immobilise | degrade
  message: text("message").notNull().default(""),
  location: text("location").notNull().default(""),
  status: text("status").notNull().default("active"), // active | resolue
  createdBy: integer("created_by").notNull(),
  createdByName: text("created_by_name").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedByName: text("resolved_by_name").notNull().default(""),
});

/* ---------- Messagerie / notifications ---------- */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("systeme"), // planning | panne | conges | systeme
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  createdBy: integer("created_by").notNull().default(0),
  createdByName: text("created_by_name").notNull().default("Système"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationReads = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull(),
  userId: integer("user_id").notNull(),
});

/* ---------- Modules complémentaires ---------- */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull().default(""),
  role: text("role").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  date: text("date").notNull(),
  kind: text("kind").notNull().default("Entretien courant"),
  description: text("description").notNull().default(""),
  km: integer("km").notNull().default(0),
  cost: real("cost").notNull().default(0),
  nextDate: text("next_date").notNull().default(""),
});

export const fuelLogs = pgTable("fuel_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  userId: integer("user_id").notNull().default(0),
  date: text("date").notNull(),
  liters: real("liters").notNull().default(0),
  cost: real("cost").notNull().default(0),
  km: integer("km").notNull().default(0),
  station: text("station").notNull().default(""),
});

export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  items: jsonb("items").notNull().default({}),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  kind: text("kind").notNull().default("Congé payé"),
  reason: text("reason").notNull().default(""),
  status: text("status").notNull().default("attente"), // attente | valide | refuse
  decidedByName: text("decided_by_name").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().default(0),
  userName: text("user_name").notNull().default("Système"),
  action: text("action").notNull(),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});