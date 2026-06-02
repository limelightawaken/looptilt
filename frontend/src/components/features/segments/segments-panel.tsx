"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { Segment, SegmentPreview } from "@/lib/types/looptilt";

const KIND_LABEL: Record<string, string> = {
  DEFAULT_LIFECYCLE: "Lifecycle",
  DEFAULT_DEPTH: "Depth",
  DEFAULT_AFFINITY: "Affinity",
  CUSTOM: "Custom",
};

export function SegmentsPanel({ newsletterId }: { newsletterId: string }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => looptiltApi.listSegments(newsletterId).then(setSegments).catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [newsletterId]);

  const handlePreview = async () => {
    if (!description.trim()) return;
    setBusy("preview");
    setError(null);
    try {
      setPreview(await looptiltApi.previewSegment(newsletterId, description.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build segment");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setBusy("save");
    try {
      await looptiltApi.createSegment(newsletterId, {
        name: preview.name,
        description,
        rationale: preview.rationale,
        rule: preview.rule,
      });
      setPreview(null);
      setDescription("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save segment");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    await looptiltApi.deleteSegment(newsletterId, id).catch(() => undefined);
    refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build a segment in plain language</CardTitle>
          <CardDescription>
            Describe who you want. The AI proposes a concrete rule, explains it, and estimates how
            many readers match. You approve before it is saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="readers who cooled off lately and lean technical"
            />
            <Button onClick={handlePreview} disabled={busy !== null || !description.trim()}>
              {busy === "preview" ? "Thinking..." : "Preview"}
            </Button>
          </div>

          {preview && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{preview.name}</p>
                <Badge variant="outline">{preview.estimatedCount} readers match</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{preview.rationale}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.rule.conditions.map((condition, index) => (
                  <Badge key={index} variant="default">
                    {condition.field}
                    {condition.topicName ? `(${condition.topicName})` : ""} {condition.operator}{" "}
                    {String(condition.value)}
                  </Badge>
                ))}
              </div>
              {preview.excludedSignals.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Left out: {preview.excludedSignals.join("; ")}
                </p>
              )}
              <Button className="mt-4" size="sm" onClick={handleSave} disabled={busy === "save"}>
                {busy === "save" ? "Saving..." : "Save segment"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {segments.length === 0 ? (
        <EmptyState title="No segments yet" description="Run the loop to populate the default segments." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card key={segment.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{segment.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{KIND_LABEL[segment.kind]}</p>
                </div>
                <Badge variant="outline">{segment._count?.memberships ?? 0}</Badge>
              </div>
              {segment.description && (
                <p className="mt-2 text-xs text-muted-foreground">{segment.description}</p>
              )}
              {segment.kind === "CUSTOM" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0 text-xs text-muted-foreground"
                  onClick={() => remove(segment.id)}
                >
                  Delete
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
