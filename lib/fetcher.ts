export type UserData = {
  referralCount: number;
  totalReferralRewards: number;
  accountLevel: string;
  lastActivity: string | null;
  twitterHandle: string | null;
  referrals: any[];
  totalPoints: number;
  rank: number;
};

export async function fetchUser(address: string, signal?: AbortSignal): Promise<UserData | null> {
  const url = `https://hypergas.vercel.app/api/prjx-user-data?walletAddress=${address}`;
  for (let i = 0; i < 3; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, { signal: signal ?? ctrl.signal, headers: { accept: "application/json" } });
      clearTimeout(t);
      if (!res.ok) continue;
      const j = await res.json();
      return {
        referralCount: j.referralCount ?? j.rawData?.stats?.totalReferrals ?? 0,
        totalReferralRewards: j.totalReferralRewards ?? 0,
        accountLevel: j.accountLevel ?? j.rawData?.user?.accountLevel ?? "Basic",
        lastActivity: j.lastActivity ?? null,
        twitterHandle: j.twitterHandle ?? j.rawData?.user?.twitterHandle ?? null,
        totalPoints: j.totalPoints ?? j.rawData?.stats?.totalPoints ?? 0,
        rank: j.rank ?? j.rawData?.stats?.rank ?? null
      } as any;
    } catch (e) {
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  return null;
}
