'use client';
import { useEffect, useState } from "react";
import DeltaBadge from "./DeltaBadge";

type Row = {
  address: string;
  rank: number | null;
  total_points: number | null;
  account_level: string | null;
  twitter_handle: string | null;
  last_activity: string | null;
  delta_rank: number | null;
  delta_points: number | null;
};

type ApiResp = { rows: Row[]; total: number; };

export default function LeaderboardTable(){
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResp>({ rows: [], total: 0 });

  async function load(p = page, q = query){
    setLoading(true);
    const res = await fetch(`/api/leaderboard?page=${p}&pageSize=100&query=${encodeURIComponent(q)}`, { cache: 'no-store' });
    const j = await res.json();
    setData(j);
    setLoading(false);
  }

  useEffect(()=>{ load(1, query); }, [query]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-prjx-muted">Showing {data.rows.length} of {data.total.toLocaleString()} addresses</div>
        <div className="flex items-center gap-2">
          <input className="input" placeholder="Search address or handle..." onKeyDown={(e)=>{ if (e.key==='Enter') setQuery((e.target as HTMLInputElement).value)}}/>
          <button className="btn btn-accent" onClick={()=>load(1, (document.querySelector('input.input') as HTMLInputElement)?.value ?? '')}>Search</button>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-prjx-line">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Address</th>
              <th className="text-right px-4 py-3">Total Points</th>
              <th className="text-right px-4 py-3">Δ Points</th>
              <th className="text-right px-4 py-3">Rank</th>
              <th className="text-right px-4 py-3">Δ Rank</th>
              <th className="text-left px-4 py-3">Account</th>
              <th className="text-left px-4 py-3">Twitter</th>
              <th className="text-left px-4 py-3">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i)=> (
              <tr key={r.address} className="border-b border-prjx-line/60 hover:bg-gray-50/50">
                <td className="px-4 py-3">{(i+1) + (page-1)*100}</td>
                <td className="px-4 py-3 font-mono">{r.address}</td>
                <td className="px-4 py-3 text-right">{r.total_points !== null ? Math.round(Number(r.total_points)).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-right"><DeltaBadge value={r.delta_points !== null ? Math.round(Number(r.delta_points)) : null} type="points" /></td>
                <td className="px-4 py-3 text-right">{r.rank ?? '—'}</td>
                <td className="px-4 py-3 text-right"><DeltaBadge value={r.delta_rank} type="rank" /></td>
                <td className="px-4 py-3">{r.account_level ?? '—'}</td>
                <td className="px-4 py-3">{r.twitter_handle ?? '—'}</td>
                <td className="px-4 py-3">{r.last_activity ? new Date(r.last_activity).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex items-center justify-between">
        <button className="btn" onClick={()=>{ if(page>1){ setPage(p=>p-1); load(page-1);} }} disabled={page===1}>Prev</button>
        <div className="text-sm">Page {page}</div>
        <button className="btn" onClick={()=>{ if(data.rows.length===100){ setPage(p=>p+1); load(page+1);} }} disabled={data.rows.length<100}>Next</button>
      </div>
    </div>
  );
}
