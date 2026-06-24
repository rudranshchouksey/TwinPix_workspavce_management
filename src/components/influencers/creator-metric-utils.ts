const WEEKS = 8;

function weekBucketIndex(date: Date, now: Date, weeks: number) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksAgo = Math.floor((now.getTime() - date.getTime()) / msPerWeek);
  return weeks - 1 - weeksAgo;
}

function buildWeeklySum(rows: { date: Date; value: number }[], weeks: number, now: Date): number[] {
  const buckets = new Array(weeks).fill(0);
  for (const row of rows) {
    const idx = weekBucketIndex(row.date, now, weeks);
    if (idx >= 0 && idx < weeks) buckets[idx] += row.value;
  }
  return buckets;
}

function buildWeeklyAvg(rows: { date: Date; value: number }[], weeks: number, now: Date): number[] {
  const sums = new Array(weeks).fill(0);
  const counts = new Array(weeks).fill(0);
  for (const row of rows) {
    const idx = weekBucketIndex(row.date, now, weeks);
    if (idx >= 0 && idx < weeks) {
      sums[idx] += row.value;
      counts[idx] += 1;
    }
  }
  return sums.map((s, i) => (counts[i] > 0 ? Math.round((s / counts[i]) * 100) / 100 : 0));
}

function growthPct(series: number[]): number | null {
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function buildWeekLabels(weeks: number, now: Date): string[] {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const labels: string[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const d = new Date(now.getTime() - w * msPerWeek);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return labels;
}

export interface CreatorKpis {
  followers: number;
  following: number;
  engagementRate: number;
  avgReelViews: number;
  totalPosts: number;
  campaignCount: number;
  responseRate: number;
  creatorScore: number | null;
  weekLabels: string[];
  postsCount: number;
  reelsCount: number;
  series: {
    followers: number[];
    following: number[];
    engagementRate: number[];
    avgReelViews: number[];
    totalPosts: number[];
    campaignCount: number[];
    responseRate: number[];
  };
  growth: {
    followers: number | null;
    following: number | null;
    engagementRate: number | null;
    avgReelViews: number | null;
    totalPosts: number | null;
    campaignCount: number | null;
    responseRate: number | null;
  };
}

export function computeCreatorKpis(influencer: any): CreatorKpis {
  const now = new Date();
  const posts = influencer.recentPosts || [];
  const reels = influencer.recentReels || [];
  const assignments = influencer.campaigns || [];
  const snapshots = (influencer.metricSnapshots || []).slice(-8);

  const followersSeries = snapshots.length >= 2 ? snapshots.map((s: any) => s.followers || 0) : [influencer.followers || 0, influencer.followers || 0];
  const followingSeries = snapshots.length >= 2 ? snapshots.map((s: any) => s.following || 0) : [influencer.following || 0, influencer.following || 0];

  const engagementSeries = buildWeeklyAvg(
    posts.map((p: any) => ({
      date: new Date(p.publishedDate),
      value: influencer.followers ? ((p.likes + p.comments) / influencer.followers) * 100 : 0,
    })),
    WEEKS,
    now
  );
  const engagementFallback = engagementSeries.every((v) => v === 0) ? new Array(WEEKS).fill(influencer.engagementRate || 0) : engagementSeries;

  const reelViewsSeries = buildWeeklyAvg(
    reels.map((r: any) => ({ date: new Date(r.publishedDate), value: r.views || 0 })),
    WEEKS,
    now
  );

  const postsFrequencySeries = buildWeeklySum(
    [...posts, ...reels].map((p: any) => ({ date: new Date(p.publishedDate), value: 1 })),
    WEEKS,
    now
  );

  const campaignCountSeries = buildWeeklySum(
    assignments.map((a: any) => ({ date: new Date(a.createdAt), value: 1 })),
    WEEKS,
    now
  );

  const responseRateSeries = (() => {
    const sorted = [...assignments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const series: number[] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const cutoff = new Date(now.getTime() - w * weekMs);
      const upToNow = sorted.filter((a) => new Date(a.createdAt) <= cutoff);
      const responded = upToNow.filter((a) => a.status !== "PENDING" && a.status !== "INVITED").length;
      series.push(upToNow.length > 0 ? Math.round((responded / upToNow.length) * 100) : 0);
    }
    return series;
  })();

  const totalAssignments = assignments.length;
  const respondedAssignments = assignments.filter((a: any) => a.status !== "PENDING" && a.status !== "INVITED").length;
  const responseRate = totalAssignments > 0 ? Math.round((respondedAssignments / totalAssignments) * 100) : 0;

  return {
    followers: influencer.followers || 0,
    following: influencer.following || 0,
    engagementRate: influencer.engagementRate || 0,
    avgReelViews: influencer.analytics?.avgReelViews || 0,
    totalPosts: influencer.posts || 0,
    campaignCount: assignments.length,
    responseRate,
    creatorScore: influencer.creatorIntelligence?.intelligenceScore ?? null,
    weekLabels: buildWeekLabels(WEEKS, now),
    postsCount: posts.length,
    reelsCount: reels.length,
    series: {
      followers: followersSeries,
      following: followingSeries,
      engagementRate: engagementFallback,
      avgReelViews: reelViewsSeries,
      totalPosts: postsFrequencySeries,
      campaignCount: campaignCountSeries,
      responseRate: responseRateSeries,
    },
    growth: {
      followers: snapshots.length >= 2 ? growthPct(followersSeries) : null,
      following: snapshots.length >= 2 ? growthPct(followingSeries) : null,
      engagementRate: growthPct(engagementFallback),
      avgReelViews: growthPct(reelViewsSeries),
      totalPosts: growthPct(postsFrequencySeries),
      campaignCount: growthPct(campaignCountSeries),
      responseRate: growthPct(responseRateSeries),
    },
  };
}
