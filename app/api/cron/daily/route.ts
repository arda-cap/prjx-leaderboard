import { ensureSchema, isAddress } from "@/lib/db";
import { sql } from "@vercel/postgres";
import { fetchUser } from "@/lib/fetcher";
import { DateTime } from "luxon";

export const maxDuration = 300;

async function handler(request: Request) {
  const url = new URL(request.url);

  // Auth (API key via header OR query string)
  const keyHeader = request.headers.get("x-cron-key");
  const keyQuery = url.searchParams.get("key");
  const force = url.searchParams.get("force") === "1";

  if (!process.env.CRON_KEY) {
    return new Response("Missing CRON_KEY env", { status: 500 });
  }
  if (keyHeader !== process.env.CRON_KEY && keyQuery !== process.env.CRON_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  await ensureSchema();

  const paris = DateTime.now().setZone("Europe/Paris");
  const today = paris.toISODate();
  const yesterday = paris.minus({ days: 1 }).toISODate();

  // Idempotence: skip if today's snapshot already exists (unless forced)
  if (!force) {
    const already = await sql`
      select 1 from daily_snapshots where snapshot_date = ${today} limit 1;
    `;
    if (already.rowCount && already.rowCount > 0) {
      return new Response("Already ran today (use ?force=1 to override)", { status: 200 });
    }
  }

  // Load all wallet addresses
  const res = await sql`select address from wallets;`;
  const addrs: string[] = res.rows.map((r) => r.address).filter(isAddress);

  // Simple concurrency pool (no p-limit)
  const concurrency = 25;
  const results: Array<
    | null
    | {
        addr: string;
        rank: number | null;
        totalPoints: number | null;
        accountLevel: string | null;
        twitterHandle: string | null;
        lastActivity: string | null;
      }
  > = [];

  for (let i = 0; i < addrs.length; i += concurrency) {
    const slice = addrs.slice(i, i + concurrency);
    const chunk = await Promise.all(
      slice.map(async (addr) => {
        const u = await fetchUser(addr);
        if (!u) return null;
        return {
          addr,
          rank: (u as any).rank ?? null,
          totalPoints: (u as any).totalPoints ?? null,
          accountLevel: (u as any).accountLevel ?? null,
          twitterHandle: (u as any).twitterHandle ?? null,
          lastActivity: (u as any).lastActivity ?? null,
        };
      })
    );
    results.push(...chunk);
    // tiny pause to avoid hammering the upstream API
    await new Promise((r) => setTimeout(r, 200));
  }

  // Write to DB
  for (const r of results) {
    if (!r) continue;
    const { addr, rank, totalPoints, accountLevel, twitterHandle, lastActivity } = r;

    // ✅ Ensure primitives for @vercel/postgres (string|null, not Date)
    const lastActIso = lastActivity ? new Date(lastActivity).toISOString() : null;

    // Insert today's snapshot (ignore conflicts)
    await sql`
      insert into daily_snapshots (
        snapshot_date, address, rank, total_points, account_level, twitter_handle, last_activity
      )
      values (${today}, ${addr}, ${rank}, ${totalPoints}, ${accountLevel}, ${twitterHandle}, ${lastActIso})
      on conflict do nothing;
    `;

    // Compute deltas vs yesterday
    const y = await sql`
      select rank, total_points
      from daily_snapshots
      where snapshot_date = ${yesterday} and address = ${addr}
      limit 1;
    `;

    const prevRank = y.rows[0]?.rank ?? null;
    const prevPts = y.rows[0]?.total_points ?? null;

    const deltaRank =
      prevRank !== null && prevRank !== undefined && rank !== null && rank !== undefined
        ? prevRank - rank
        : null;

    const deltaPoints =
      prevPts !== null && prevPts !== undefined && totalPoints !== null && totalPoints !== undefined
        ? Number(totalPoints) - Number(prevPts)
        : null;

    // Upsert current leaderboard view
    await sql`
      insert into leaderboard_current (
        address, rank, total_points, account_level, twitter_handle, last_activity, updated_at, delta_rank, delta_points
      )
      values (${addr}, ${rank}, ${totalPoints}, ${accountLevel}, ${twitterHandle}, ${lastActIso}, now(), ${deltaRank}, ${deltaPoints})
      on conflict (address) do update set
        rank = excluded.rank,
        total_points = excluded.total_points,
        account_level = excluded.account_level,
        twitter_handle = excluded.twitter_handle,
        last_activity = excluded.last_activity,
        updated_at = excluded.updated_at,
        delta_rank = excluded.delta_rank,
        delta_points = excluded.delta_points;
    `;
  }

  return new Response("OK");
}

export async function GET(request: Request) {
  return handler(request);
}
export async function POST(request: Request) {
  return handler(request);
}