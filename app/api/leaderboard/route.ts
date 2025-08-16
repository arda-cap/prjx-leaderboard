import { ensureSchema } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const revalidate = 0;

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(250, Number(searchParams.get("pageSize") ?? "100"));
  const query = (searchParams.get("query") ?? "").trim();
  const offset = (page - 1) * pageSize;

  let where = "";
  let params: any[] = [];
  if (query) {
    where = "where address ilike $1 or coalesce(twitter_handle,'') ilike $1";
    params.push(`%${query}%`);
  }

  const totalRes = await sql`select count(*)::int as c from leaderboard_current ${sql.raw(where)};`.catch(()=>({ rows:[{c:0}]}));
  const total = totalRes.rows[0]?.c ?? 0;

  const rows = await sql`
    select address, rank, total_points, account_level, twitter_handle, last_activity, delta_rank, delta_points
    from leaderboard_current
    ${sql.raw(where)}
    order by rank asc nulls last, total_points desc nulls last
    limit ${pageSize} offset ${offset};
  `;

  return Response.json({ rows: rows.rows, total });
}
