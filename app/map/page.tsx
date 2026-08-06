"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/app/components/Nav";
import { getAllSessions } from "@/lib/db";
import { isPending } from "@/lib/session";
import { Session } from "@/lib/types";

interface DomainStat {
  domain: string;
  count: number;
  avgDepth: number;
}

export default function MapPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await getAllSessions();
      setSessions(all.filter((s) => !isPending(s)));
      setLoading(false);
    })();
  }, []);

  const stats: DomainStat[] = useMemo(() => {
    const byDomain = new Map<string, Session[]>();
    for (const s of sessions) {
      const list = byDomain.get(s.domain) ?? [];
      list.push(s);
      byDomain.set(s.domain, list);
    }
    return Array.from(byDomain.entries())
      .map(([domain, list]) => ({
        domain,
        count: list.length,
        avgDepth: list.reduce((sum, s) => sum + s.depth, 0) / list.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  const maxCount = Math.max(1, ...stats.map((s) => s.count));

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <div className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto flex flex-col gap-6">
        <h1 className="font-serif text-2xl text-ink">Map</h1>

        {loading && <p className="text-sm text-ink-quiet">Loading…</p>}
        {!loading && stats.length === 0 && (
          <p className="text-sm text-ink-quiet">Nothing recorded yet.</p>
        )}

        <ul className="flex flex-col gap-4">
          {stats.map((s) => (
            <li key={s.domain} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-ink">{s.domain}</span>
                <span className="text-ink-quiet">
                  {s.count} · avg depth {s.avgDepth.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-rule rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink-quiet"
                  style={{ width: `${(s.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
