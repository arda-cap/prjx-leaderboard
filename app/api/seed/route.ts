import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureSchema, isAddress } from "@/lib/db";

// Fallback addresses (your first 20)
const DEFAULT_ADDRESSES: string[] = [
  "0x29f95aecc3d5ad0c8698dd6dccad71cacb087d2c",
  "0xefd3ab65915e35105caa462442c9ecc1346728df",
  "0xa8349546fd68e7531f8426851e09574756c1e441",
  "0x72dae3560e7f4c59a305e2e739d6bd6777f738b5",
  "0x539c44a05820f6b9e131f2e4078e22f6e90bf7fc",
  "0xbdfa4f4492dd7b7cf211209c4791af8d52bf5c50",
  "0x21813dd67fecb6dffb3f74bb35c13336bc99a519",
  "0xee9b30ed3f1084d89eb6f5d9b362e281ef15de67",
  "0x5046bb9f9fe4b5dc0539509462888b425dfae58a",
  "0x736dde3e0f5c588ddc53ad7f0f65667c0cca2801",
  "0x89b585df208c727829232d892a50806c3a20a4e6",
  "0xcc2f25693d6e7459b0917c6d075f38ea1f5d5c96",
  "0x2fe21fc5130e953b862d4a6048cfd016ecf3974d",
  "0x7a35bbc1de0b86e11aea964956807e08317f3803",
  "0x8383b9a512f1c0e57cd015b076372b2844859e57",
  "0x28c01b64f2492d82fd58feecf8c71603c769bb4a",
  "0x7258d00a24d6829ac4bf355127bfbc9e2303aed4",
  "0x8ebb6cfff65c4dc8b72b55cdff740a4cb12f0cbc",
  "0x279f7364049b22bb8a456532250c473e7b491619",
  "0x72dae3560e7f4c59a305e2e739d6bd6777f738b5" // duplicated in user list; harmless
];

async function upsertWallets(addresses: string[]) {
  let inserted = 0;
  for (const addr of addresses) {
    if (!isAddress(addr)) continue;
    await sql`
      insert into wallets (address)
      values (${addr})
      on conflict (address) do nothing;
    `;
    inserted++;
  }
  return inserted;
}

async function seedHandler(request?: Request) {
  try {
    await ensureSchema();

    let addresses: string[] = [];

    // If a request is provided, try to parse client-provided addresses
    if (request) {
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await request.json().catch(() => null);
        if (body && Array.isArray(body.addresses)) {
          addresses = body.addresses.map((x: any) => String(x));
        }
      } else if (ct.includes("text/plain")) {
        const text = await request.text().catch(() => "");
        if (text) {
          addresses = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        }
      }
    }

    // Fallback to default sample addresses
    if (addresses.length === 0) {
      addresses = DEFAULT_ADDRESSES;
    }

    // Upsert into wallets
    const inserted = await upsertWallets(addresses);

    return NextResponse.json({
      ok: true,
      received: addresses.length,
      inserted,
      note:
        "Wallets inserted into `wallets` table. Now call /api/cron/daily to fetch ranks & points."
    });
  } catch (err: any) {
    console.error("SEED ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "seed failed" },
      { status: 500 }
    );
  }
}

// Allow both POST (proper) and GET (easy click)
export async function POST(request: Request) {
  return seedHandler(request);
}
export async function GET() {
  // GET will just seed default addresses
  return seedHandler();
}
