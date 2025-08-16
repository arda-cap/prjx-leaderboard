import { ensureSchema } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const revalidate = 0;

export async function GET(request: Request) {
  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(250, Math.max(1, Number(searchParams.get("pageSize") ?? "100")));
  const query = (searchParams.get("query") ?? "").trim();
  const offset = (page - 1) * pageSize;

  if (query) {
    const q = `%${query}%`;

    const totalRes = await sql`
      select count(*)::int as c
      from leaderboard_current
      where address ilike ${q} or coalesce(twitter_handle,'') ilike ${q};
    `;
    const total = totalRes.rows?.[0]?.c ?? 0;

    const rowsRes = await sql`
      select address, rank, total_points, account_level, twitter_handle, last_activity, delta_rank, delta_points
      from leaderboard_current
      where address ilike ${q} or coalesce(twitter_handle,'') ilike ${q}
      order by rank asc nulls last, total_points desc nulls last
      limit ${pageSize} offset ${offset};
    `;

    return Response.json({ rows: rowsRes.rows, total });
  } else {
    const totalRes = await sql`
      select count(*)::int as c
      from leaderboard_current;
    `;
    const total = totalRes.rows?.[0]?.c ?? 0;

    const rowsRes = await sql`
      select address, rank, total_points, account_level, twitter_handle, last_activity, delta_rank, delta_points
      from leaderboard_current
      order by rank asc nulls last, total_points desc nulls last
      limit ${pageSize} offset ${offset};
    `;

    return Response.json({ rows: rowsRes.rows, total });
  }
}

