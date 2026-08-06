// Offline, one-time topic bank generation. Run with: npm run generate:topics
// Reads scripts/topics-data.ts (hand-authored topics) and writes public/topics.json.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { DATA } from "./topics-data";

interface Topic {
  id: string;
  topic: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
}

const domainPrefix: Record<string, string> = {
  cs: "cs",
  "software-engineering": "swe",
  ml: "ml",
  finance: "fin",
  economics: "eco",
  philosophy: "phi",
  cogsci: "cog",
  geopolitics: "geo",
  history: "his",
  physics: "phy",
  chemistry: "chm",
  biology: "bio",
  "earth-science": "ear",
  mathematics: "mat",
  art: "art",
  music: "mus",
  literature: "lit",
  sport: "spo",
  food: "foo",
  media: "med",
  everyday: "evr",
};

const topics: Topic[] = [];
const seen = new Set<string>();

for (const [domain, entries] of Object.entries(DATA)) {
  const prefix = domainPrefix[domain];
  if (!prefix) throw new Error(`No id prefix configured for domain "${domain}"`);
  entries.forEach(([topic, difficulty, tags], i) => {
    if (seen.has(topic)) throw new Error(`Duplicate topic text: "${topic}"`);
    seen.add(topic);
    const id = `${prefix}-${String(i + 1).padStart(4, "0")}`;
    topics.push({ id, topic, domain, difficulty, tags });
  });
}

if (topics.length < 800) {
  throw new Error(`Only generated ${topics.length} topics, need at least 800.`);
}

const byDomain = Object.entries(DATA).map(([d, e]) => `${d}: ${e.length}`).join(", ");
const byDifficulty = [1, 2, 3].map(
  (d) => `${d}: ${topics.filter((t) => t.difficulty === d).length}`
).join(", ");

const outPath = resolve(__dirname, "../public/topics.json");
writeFileSync(outPath, JSON.stringify(topics, null, 2) + "\n");

console.log(`Wrote ${topics.length} topics to ${outPath}`);
console.log(`Per domain: ${byDomain}`);
console.log(`Per difficulty: ${byDifficulty}`);
