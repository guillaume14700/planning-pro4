import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Génère à la volée un ZIP du code source de l'application (sans node_modules,
   .next, .git ni .env) pour que l'administrateur puisse le télécharger
   directement depuis l'app et le déposer sur GitHub. ZIP « stored » (sans
   compression) écrit à la main — aucune dépendance externe. */

const EXCLUDED_DIRS = new Set(["node_modules", ".next", ".git", ".turbo", "coverage", "out", "dist"]);
const EXCLUDED_FILES = new Set([".env", ".env.local", ".env.production", "next-env.d.ts", "tsconfig.tsbuildinfo"]);

type Entry = { name: string; data: Buffer };

let crcTable: Uint32Array | null = null;
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d = new Date()) {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

function buildZip(entries: Entry[]): Buffer {
  const { time, date } = dosDateTime();
  const body: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const crc = crc32(e.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // noms UTF-8
    local.writeUInt16LE(0, 8); // méthode : stored
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    body.push(local, nameBuf, e.data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(e.data.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += 30 + nameBuf.length + e.data.length;
  }
  const bodyBuf = Buffer.concat(body);
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(bodyBuf.length, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([bodyBuf, centralBuf, eocd]);
}

async function collect(dir: string, base: string, out: Entry[], depth = 0): Promise<void> {
  if (depth > 8 || out.length > 3000) return;
  const items = await readdir(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    const rel = base ? `${base}/${it.name}` : it.name;
    if (it.isSymbolicLink()) continue;
    if (it.isDirectory()) {
      if (EXCLUDED_DIRS.has(it.name) || it.name.startsWith(".git")) continue;
      await collect(full, rel, out, depth + 1);
    } else if (it.isFile()) {
      if (EXCLUDED_FILES.has(it.name) || it.name.endsWith(".log") || it.name.endsWith(".tsbuildinfo")) continue;
      try {
        const st = await stat(full);
        if (st.size > 10 * 1024 * 1024) continue; // ignore fichiers > 10 Mo
        out.push({ name: rel, data: await readFile(full) });
      } catch { /* fichier illisible : on ignore */ }
    }
  }
}

export async function GET() {
  const me = await getSession();
  if (!me || me.role !== "admin") {
    return Response.json(
      { error: "Réservé à l'administrateur principal : connectez-vous d'abord à l'application avec votre code admin, puis recliquez sur le bouton." },
      { status: 401 }
    );
  }
  try {
    const entries: Entry[] = [];
    await collect(process.cwd(), "", entries);
    if (entries.length === 0) {
      return Response.json({ error: "Code source introuvable sur ce serveur." }, { status: 500 });
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const zip = buildZip(entries);
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="planning-pro-code.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Erreur lors de la génération du ZIP" }, { status: 500 });
  }
}
