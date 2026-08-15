import { forceSimulation, forceManyBody, forceLink, forceCollide, SimulationNodeDatum } from "d3-force";
import { ClusterId, Synapse } from "./types";

export const WIDTH = 900;
export const HEIGHT = 640;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

// Hand-placed hub anchors, roughly grouped into a "left hemisphere" (build
// projects), "right hemisphere" (people/knowledge-facing work), and a
// central strip (personal/cross-cutting) — evocative, not anatomical.
export const HUB_ANCHORS: Record<ClusterId, { x: number; y: number; label: string }> = {
  collegeos: { x: CX - 230, y: CY - 140, label: "CollegeOS" },
  holoforge: { x: CX - 260, y: CY + 30, label: "HoloForge" },
  meza: { x: CX - 190, y: CY + 190, label: "Meza" },
  foodsafe: { x: CX - 90, y: CY + 250, label: "FoodSafe India" },
  "client-work": { x: CX - 40, y: CY + 60, label: "Client Work" },
  restaurant: { x: CX + 90, y: CY + 250, label: "Restaurant Venture" },
  academics: { x: CX + 230, y: CY - 140, label: "Academics" },
  mun: { x: CX + 260, y: CY + 30, label: "MUN" },
  career: { x: CX + 190, y: CY + 190, label: "Career & Research" },
  personal: { x: CX + 40, y: CY - 220, label: "Personal" },
  misc: { x: CX - 40, y: CY - 250, label: "Misc" },
};

export interface HubNode extends SimulationNodeDatum {
  kind: "hub";
  cluster: ClusterId;
  label: string;
  count: number;
}

export interface SynapseNode extends SimulationNodeDatum {
  kind: "synapse";
  synapse: Synapse;
  r: number;
}

export type GraphNode = HubNode | SynapseNode;

export function buildLayout(synapses: Synapse[]): { hubs: HubNode[]; nodes: SynapseNode[] } {
  const counts = new Map<ClusterId, number>();
  for (const s of synapses) counts.set(s.cluster, (counts.get(s.cluster) ?? 0) + 1);

  const hubs: HubNode[] = (Object.keys(HUB_ANCHORS) as ClusterId[]).map((cluster) => {
    const anchor = HUB_ANCHORS[cluster];
    return {
      kind: "hub",
      cluster,
      label: anchor.label,
      count: counts.get(cluster) ?? 0,
      x: anchor.x,
      y: anchor.y,
      fx: anchor.x,
      fy: anchor.y,
    };
  });

  const nodes: SynapseNode[] = synapses.map((s) => {
    const anchor = HUB_ANCHORS[s.cluster];
    const jitter = () => (Math.random() - 0.5) * 40;
    return {
      kind: "synapse",
      synapse: s,
      r: Math.max(3, Math.min(11, 3 + Math.sqrt(s.messageCount))),
      x: anchor.x + jitter(),
      y: anchor.y + jitter(),
    };
  });

  const hubById = new Map(hubs.map((h) => [h.cluster, h]));
  const links = nodes.map((n) => ({ source: n, target: hubById.get(n.synapse.cluster)! }));

  const sim = forceSimulation<GraphNode>([...hubs, ...nodes])
    .force(
      "link",
      forceLink(links)
        .distance(28)
        .strength(0.35)
    )
    .force("charge", forceManyBody().strength(-6).distanceMax(60))
    .force(
      "collide",
      forceCollide<GraphNode>().radius((d) => (d.kind === "hub" ? 26 : (d as SynapseNode).r + 1.5))
    )
    .stop();

  for (let i = 0; i < 260; i++) sim.tick();

  return { hubs, nodes };
}
