import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export const revalidate = 0;
export const maxDuration = 300; // 5 minutes on Vercel

// -------- Types --------
type ProcessResult = {
  address: string;
  rank: number | null;
  totalPoints: number | null;
  delta_rank: number;
  delta_points: number;
};

type FailItem = { address: string; error: string };

// -------- Helpers --------
function isAuthorized(req: Request): boolean {
  const envKey = process.env.CRON_KEY || "";
  if (!envKey) return true; // allow if no key set (dev)
  const url = new URL(req.url);
  const qKey = url.searchParams.get("key");
  const hKey = req.headers.get("x-cron-key");
  return qKey === envKey || hKey === envKey;
}

async function fetchJSON(url: string, ms = 20000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function processOne(addr: string): Promise<ProcessResult> {
  // 1) call external API
  const api = `https://hypergas.vercel.app/api/prjx-user-data?walletAddress=${addr}`;
  const data = await fetchJSON(api);

  // 2) parse fields robustly
  const rank: number | null =
    typeof data?.rank === "number" ? data.rank : (data?.stats?.rank ?? null);

  const totalPointsRaw =
    data?.totalPoints ?? data?.stats?.totalPoints ?? data?.rawData?.stats?.totalPoints ?? null;
  const totalPoints: number | null =
    totalPointsRaw == null ? null : Number.isFinite(Number(totalPointsRaw)) ? Number(totalPointsRaw) : null;

  const accountLevel: string | null =
    data?.accountLevel ?? data?.rawData?.stats?.accountLevel ?? null;

  const twitterHandle: string | null =
    data?.twitterHandle ?? data?.rawData?.user?.twitterHandle ?? null;

  const lastActivityISO: string | null = data?.lastActivity ?? null; // keep ISO
  const lastActivityParam: string | null =
    lastActivityISO ? new Date(lastActivityISO).toISOString() : null;

  // 3) insert daily snapshot (idempotent)
  await sql`
    insert into daily_snapshots (snapshot_date, address, rank, total_points, account_level, twitter_handle, last_activity)
    values (current_date, ${addr}, ${rank}, ${totalPoints}, ${accountLevel}, ${twitterHandle}, ${lastActivityParam})
    on conflict do nothing;
  `;

  // 4) compute deltas vs previous
  const prevRes = await sql<{ rank: number | null; total_points: number | null }>`
    select rank, total_points
    from leaderboard_current
    where address = ${addr}
  `;
  const prev = (prevRes.rows[0] as { rank: number | null; total_points: number | null } | undefined) ?? null;

  const prevRank = prev?.rank ?? null;
  const prevPoints = prev?.total_points ?? null;

  const delta_rank =
    prevRank != null && rank != null ? (prevRank as number) - (rank as number) : 0;

  const delta_points =
    prevPoints != null && totalPoints != null
      ? Number(totalPoints) - Number(prevPoints)
      : 0;

  // 5) upsert current row (all params must be primitives)
  await sql`
    insert into leaderboard_current (
      address, rank, total_points, account_level, twitter_handle, last_activity, delta_rank, delta_points
    ) values (
      ${addr}, ${rank}, ${totalPoints}, ${accountLevel}, ${twitterHandle},
      ${lastActivityParam}, ${delta_rank}, ${delta_points}
    )
    on conflict (address) do update set
      rank = excluded.rank,
      total_points = excluded.total_points,
      account_level = excluded.account_level,
      twitter_handle = excluded.twitter_handle,
      last_activity = excluded.last_activity,
      delta_rank = excluded.delta_rank,
      delta_points = excluded.delta_points
  `;

  return { address: addr, rank, totalPoints, delta_rank, delta_points };
}

async function runJob(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  await ensureSchema();

  // read wallets list
  const wallets = await sql<{ address: string }>`
    select address from wallets order by address asc
  `;
  const rows: { address: string }[] = wallets.rows;
  const addrs: string[] = rows.map(({ address }) => address);

  const results: ProcessResult[] = [];
  const fails: FailItem[] = [];

  // sequential to avoid rate-limit; tiny delay
  for (const addr of addrs) {
    try {
      const res = await processOne(addr);
      results.push(res);
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    } catch (e: any) {
      fails.push({ address: addr, error: e?.message ?? "unknown error" });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: addrs.length,
    updated: results.length,
    failed: fails.length,
    fails: fails.slice(0, 10), // sample for debugging
  });
}

// -------- Handlers --------
export async function GET(req: Request) {
  return runJob(req);
}
export async function POST(req: Request) {
  return runJob(req);
}
