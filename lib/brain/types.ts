export type ClusterId =
  | "collegeos"
  | "holoforge"
  | "meza"
  | "foodsafe"
  | "client-work"
  | "restaurant"
  | "academics"
  | "mun"
  | "career"
  | "personal"
  | "misc";

export interface ClusterMeta {
  id: ClusterId;
  label: string;
}

export interface Synapse {
  id: string; // conversation uuid
  label: string; // conversation name (or fallback)
  cluster: ClusterId;
  summary: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  messageCount: number;
}

export interface BrainData {
  generatedAt: string;
  synapses: Synapse[];
}
