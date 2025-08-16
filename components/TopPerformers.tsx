export type TopItem = { address: string; value: number };

export default function TopPerformers({ topPoints, topRank } : { topPoints: TopItem | null, topRank: TopItem | null }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="card p-5">
        <div className="text-sm text-prjx-muted">Top Points Gainer (24h)</div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-grotesk font-semibold">{topPoints ? `+${Math.round(topPoints.value).toLocaleString()}` : "—"}</div>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{topPoints?.address ?? "—"}</code>
        </div>
      </div>
      <div className="card p-5">
        <div className="text-sm text-prjx-muted">Top Rank Gainer (24h)</div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-grotesk font-semibold">{topRank ? `+${topRank.value}` : "—"}</div>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{topRank?.address ?? "—"}</code>
        </div>
      </div>
    </section>
  );
}
