"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { SendStatusBadge } from "@/components/shared/send-status-badge";
import { fadeUp, stagger } from "@/lib/motion";
import { useWorkspace } from "@/lib/workspace-context";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Segment, Send } from "@/lib/types/looptilt";

export default function IssuesPage() {
  const { newsletter } = useWorkspace();
  const base = `/dashboard/newsletters/${newsletter.id}`;
  const [sends, setSends] = useState<Send[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    Promise.all([
      looptiltApi.listSends(newsletter.id),
      looptiltApi.listSegments(newsletter.id),
    ])
      .then(([s, seg]) => {
        setSends(s);
        setSegments(seg);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
  }, [newsletter.id]);

  const membershipBySegment = useMemo(() => {
    const map = new Map<string, number>();
    segments.forEach((s) => map.set(s.id, s._count?.memberships ?? 0));
    return map;
  }, [segments]);

  const reachFor = (send: Send) =>
    send.variants.reduce((sum, v) => sum + (membershipBySegment.get(v.segmentId) ?? 0), 0);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await looptiltApi.createSend(newsletter.id, title.trim());
      setTitle("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New issue</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title (e.g. Issue #48 — the retention cliff)"
            />
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? "Creating..." : "Create issue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading issues...</p>
      ) : sends.length === 0 ? (
        <EmptyState
          title="No issues yet"
          description="Create an issue, add its blocks, then generate per-segment variants."
        />
      ) : (
        <motion.ul
          variants={stagger(0.04)}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {sends.map((send) => (
            <motion.li key={send.id} variants={fadeUp}>
              <Link href={`${base}/issues/${send.id}`}>
                <Card className="p-4 transition-colors hover:border-foreground/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{send.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {send.blocks.length} blocks &middot; {send.variants.length} variants
                        {send.variants.length > 0 && ` · ~${reachFor(send)} recipients`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {new Date(send.createdAt).toLocaleDateString()}
                      </span>
                      <SendStatusBadge status={send.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
