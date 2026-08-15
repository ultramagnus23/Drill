import { ClusterId, ClusterMeta } from "./types";

export const CLUSTERS: ClusterMeta[] = [
  { id: "collegeos", label: "CollegeOS" },
  { id: "holoforge", label: "HoloForge" },
  { id: "meza", label: "Meza" },
  { id: "foodsafe", label: "FoodSafe India" },
  { id: "client-work", label: "Client Work" },
  { id: "restaurant", label: "Restaurant Venture" },
  { id: "academics", label: "Academics" },
  { id: "mun", label: "MUN" },
  { id: "career", label: "Career & Research" },
  { id: "personal", label: "Personal" },
  { id: "misc", label: "Misc" },
];

// Keyword scoring rules, checked against lowercased "name. summary" text.
// The cluster with the highest match count wins; ties broken by array order above.
export const KEYWORDS: Record<ClusterId, RegExp[]> = {
  collegeos: [
    /collegeos/, /college os/, /college-os/, /chancing/, /scorecard/,
    /college_os/, /ipeds/, /nirf/, /supabase.*colleges?/, /college discovery/,
    /college application/,
  ],
  holoforge: [
    /holoforge/, /hologram/, /holograph/, /galvanometer/, /volumetric/,
    /voxel/, /photopolymer/, /optics express/, /optica open/, /\bcgh\b/,
    /plasma.*display/, /laser ionization/, /digital twin/, /asm propagation/,
    /kogelnik/, /rcwa/,
  ],
  meza: [/\bmeza\b/, /mezza guitar/, /pos-csv/, /pos csv/, /attach-rate/, /menu-mix/, /turnover.*dwell/],
  foodsafe: [/foodsafe/, /food safe/, /foscos/, /fscos/],
  "client-work": [
    /airthra/, /neelkanth/, /kts fertilizer/, /boiler inquiry/, /\bngt fines?\b/,
    /\bcpcb\b/, /construction materials/, /the global,? jaipur/,
  ],
  restaurant: [
    /restaurant/, /worldtour/, /world tour/, /immersive dining/, /supper club/,
    /\bpassport\b.*dining/, /rotating (restaurant|menu)/, /fine dining/,
  ],
  academics: [
    /\bessay\b/, /\bexam\b/, /midterm/, /\bgpa\b/, /\bcgpa\b/, /\bcourse\b/,
    /professor/, /assignment/, /paper marking/, /ib economics/, /a-levels?/,
    /psychology program/, /archives management/, /extra credit/, /\bics\b/,
    /discrete math/, /rubric/,
  ],
  mun: [/\bmun\b/, /model un/, /\bhrc\b/, /jpjmun/, /humanitarian crisis/, /rules of procedure/, /vice chairperson/],
  career: [
    /internship/, /research credibility/, /cold email/, /exchange semester/,
    /\bubc\b/, /leiden/, /\bgsoc\b/, /\block\b/, /\blfx\b/, /portfolio review/,
    /github profile/, /job board/, /job fit/, /techmin/, /founder to vc/,
    /investor pitch/, /nomination/, /research paper quality/, /publication readiness/,
    /journal submission/,
  ],
  personal: [
    /credit card/, /\binvest(ing|ment)?\b/, /instagram/, /morning routine/,
    /photo frame/, /casual check/, /^hi$/, /^hey/, /remember ath/, /humanization/,
    /tuition/, /cashback/, /^💬/,
  ],
  misc: [],
};

export const CLUSTER_COLORS: Record<ClusterId, string> = {
  collegeos: "#5b8def",
  holoforge: "#c85bef",
  meza: "#3fbf8f",
  foodsafe: "#e0b23f",
  "client-work": "#8f8f8f",
  restaurant: "#e0673f",
  academics: "#4fb0d9",
  mun: "#d94f7c",
  career: "#8f6fe0",
  personal: "#e0d43f",
  misc: "#7a7a7a",
};

export function classify(text: string): ClusterId {
  const lower = text.toLowerCase();
  let best: ClusterId = "misc";
  let bestScore = 0;
  for (const cluster of CLUSTERS) {
    if (cluster.id === "misc") continue;
    const patterns = KEYWORDS[cluster.id];
    const score = patterns.reduce((n, re) => n + (re.test(lower) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = cluster.id;
    }
  }
  return best;
}
