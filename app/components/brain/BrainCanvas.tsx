"use client";

import { useMemo, useRef, useState } from "react";
import { HubNode, SynapseNode, WIDTH, HEIGHT } from "@/lib/brain/layout";
import { hemisphereBlobPath } from "@/lib/brain/silhouette";
import { CLUSTER_COLORS } from "@/lib/brain/clusters";
import { ClusterId, Synapse } from "@/lib/brain/types";

function recencyOpacity(updatedAt: string): number {
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000;
  if (days <= 7) return 1;
  if (days >= 90) return 0.35;
  return 1 - (days - 7) * (0.65 / 83);
}

export default function BrainCanvas({
  hubs,
  nodes,
  activeCluster,
  onSelectCluster,
  onSelectSynapse,
}: {
  hubs: HubNode[];
  nodes: SynapseNode[];
  activeCluster: ClusterId | null;
  onSelectCluster: (c: ClusterId | null) => void;
  onSelectSynapse: (s: Synapse) => void;
}) {
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setView((v) => {
      const next = Math.min(3, Math.max(0.5, v.scale - e.deltaY * 0.001));
      return { ...v, scale: next };
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    setIsDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setView((v) => ({ ...v, tx: dragRef.current!.tx + dx, ty: dragRef.current!.ty + dy }));
  }
  function onPointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  const blobs = useMemo(
    () => [
      hemisphereBlobPath(WIDTH / 2 - 220, HEIGHT / 2 + 10, 260, 260, 1.3),
      hemisphereBlobPath(WIDTH / 2 + 220, HEIGHT / 2 + 10, 260, 260, 4.1),
    ],
    []
  );

  const visibleNodes = activeCluster ? nodes.filter((n) => n.synapse.cluster === activeCluster) : nodes;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-full touch-none select-none"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <g transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
        {blobs.map((d, i) => (
          <path key={i} d={d} fill="var(--card)" stroke="var(--rule)" strokeWidth={1.5} />
        ))}

        {hubs.map((h) => {
          const dimmed = activeCluster && activeCluster !== h.cluster;
          return (
            <g
              key={h.cluster}
              transform={`translate(${h.x ?? 0},${h.y ?? 0})`}
              onClick={() => onSelectCluster(activeCluster === h.cluster ? null : h.cluster)}
              style={{ cursor: "pointer", opacity: dimmed ? 0.35 : 1 }}
            >
              <circle r={h.count > 0 ? 10 : 6} fill={CLUSTER_COLORS[h.cluster]} stroke="var(--paper)" strokeWidth={2} />
              <text
                y={-16}
                textAnchor="middle"
                className="fill-ink"
                style={{ fontSize: 11, fontFamily: "var(--font-sans)" }}
              >
                {h.label}
              </text>
            </g>
          );
        })}

        {visibleNodes.map((n) => (
          <circle
            key={n.synapse.id}
            cx={n.x ?? 0}
            cy={n.y ?? 0}
            r={n.r}
            fill={CLUSTER_COLORS[n.synapse.cluster]}
            opacity={recencyOpacity(n.synapse.updatedAt)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSynapse(n.synapse);
            }}
            style={{ cursor: "pointer" }}
          />
        ))}
      </g>
    </svg>
  );
}
