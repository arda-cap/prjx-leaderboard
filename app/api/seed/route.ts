import { ensureSchema, isAddress } from "@/lib/db";
import { sql } from "@vercel/postgres";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function POST() {
  await ensureSchema();
  const file = path.join(process.cwd(), "seed", "addresses.txt");
  const content = await fs.readFile(file, "utf8");
  const lines = content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const unique = Array.from(new Set(lines)).filter(isAddress);
  for (let i=0; i<unique.length; i+=500) {
    const slice = unique.slice(i, i+500);
    const values = slice.map((a, idx) => `($${idx+1})`).join(",");
    await sql.unsafe(`insert into wallets(address) values ${values} on conflict (address) do nothing`, slice);
  }
  return Response.json({ inserted: unique.length });
}
