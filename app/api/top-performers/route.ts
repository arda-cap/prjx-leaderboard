import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function GET() {
  await ensureSchema();

  try {
    const result = await sql`
      select address, rank, total_points, twitter_handle
      from leaderboard_current
      order by total_points desc
      limit 10;
    `;

    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
