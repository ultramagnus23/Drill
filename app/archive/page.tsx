"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import { loadTopics, topicById } from "@/lib/topics";
import { exportAllData } from "@/lib/export";
import { Session, TopicRecord } from "@/lib/types";

export default function ArchivePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sessionsRes, allTopics] = await Promise.all([
        fetch("/api/sessions").then((r) => r.json()),
        loadTopics(),
      ]);
      setSessions(sessionsRes.sessions ?? []);
      setTopics(allTopics);
      setLoading(false);
    })();
  }, []);

  const domains = useMemo(() => {
    const set = new Set(sessions.map((s) => s.domain));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered =
    domainFilter === "all" ? sessions : sessions.filter((s) => s.domain === domainFilter);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <div className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl text-ink">Archive</h1>
          {sessions.length > 0 && (
            <button
              onClick={() => exportAllData()}
              className="text-sm text-ink-quiet hover:text-ink underline underline-offset-4"
            >
              Export
            </button>
          )}
          {domains.length > 0 && (
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="ml-auto text-sm bg-card border border-rule rounded-md px-2 py-1 text-ink-quiet"
            >
              <option value="all">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading && <p className="text-sm text-ink-quiet">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-ink-quiet">Nothing here yet.</p>
        )}

        <ul className="flex flex-col divide-y divide-rule">
          {filtered.map((s) => {
            const topic = topicById(topics, s.topicId);
            return (
              <li key={s.id}>
                <Link
                  href={`/archive/${s.id}`}
                  className="flex flex-col gap-1 py-4 hover:opacity-80"
                >
                  <span className="text-xs text-ink-quiet">
                    {s.date} · {s.domain}
                    {s.isRevisit && " · revisit"}
                  </span>
                  <span className="font-serif text-lg text-ink leading-snug">
                    {topic?.topic ?? "Unknown topic"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
