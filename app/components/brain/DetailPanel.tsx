import { Synapse } from "@/lib/brain/types";
import { CLUSTERS, CLUSTER_COLORS } from "@/lib/brain/clusters";

export default function DetailPanel({ synapse, onClose }: { synapse: Synapse; onClose: () => void }) {
  const clusterLabel = CLUSTERS.find((c) => c.id === synapse.cluster)?.label ?? synapse.cluster;
  const date = new Date(synapse.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: CLUSTER_COLORS[synapse.cluster] }}
        >
          {clusterLabel}
        </span>
        <button onClick={onClose} className="text-ink-quiet hover:text-ink text-sm">
          ✕
        </button>
      </div>
      <p className="font-serif text-lg text-ink leading-snug">{synapse.label}</p>
      <span className="text-xs text-ink-quiet">
        {date} · {synapse.messageCount} messages
      </span>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {synapse.summary || "(no summary)"}
      </p>
    </div>
  );
}
