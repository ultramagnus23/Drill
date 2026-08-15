// Offline, local-only import: turns a Claude.ai data export into the Brain
// visualization's synapse graph. Reads data-import/conversations.json (the
// unzipped export, gitignored) and writes data/brain/synapses.json (also
// gitignored). Nothing here ever runs against a live API and nothing it
// produces is committed or bundled into the app.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { classify } from "../lib/brain/clusters";
import { BrainData, Synapse } from "../lib/brain/types";

interface RawConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  chat_messages: unknown[];
}

const inputPath = resolve(__dirname, "../data-import/conversations.json");
if (!existsSync(inputPath)) {
  console.error(
    `Missing ${inputPath}\n\nExport your Claude.ai data (Settings -> Data controls -> Export data), ` +
      `unzip it, and place the contents in data-import/ before running this script.`
  );
  process.exit(1);
}

const raw: RawConversation[] = JSON.parse(readFileSync(inputPath, "utf8"));

const synapses: Synapse[] = raw.map((c) => {
  const label = c.name?.trim() || c.summary?.slice(0, 60) || "(untitled)";
  const classifyText = `${c.name ?? ""}. ${c.summary ?? ""}`;
  return {
    id: c.uuid,
    label,
    cluster: classify(classifyText),
    summary: c.summary ?? "",
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    messageCount: c.chat_messages?.length ?? 0,
  };
});

synapses.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const output: BrainData = {
  generatedAt: new Date().toISOString(),
  synapses,
};

const outDir = resolve(__dirname, "../data/brain");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "synapses.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

const byCluster = new Map<string, number>();
for (const s of synapses) byCluster.set(s.cluster, (byCluster.get(s.cluster) ?? 0) + 1);

console.log(`Wrote ${synapses.length} synapses to ${outPath}`);
console.log(
  "Per cluster:",
  Array.from(byCluster.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ")
);
