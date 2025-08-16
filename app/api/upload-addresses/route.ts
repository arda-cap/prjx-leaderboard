import { ensureSchema, isAddress } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const maxDuration = 60;

export async function POST(req: Request) {
  await ensureSchema();
  const ctype = req.headers.get("content-type") || "";
  let content = "";

  if (ctype.startsWith("text/plain")) {
    content = await req.text();
  } else if (ctype.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return new Response("Missing file", { status: 400 });
    content = await file.text();
  } else if (ctype.startsWith("application/json")) {
    const j = await req.json();
    content = (j.addresses || []).join("\n");
  } else {
    return new Response("Unsupported content type", { status: 415 });
  }

  const lines = content.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const unique = Array.from(new Set(lines)).filter(isAddress);
  if (unique.length === 0) return Response.json({ inserted: 0, duplicates: lines.length, total: lines.length });

  for (let i=0; i<unique.length; i+=500) {
    const slice = unique.slice(i, i+500);
    const values = slice.map((a, idx) => `($${idx+1})`).join(",");
    await sql.unsafe(`insert into wallets(address) values ${values} on conflict (address) do nothing`, slice);
  }

  return Response.json({ inserted: unique.length, duplicates: lines.length - unique.length, total: lines.length });
}
