"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { looptiltApi } from "@/lib/looptilt-api";
import type { ContentBlock, ContentBlockKind } from "@/lib/types/looptilt";

const KINDS: { value: ContentBlockKind; label: string }[] = [
  { value: "CONTENT", label: "Content" },
  { value: "INSTRUCTION", label: "Instruction" },
  { value: "LINK", label: "Link" },
  { value: "IMAGE", label: "Image" },
  { value: "PROMOTION", label: "Promotion" },
];

const NEEDS_URL: ContentBlockKind[] = ["LINK", "IMAGE", "PROMOTION"];

const SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function bodyLabel(kind: ContentBlockKind): string {
  switch (kind) {
    case "INSTRUCTION":
      return "Instruction";
    case "IMAGE":
      return "Caption (optional)";
    case "LINK":
    case "PROMOTION":
      return "Description (optional)";
    default:
      return "Body";
  }
}

interface SendBlocksEditorProps {
  newsletterId: string;
  sendId: string;
  blocks: ContentBlock[];
  onChange: () => void;
}

export function SendBlocksEditor({ newsletterId, sendId, blocks, onChange }: SendBlocksEditorProps) {
  const [kind, setKind] = useState<ContentBlockKind>("CONTENT");
  const [label, setLabel] = useState("");
  const [intent, setIntent] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const needsUrl = NEEDS_URL.includes(kind);
  const canSubmit = Boolean(label.trim()) && Boolean(needsUrl ? url.trim() : body.trim());

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await looptiltApi.createBlock(newsletterId, sendId, {
        kind,
        label: label.trim(),
        intent: intent.trim() || undefined,
        body: body.trim() || undefined,
        url: url.trim() || undefined,
      });
      setLabel("");
      setIntent("");
      setBody("");
      setUrl("");
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await looptiltApi.deleteBlock(newsletterId, sendId, id).catch(() => undefined);
    onChange();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleAdd} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`block-kind-${sendId}`}>Type</Label>
          <select
            id={`block-kind-${sendId}`}
            className={SELECT_CLASS}
            value={kind}
            onChange={(e) => setKind(e.target.value as ContentBlockKind)}
          >
            {KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`block-label-${sendId}`}>Label</Label>
          <Input
            id={`block-label-${sendId}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Lead story"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`block-intent-${sendId}`}>Intent (optional)</Label>
          <Input
            id={`block-intent-${sendId}`}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Hook with a contrarian stat"
          />
        </div>
        {needsUrl && (
          <div className="space-y-1.5">
            <Label htmlFor={`block-url-${sendId}`}>URL</Label>
            <Input
              id={`block-url-${sendId}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/..."
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`block-body-${sendId}`}>{bodyLabel(kind)}</Label>
          <Textarea
            id={`block-body-${sendId}`}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="The information you want to send..."
          />
        </div>
        <Button type="submit" disabled={busy || !canSubmit}>
          {busy ? "Adding..." : "Add block"}
        </Button>
      </form>

      <div>
        <p className="mb-3 text-sm font-medium">Blocks ({blocks.length})</p>
        {blocks.length === 0 ? (
          <EmptyState
            title="No blocks yet"
            description="Add content, links, images, promotions, or instructions for this issue."
          />
        ) : (
          <ul className="space-y-3">
            {blocks.map((block) => (
              <li key={block.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{block.kind.toLowerCase()}</Badge>
                    <p className="text-sm font-medium">{block.label}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-xs text-muted-foreground"
                    onClick={() => remove(block.id)}
                  >
                    Remove
                  </Button>
                </div>
                {block.intent && <p className="mt-1 text-xs text-muted-foreground">{block.intent}</p>}
                {block.body && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{block.body}</p>
                )}
                {block.url && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">{block.url}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
