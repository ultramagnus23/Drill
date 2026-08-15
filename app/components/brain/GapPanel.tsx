import { ClusterStat, staleness } from "@/lib/brain/gaps";
import { CLUSTER_COLORS } from "@/lib/brain/clusters";
import { ClusterId } from "@/lib/brain/types";

export default function GapPanel({
  stats,
  activeCluster,
  onSelectCluster,
}: {
  stats: ClusterStat[];
  activeCluster: ClusterId | null;
  onSelectCluster: (c: ClusterId | null) => void;
}) {
  const sorted = [...stats].sort((a, b) => {
    const da = a.daysSinceActive ?? Infinity;
    const db = b.daysSinceActive ?? Infinity;
    return db - da;
  });

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((s) => {
        const state = staleness(s);
        const isActive = activeCluster === s.cluster;
        return (
          <li key={s.cluster}>
            <button
              onClick={() => onSelectCluster(isActive ? null : s.cluster)}
              className={`w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded-md hover:bg-card ${
                isActive ? "bg-card" : ""
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CLUSTER_COLORS[s.cluster] }}
              />
              <span className="text-ink flex-1">{s.label}</span>
              <span className="text-ink-quiet text-xs">
                {s.count === 0
                  ? "untouched"
                  : `${s.count} · ${state}${
                      s.daysSinceActive !== null ? ` · ${s.daysSinceActive}d` : ""
                    }`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
