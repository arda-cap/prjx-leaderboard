import { sql } from "@vercel/postgres";

export async function ensureSchema() {
  await sql`
    create table if not exists wallets (
      address text primary key,
      created_at timestamptz default now()
    );
  `;

  await sql`
    create table if not exists leaderboard_current (
      address text primary key references wallets(address) on delete cascade,
      rank int,
      total_points numeric,
      account_level text,
      twitter_handle text,
      last_activity timestamptz,
      updated_at timestamptz default now(),
      delta_rank int,
      delta_points numeric
    );
  `;

  await sql`
    create table if not exists daily_snapshots (
      snapshot_date date not null,
      address text not null references wallets(address) on delete cascade,
      rank int,
      total_points numeric,
      account_level text,
      twitter_handle text,
      last_activity timestamptz,
      primary key (snapshot_date, address)
    );
  `;

  await sql`create index if not exists idx_leaderboard_rank on leaderboard_current (rank);`;
  await sql`create index if not exists idx_leaderboard_points on leaderboard_current (total_points desc);`;
  await sql`create index if not exists idx_snapshots_date on daily_snapshots (snapshot_date);`;
}

export function isAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
