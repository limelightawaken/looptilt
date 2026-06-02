"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SendStatusBadge } from "@/components/shared/send-status-badge";
import { SendBlocksEditor } from "@/components/features/ghostwriter/blocks-panel";
import { useWorkspace } from "@/lib/workspace-context";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Segment, Send } from "@/lib/types/looptilt";

export default function IssueDetailPage() {
  const { newsletter, dataSource } = useWorkspace();
  const params = useParams();
  const sendId = params.sendId as string;
  const base = `/dashboard/newsletters/${newsletter.id}`;

  const [send, setSend] = useState<Send | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openVariant, setOpenVariant] = useState<string | null>(null);

  const refresh = useCallback(
    () =>
      Promise.all([
        looptiltApi.getSend(newsletter.id, sendId),
        looptiltApi.listSegments(newsletter.id),
      ])
        .then(([s, seg]) => {
          setSend(s);
          setSegments(seg);
        })
        .catch(() => setError("Could not load this issue."))
        .finally(() => setLoading(false)),
    [newsletter.id, sendId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const membershipBySegment = useMemo(() => {
    const map = new Map<string, number>();
    segments.forEach((s) => map.set(s.id, s._count?.memberships ?? 0));
    return map;
  }, [segments]);

  const totalReach = useMemo(
    () => (send?.variants ?? []).reduce((sum, v) => sum + (membershipBySegment.get(v.segmentId) ?? 0), 0),
    [send, membershipBySegment],
  );

  const isLive = dataSource === "LIVE_KIT";

  const generate = async () => {
    setBusy("generate");
    setError(null);
    try {
      await looptiltApi.generateSend(newsletter.id, sendId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate variants");
    } finally {
      setBusy(null);
    }
  };

  const push = async () => {
    setBusy("push");
    setError(null);
    try {
      await looptiltApi.pushSendToKit(newsletter.id, sendId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to push to Kit");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading issue...</p>;
  }

  if (!send) {
    return (
      <EmptyState
        title="Issue not found"
        description="It may have been deleted."
        action={
          <Link href={`${base}/issues`} className="text-sm underline">
            Back to issues
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`${base}/issues`} className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All issues
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">{send.title}</h2>
          <SendStatusBadge status={send.status} />
        </div>
        <Button
          variant={isLive ? "default" : "outline"}
          disabled={busy !== null || !isLive || send.variants.length === 0}
          title={isLive ? "Create Kit draft broadcasts" : "Demo mode: preview only"}
          onClick={push}
        >
          {busy === "push"
            ? "Pushing..."
            : isLive
              ? "Push to Kit (draft)"
              : "Live mode only"}
        </Button>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Content blocks</CardTitle>
          <CardDescription>
            Copy, links, images, promotions, and instructions. The ghostwriter selects and orders
            these per segment, in your voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SendBlocksEditor
            newsletterId={newsletter.id}
            sendId={send.id}
            blocks={send.blocks}
            onChange={refresh}
          />
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button disabled={busy !== null || send.blocks.length === 0} onClick={generate}>
              {busy === "generate"
                ? "Generating..."
                : send.variants.length > 0
                  ? "Regenerate variants"
                  : "Generate variants"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Needs a ready fingerprint and segments with members.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Segment breakdown</CardTitle>
            {send.variants.length > 0 && (
              <Badge variant="outline">~{totalReach} total recipients</Badge>
            )}
          </div>
          <CardDescription>
            One voice-preserving variant per segment. Recipients reflect current segment membership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {send.variants.length === 0 ? (
            <EmptyState
              title="No variants yet"
              description="Add blocks above, then generate to produce a variant per segment."
            />
          ) : (
            <div className="space-y-2">
              {send.variants.map((variant) => {
                const recipients = membershipBySegment.get(variant.segmentId) ?? 0;
                const pushed = Boolean(variant.kitBroadcastId);
                const isOpen = openVariant === variant.id;
                return (
                  <div key={variant.id} className="rounded-lg border border-border">
                    <button
                      className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left"
                      onClick={() => setOpenVariant(isOpen ? null : variant.id)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{variant.segment.name}</p>
                        <p className="text-xs text-muted-foreground">~{recipients} recipients</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {pushed ? (
                          <Badge variant="success">pushed to Kit</Badge>
                        ) : (
                          <Badge variant="outline">not pushed</Badge>
                        )}
                        <Badge variant="outline">{variant.status.toLowerCase()}</Badge>
                      </div>
                    </button>
                    {isOpen && (
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-border bg-muted/40 p-4 text-xs">
                        {variant.content}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
