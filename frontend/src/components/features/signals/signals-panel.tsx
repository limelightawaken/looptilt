"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LifecycleBadge } from "@/components/shared/lifecycle-badge";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Insights, LifecycleStage, Reader } from "@/lib/types/looptilt";

export function SignalsPanel({ newsletterId }: { newsletterId: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([looptiltApi.getInsights(newsletterId), looptiltApi.listReaders(newsletterId)])
      .then(([i, r]) => {
        setInsights(i);
        setReaders(r);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [newsletterId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading signals...</p>;
  }

  if (!insights || insights.withFingerprint === 0) {
    return (
      <EmptyState
        title="No signal yet"
        description="Connect a data source, use Seed demo data on the Connection tab, or wait for Kit webhooks."
      />
    );
  }

  const atRisk = [...readers]
    .filter((r) => r.fingerprint)
    .sort((a, b) => (b.fingerprint?.churnPropensity ?? 0) - (a.fingerprint?.churnPropensity ?? 0))
    .slice(0, 8);
  const maxClicks = Math.max(1, ...insights.topicEngagement.map((t) => t.clicks));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Subscribers" value={insights.totalSubscribers} />
        <StatCard label="With fingerprint" value={insights.withFingerprint} />
        <StatCard label="Avg churn risk" value={`${(insights.averageChurn * 100).toFixed(0)}%`} />
        <StatCard label="At risk" value={insights.atRiskCount} hint="churn >= 60%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            <CardTitle>Topic engagement (clicks)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {insights.topicEngagement.map((t) => (
              <div key={t.topic} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.topic}</span>
                  <span>{t.clicks}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-foreground/70"
                    style={{ width: `${(t.clicks / maxClicks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Highest churn risk</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {atRisk.map((reader) => (
              <li key={reader.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{reader.email}</p>
                  <p className="text-xs text-muted-foreground">
                    open rate {((reader.fingerprint?.openRate ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {reader.fingerprint && <LifecycleBadge stage={reader.fingerprint.lifecycleStage} />}
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {((reader.fingerprint?.churnPropensity ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
