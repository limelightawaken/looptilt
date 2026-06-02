"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LifecycleBadge } from "@/components/shared/lifecycle-badge";
import { SendStatusBadge } from "@/components/shared/send-status-badge";
import { fadeUp, stagger } from "@/lib/motion";
import { useWorkspace } from "@/lib/workspace-context";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Insights, LifecycleStage, Reader, Segment, Send } from "@/lib/types/looptilt";

export default function OverviewPage() {
  const { newsletter, dataSource } = useWorkspace();
  const base = `/dashboard/newsletters/${newsletter.id}`;
  const [insights, setInsights] = useState<Insights | null>(null);
  const [sends, setSends] = useState<Send[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      looptiltApi.getInsights(newsletter.id),
      looptiltApi.listSends(newsletter.id),
      looptiltApi.listSegments(newsletter.id),
      looptiltApi.listReaders(newsletter.id),
    ])
      .then(([i, s, seg, r]) => {
        setInsights(i);
        setSends(s);
        setSegments(seg);
        setReaders(r);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [newsletter.id]);

  const activeSegments = segments.filter((s) => (s._count?.memberships ?? 0) > 0).length;
  const publishedCount = sends.filter((s) => s.status === "PUBLISHED").length;
  const draftCount = sends.filter((s) => s.status === "DRAFT").length;

  const setup = useMemo(
    () => [
      {
        label: "Connect a data source (Kit or demo)",
        done: Boolean(dataSource),
        href: `${base}/settings`,
      },
      {
        label: "Generate the newsletter fingerprint",
        done: newsletter.fingerprint?.status === "READY",
        href: `${base}/settings`,
      },
      {
        label: "Build segments with members",
        done: activeSegments > 0,
        href: `${base}/segments`,
      },
    ],
    [dataSource, newsletter.fingerprint?.status, activeSegments, base],
  );
  const setupComplete = setup.every((step) => step.done);

  const atRisk = [...readers]
    .filter((r) => r.fingerprint)
    .sort((a, b) => (b.fingerprint?.churnPropensity ?? 0) - (a.fingerprint?.churnPropensity ?? 0))
    .slice(0, 5);
  const maxClicks = Math.max(1, ...(insights?.topicEngagement.map((t) => t.clicks) ?? [1]));
  const recentSends = sends.slice(0, 5);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading overview...</p>;
  }

  return (
    <div className="space-y-8">
      {!setupComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Finish setup</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {setup.map((step, index) => (
                <li key={step.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        step.done
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.done ? "✓" : index + 1}
                    </span>
                    <span className={step.done ? "text-muted-foreground line-through" : ""}>
                      {step.label}
                    </span>
                  </div>
                  {!step.done && (
                    <Link href={step.href} className="text-xs font-medium underline">
                      Go
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Subscribers", value: insights?.totalSubscribers ?? 0 },
          {
            label: "Avg churn risk",
            value: insights ? `${(insights.averageChurn * 100).toFixed(0)}%` : "0%",
          },
          { label: "At-risk readers", value: insights?.atRiskCount ?? 0, hint: "churn >= 60%" },
          { label: "Active segments", value: activeSegments },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <StatCard label={stat.label} value={stat.value} hint={stat.hint} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle mix</CardTitle>
          </CardHeader>
          <CardContent>
            {insights && Object.keys(insights.lifecycleCounts).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(insights.lifecycleCounts).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-2">
                    <LifecycleBadge stage={stage as LifecycleStage} />
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reader signals yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic engagement (clicks)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {insights && insights.topicEngagement.length > 0 ? (
              insights.topicEngagement.map((t) => (
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No topic clicks yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent issues</CardTitle>
              <Link href={`${base}/issues`} className="text-xs font-medium underline">
                View all ({sends.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentSends.length === 0 ? (
              <EmptyState
                title="No issues yet"
                description="Create your first issue to start sending."
                action={
                  <Link href={`${base}/issues`} className={buttonVariants({ size: "sm" })}>
                    New issue
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentSends.map((send) => (
                  <li key={send.id}>
                    <Link
                      href={`${base}/issues/${send.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{send.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {send.variants.length} variants
                        </p>
                      </div>
                      <SendStatusBadge status={send.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {sends.length > 0 && (
              <div className="mt-4 flex gap-2">
                <Badge variant="success">{publishedCount} published</Badge>
                <Badge variant="outline">{draftCount} draft</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Highest churn risk</CardTitle>
              <Link href={`${base}/audience`} className="text-xs font-medium underline">
                View audience
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reader signals yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {atRisk.map((reader) => (
                  <li key={reader.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{reader.email}</p>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
