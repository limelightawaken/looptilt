"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { DataSource, Send } from "@/lib/types/looptilt";

interface SendsPanelProps {
  newsletterId: string;
  dataSource: DataSource | null;
}

export function SendsPanel({ newsletterId, dataSource }: SendsPanelProps) {
  const [sends, setSends] = useState<Send[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openVariant, setOpenVariant] = useState<string | null>(null);

  const refresh = () => looptiltApi.listSends(newsletterId).then(setSends).catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [newsletterId]);

  const handleCompose = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy("compose");
    setError(null);
    try {
      await looptiltApi.createSend(newsletterId, title.trim());
      setTitle("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compose send");
    } finally {
      setBusy(null);
    }
  };

  const push = async (sendId: string) => {
    setBusy(sendId);
    setError(null);
    try {
      await looptiltApi.pushSendToKit(newsletterId, sendId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to push to Kit");
    } finally {
      setBusy(null);
    }
  };

  const isLive = dataSource === "LIVE_KIT";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compose a send</CardTitle>
          <CardDescription>
            Generates one voice-preserving variant per segment from your block menu. Needs a ready
            fingerprint, content blocks, and segments with members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <form onSubmit={handleCompose} className="flex gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" />
            <Button type="submit" disabled={busy !== null || !title.trim()}>
              {busy === "compose" ? "Generating..." : "Compose"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {sends.length === 0 ? (
        <EmptyState title="No sends yet" description="Compose one to generate per-segment variants." />
      ) : (
        <div className="space-y-4">
          {sends.map((send) => (
            <Card key={send.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{send.title}</CardTitle>
                    <CardDescription>{send.variants.length} segment variants</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{send.status.toLowerCase()}</Badge>
                    <Button
                      size="sm"
                      variant={isLive ? "default" : "outline"}
                      disabled={busy !== null || !isLive}
                      title={isLive ? "Create Kit draft broadcasts" : "Demo mode: preview only"}
                      onClick={() => push(send.id)}
                    >
                      {busy === send.id ? "Pushing..." : isLive ? "Push to Kit (draft)" : "Live mode only"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {send.variants.map((variant) => (
                  <div key={variant.id} className="rounded-lg border border-border">
                    <button
                      className="flex w-full items-center justify-between p-3 text-left"
                      onClick={() => setOpenVariant(openVariant === variant.id ? null : variant.id)}
                    >
                      <span className="text-sm font-medium">{variant.segment.name}</span>
                      <Badge variant="outline">{variant.status.toLowerCase()}</Badge>
                    </button>
                    {openVariant === variant.id && (
                      <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border bg-muted/40 p-4 text-xs">
                        {variant.content}
                      </pre>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
