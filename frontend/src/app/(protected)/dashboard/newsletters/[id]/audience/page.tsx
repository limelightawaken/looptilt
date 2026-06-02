"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LifecycleBadge } from "@/components/shared/lifecycle-badge";
import { useWorkspace } from "@/lib/workspace-context";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Insights, LifecycleStage, Reader } from "@/lib/types/looptilt";

function ReaderRow({ reader }: { reader: Reader }) {
  const [open, setOpen] = useState(false);
  const fp = reader.fingerprint;
  const affinities = [...(fp?.topicAffinities ?? [])].sort((a, b) => b.score - a.score);

  return (
    <li className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{reader.firstName || reader.email}</p>
          {reader.firstName && <p className="truncate text-xs text-muted-foreground">{reader.email}</p>}
        </div>
        <div className="flex items-center gap-3">
          {fp && <LifecycleBadge stage={fp.lifecycleStage} />}
          <span className="text-sm font-medium">
            {((fp?.churnPropensity ?? 0) * 100).toFixed(0)}%
          </span>
        </div>
      </button>
      {open && (
        <div className="space-y-4 pb-4">
          {!fp ? (
            <p className="text-sm text-muted-foreground">No fingerprint computed yet for this reader.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Lifecycle</p>
                  <p className="mt-1 text-sm font-medium capitalize">{fp.lifecycleStage.toLowerCase()}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Depth</p>
                  <p className="mt-1 text-sm font-medium capitalize">{fp.depthPreference.toLowerCase()}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Open rate</p>
                  <p className="mt-1 text-sm font-medium">{((fp.openRate ?? 0) * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Signals</p>
                  <p className="mt-1 text-sm font-medium">{fp.signalCount}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Topic affinities
                </p>
                {affinities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No topic signals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {affinities.map((a) => (
                      <div key={a.topicId} className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {a.name}
                            {a.trend !== 0 && (
                              <span className={a.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                {" "}
                                {a.trend > 0 ? "↑" : "↓"}
                              </span>
                            )}
                          </span>
                          <span>{a.clicks} clicks</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-foreground/70"
                            style={{ width: `${Math.round(a.score * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reader.channel && (
                <p className="text-xs text-muted-foreground">Acquired via {reader.channel}</p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default function AudiencePage() {
  const { newsletter } = useWorkspace();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([looptiltApi.getInsights(newsletter.id), looptiltApi.listReaders(newsletter.id)])
      .then(([i, r]) => {
        setInsights(i);
        setReaders(r);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [newsletter.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...readers].sort(
      (a, b) => (b.fingerprint?.churnPropensity ?? 0) - (a.fingerprint?.churnPropensity ?? 0),
    );
    if (!q) return sorted;
    return sorted.filter(
      (r) => r.email.toLowerCase().includes(q) || (r.firstName ?? "").toLowerCase().includes(q),
    );
  }, [readers, query]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading audience...</p>;
  }

  const engagedCount = insights?.lifecycleCounts.ENGAGED ?? 0;
  const fingerprintShare =
    insights && insights.totalSubscribers > 0
      ? Math.round((insights.withFingerprint / insights.totalSubscribers) * 100)
      : 0;

  if (!insights || insights.totalSubscribers === 0) {
    return (
      <EmptyState
        title="No subscribers yet"
        description="Connect Kit or seed demo data from Settings, then run the loop."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Subscribers"
          value={insights.totalSubscribers}
          hint={`${insights.withFingerprint} with fingerprints`}
        />
        <StatCard
          label="With fingerprint"
          value={insights.withFingerprint}
          hint={`${fingerprintShare}% of list`}
        />
        <StatCard
          label="Avg churn risk"
          value={`${(insights.averageChurn * 100).toFixed(0)}%`}
          hint={`${engagedCount} engaged readers`}
        />
        <StatCard label="At risk" value={insights.atRiskCount} hint="churn >= 60%" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifecycle mix</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(insights.lifecycleCounts).map(([stage, count]) => (
            <div key={stage} className="flex items-center gap-2">
              <LifecycleBadge stage={stage as LifecycleStage} />
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Subscribers</CardTitle>
            <Badge variant="outline">{filtered.length} shown</Badge>
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            Click a subscriber to see their reader fingerprint.
          </p>
          {filtered.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No subscribers match your search.</p>
          ) : (
            <ul>
              {filtered.map((reader) => (
                <ReaderRow key={reader.id} reader={reader} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
