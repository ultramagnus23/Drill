"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/app/components/Nav";
import BrainCanvas from "@/app/components/brain/BrainCanvas";
import DetailPanel from "@/app/components/brain/DetailPanel";
import GapPanel from "@/app/components/brain/GapPanel";
import { buildLayout } from "@/lib/brain/layout";
import { computeClusterStats } from "@/lib/brain/gaps";
import { BrainData, ClusterId, Synapse } from "@/lib/brain/types";

type Status = "loading" | "empty" | "ready";

export default function BrainPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<BrainData | null>(null);
  const [activeCluster, setActiveCluster] = useState<ClusterId | null>(null);
  const [selected, setSelected] = useState<Synapse | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/brain");
      if (!res.ok) {
        setStatus("empty");
        return;
      }
      const json = (await res.json()) as BrainData;
      setData(json);
      setStatus("ready");
    })();
  }, []);

  const layout = useMemo(() => (data ? buildLayout(data.synapses) : null), [data]);
  const stats = useMemo(() => (data ? computeClusterStats(data.synapses) : []), [data]);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />

      {status === "loading" && (
        <div className="flex-1 flex items-center justify-center text-sm text-ink-quiet">Loading…</div>
      )}

      {status === "empty" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-serif text-xl text-ink">No brain data yet.</p>
          <p className="text-sm text-ink-quiet max-w-md">
            Export your Claude.ai data, unzip it into <code>data-import/</code>, then run{" "}
            <code>npm run generate:brain</code>.
          </p>
        </div>
      )}

      {status === "ready" && layout && (
        <div className="flex-1 flex min-h-0">
          <aside className="w-64 shrink-0 border-r border-rule px-4 py-6 overflow-y-auto">
            <h2 className="text-xs uppercase tracking-widest text-ink-quiet mb-3">Regions</h2>
            <GapPanel stats={stats} activeCluster={activeCluster} onSelectCluster={setActiveCluster} />
          </aside>

          <div className="flex-1 min-w-0">
            <BrainCanvas
              hubs={layout.hubs}
              nodes={layout.nodes}
              activeCluster={activeCluster}
              onSelectCluster={setActiveCluster}
              onSelectSynapse={setSelected}
            />
          </div>

          {selected && (
            <aside className="w-80 shrink-0 border-l border-rule px-4 py-6">
              <DetailPanel synapse={selected} onClose={() => setSelected(null)} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
