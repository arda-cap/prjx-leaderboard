export default function DeltaBadge({ value, fallback = "NEW", type = "rank" }: { value: number | null | undefined, fallback?: string, type?: "rank" | "points" }) {
  if (value === null || value === undefined) return <span className="badge badge-gray">{fallback}</span>;
  if (value > 0) return <span className="badge badge-green">+{value}</span>;
  if (value === 0) return <span className="badge badge-amber">=</span>;
  return <span className="badge badge-red">{value}</span>;
}
