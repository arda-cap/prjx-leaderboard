import { ensureSchema } from "@/lib/db";
import { sql } from "@vercel/postgres";
import { DateTime } from "luxon";

export const revalidate = 0;

export async function GET() {
  await ensureSchema();
  const paris = DateTime.now().setZone("Europe/Paris");
  const today = paris.toISODate();
  const yesterday = paris.minus({ days: 1 }).toISODate();

  const pts = await sql`
    select s.address, (s.total_points - y.total_points) as delta_points
    from daily_snapshots s
    join daily_snapshots y on y.address = s.address and y.snapshot_date = ${yesterday}
    where s.snapshot_date = ${today}
    order by delta_points desc nulls last
    limit 1;
  `;
  const rk = await sql`
    select s.address, (y.rank - s.rank) as delta_rank
    from daily_snapshots s
    join daily_snapshots y on y.address = s.address and y.snapshot_date = ${yesterday}
    where s.snapshot_date = ${today}
    order by delta_rank desc nulls last
    limit 1;
  `;

  return Response.json({
    topPoints: pts.rows[0] ? { address: pts.rows[0].address, value: Math.round(Number(pts.rows[0].delta_points ?? 0)) } : null,
    topRank: rk.rows[0] ? { address: rk.rows[0].address, value: Number(rk.rows[0].delta_rank ?? 0) } : null
  });
}
