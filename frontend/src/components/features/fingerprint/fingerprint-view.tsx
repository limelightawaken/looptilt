"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterFingerprint } from "@/lib/types/looptilt";

interface FingerprintViewProps {
  newsletterId: string;
  fingerprint: NewsletterFingerprint | null;
  hasArchive: boolean;
  onChange: () => void;
}

export function FingerprintView({ newsletterId, fingerprint, hasArchive, onChange }: FingerprintViewProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      await looptiltApi.generateFingerprint(newsletterId);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate fingerprint");
    } finally {
      setBusy(false);
    }
  };

  const isReady = fingerprint?.status === "READY";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={isReady ? "success" : "outline"}>
            {(fingerprint?.status ?? "PENDING").toLowerCase()}
            {fingerprint?.version ? ` · v${fingerprint.version}` : ""}
          </Badge>
          {fingerprint?.generatedBy && (
            <Badge variant="outline">via {fingerprint.generatedBy}</Badge>
          )}
        </div>
        <Button onClick={generate} disabled={busy || !hasArchive}>
          {busy ? "Analyzing..." : isReady ? "Regenerate" : "Generate fingerprint"}
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!isReady ? (
        <EmptyState
          title="No fingerprint yet"
          description="Add archive issues, then generate the structured understanding the whole loop runs on."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{fingerprint.summary}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Topics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {fingerprint.topics?.map((topic) => (
                <Badge key={topic.name} variant="default">
                  {topic.name} · {(topic.weight * 100).toFixed(0)}%
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Tone: {fingerprint.voice?.tone}</p>
              <p>Formality: {fingerprint.voice?.formality}</p>
              <p>Rhythm: {fingerprint.voice?.sentenceRhythm}</p>
              <p>Humor: {fingerprint.voice?.humor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Depth & format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{fingerprint.depthFormat?.typicalLength}</p>
              <p>{fingerprint.depthFormat?.technicalDepth}</p>
              <p>~{fingerprint.depthFormat?.avgWordsPerIssue} words/issue</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
