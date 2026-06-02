"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { ArchiveIssue } from "@/lib/types/looptilt";

interface ArchivePanelProps {
  newsletterId: string;
  archive: ArchiveIssue[];
  onChange: () => void;
}

export function ArchivePanel({ newsletterId, archive, onChange }: ArchivePanelProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await looptiltApi.addArchiveIssue(newsletterId, { title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add issue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add a past issue</CardTitle>
          <CardDescription>Paste real sends so the engine learns your voice and topics.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="issue-title">Title</Label>
              <Input id="issue-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-body">Content</Label>
              <Textarea
                id="issue-body"
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the full issue body..."
              />
            </div>
            <Button type="submit" disabled={busy || !title.trim() || !content.trim()}>
              {busy ? "Adding..." : "Add to archive"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archive ({archive.length})</CardTitle>
          <CardDescription>The more issues, the sharper the fingerprint.</CardDescription>
        </CardHeader>
        <CardContent>
          {archive.length === 0 ? (
            <EmptyState title="No issues yet" description="Add a couple of past issues to begin." />
          ) : (
            <ul className="space-y-3">
              {archive.map((issue) => (
                <li key={issue.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{issue.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{issue.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
