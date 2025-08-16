import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function POST(req: Request) {
  await ensureSchema();

  try {
    const { addresses } = await req.json();

    if (!Array.isArray(addresses)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const addr of addresses) {
      await sql`
        insert into leaderboard_current (address, rank, total_points, account_level, last_activity)
        values (${addr}, 9999, 0, 'unranked', now())
        on conflict (address) do nothing;
      `;
    }

    return NextResponse.json({ ok: true, count: addresses.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
