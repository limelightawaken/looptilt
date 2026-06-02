"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { ContentBlock } from "@/lib/types/looptilt";

export function BlocksPanel({ newsletterId }: { newsletterId: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [label, setLabel] = useState("");
  const [intent, setIntent] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => looptiltApi.listBlocks(newsletterId).then(setBlocks).catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [newsletterId]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim() || !intent.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await looptiltApi.createBlock(newsletterId, {
        label: label.trim(),
        intent: intent.trim(),
        body: body.trim(),
      });
      setLabel("");
      setIntent("");
      setBody("");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await looptiltApi.deleteBlock(newsletterId, id).catch(() => undefined);
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add a content block</CardTitle>
          <CardDescription>
            Write a menu of blocks once. The loop selects and orders them per segment, in your voice -
            so you never hand-write a variant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="block-label">Label</Label>
              <Input id="block-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Lead story" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-intent">Intent</Label>
              <Input id="block-intent" value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Hook with a contrarian stat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-body">Body</Label>
              <Textarea id="block-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="The raw material for this block..." />
            </div>
            <Button type="submit" disabled={busy || !label.trim() || !intent.trim() || !body.trim()}>
              {busy ? "Adding..." : "Add block"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Block menu ({blocks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <EmptyState title="No blocks yet" description="Add blocks the ghostwriter can assemble." />
          ) : (
            <ul className="space-y-3">
              {blocks.map((block) => (
                <li key={block.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{block.label}</p>
                    <Button variant="ghost" size="sm" className="px-0 text-xs text-muted-foreground" onClick={() => remove(block.id)}>
                      Remove
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{block.intent}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{block.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
