import TopPerformers from "@/components/TopPerformers";
import LeaderboardTable from "@/components/LeaderboardTable";
import { headers } from "next/headers";

async function fetchTop(){
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || process.env.VERCEL_URL || "";
    const base = host.startsWith("http") ? host : `https://${host}`;
    const res = await fetch(`${base}/api/top-performers`, { cache: 'no-store' });
    return await res.json();
  } catch {
    return { topPoints: null, topRank: null };
  }
}

export default async function Page(){
  const { topPoints, topRank } = await fetchTop();
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-prjx-muted">Overview</div>
              <h1 className="text-2xl md:text-3xl font-grotesk font-semibold tracking-tight">Total Points</h1>
            </div>
            <div className="btn btn-accent">Export CSV</div>
          </div>
          <p className="mt-2 text-prjx-muted text-sm">Daily snapshots. Trigger manually from your dashboard/terminal when needed.</p>
        </div>
        <div className="card p-6">
          <div className="text-sm text-prjx-muted">Status</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-prjx-accent animate-pulse" />
            <div className="text-sm">Manual mode enabled</div>
          </div>
        </div>
      </section>

      <TopPerformers topPoints={topPoints} topRank={topRank} />
      <LeaderboardTable />
    </div>
  );
}
