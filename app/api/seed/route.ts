import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function POST() {
  await ensureSchema();

  try {
    // reset schema
    await sql`truncate table leaderboard_current;`;

    // insert demo data
    await sql`
      insert into leaderboard_current (address, rank, total_points, account_level, twitter_handle, last_activity, delta_rank, delta_points)
      values
      ('0x123...', 1, 1000, 'gold', 'demo1', now(), 0, 0),
      ('0x456...', 2, 800, 'silver', 'demo2', now(), -1, -50),
      ('0x789...', 3, 500, 'bronze', 'demo3', now(), +1, +20);
    `;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
