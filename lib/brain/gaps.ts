import { ClusterId, Synapse } from "./types";
import { CLUSTERS } from "./clusters";

export interface ClusterStat {
  cluster: ClusterId;
  label: string;
  count: number;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
}

export function computeClusterStats(synapses: Synapse[], now: Date = new Date()): ClusterStat[] {
  const byCluster = new Map<ClusterId, Synapse[]>();
  for (const s of synapses) {
    const list = byCluster.get(s.cluster) ?? [];
    list.push(s);
    byCluster.set(s.cluster, list);
  }

  return CLUSTERS.filter((c) => c.id !== "misc").map((c) => {
    const list = byCluster.get(c.id) ?? [];
    const lastActiveAt =
      list.length > 0
        ? list.reduce((max, s) => (s.updatedAt > max ? s.updatedAt : max), list[0].updatedAt)
        : null;
    const daysSinceActive = lastActiveAt
      ? Math.floor((now.getTime() - new Date(lastActiveAt).getTime()) / 86400000)
      : null;
    return { cluster: c.id, label: c.label, count: list.length, lastActiveAt, daysSinceActive };
  });
}

// Stale = has history but hasn't been touched in a while; distinct from
// clusters with zero synapses at all (never engaged with).
export function staleness(stat: ClusterStat): "active" | "cooling" | "stale" | "untouched" {
  if (stat.count === 0) return "untouched";
  if (stat.daysSinceActive === null) return "untouched";
  if (stat.daysSinceActive <= 10) return "active";
  if (stat.daysSinceActive <= 25) return "cooling";
  return "stale";
}
