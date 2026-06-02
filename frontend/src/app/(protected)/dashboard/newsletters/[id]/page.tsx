"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterDetail } from "@/lib/types/looptilt";

type Tab = "archive" | "fingerprint" | "ghostwriter";

export default function NewsletterDetailPage() {
  const params = useParams();
  const newsletterId = params.id as string;
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("archive");
  const [busy, setBusy] = useState(false);

  const [issueTitle, setIssueTitle] = useState("");
  const [issueContent, setIssueContent] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBrief, setDraftBrief] = useState("");
  const [selectedDraftContent, setSelectedDraftContent] = useState<string | null>(null);

  const loadNewsletter = useCallback(() => {
    setLoading(true);
    looptiltApi
      .getNewsletter(newsletterId)
      .then(setNewsletter)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load newsletter")
      )
      .finally(() => setLoading(false));
  }, [newsletterId]);

  useEffect(() => {
    loadNewsletter();
  }, [loadNewsletter]);

  const handleAddIssue = async (event: FormEvent) => {
    event.preventDefault();
    if (!issueTitle.trim() || !issueContent.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await looptiltApi.addArchiveIssue(newsletterId, {
        title: issueTitle.trim(),
        content: issueContent.trim(),
      });
      setIssueTitle("");
      setIssueContent("");
      loadNewsletter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add issue");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateFingerprint = async () => {
    setBusy(true);
    setError(null);
    try {
      await looptiltApi.generateFingerprint(newsletterId);
      loadNewsletter();
      setTab("fingerprint");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate fingerprint");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const draft = await looptiltApi.createDraft(newsletterId, {
        title: draftTitle.trim(),
        brief: draftBrief.trim() || undefined,
      });
      setDraftTitle("");
      setDraftBrief("");
      setSelectedDraftContent(draft.content);
      loadNewsletter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-zinc-500">
        Loading newsletter...
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Newsletter not found.</p>
        <Link href="/dashboard/newsletters" className="mt-4 inline-block text-sm underline">
          Back to newsletters
        </Link>
      </div>
    );
  }

  const fingerprint = newsletter.fingerprint;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/dashboard/newsletters"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← All newsletters
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {newsletter.name}
        </h1>
        {newsletter.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{newsletter.description}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(
          [
            ["archive", "Archive"],
            ["fingerprint", "Fingerprint"],
            ["ghostwriter", "Ghostwriter"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "archive" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={handleAddIssue}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">Add archive issue</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Paste past issues so the engine can learn your voice and topics.
            </p>
            <div className="mt-4 space-y-4">
              <input
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Issue title"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <textarea
                value={issueContent}
                onChange={(e) => setIssueContent(e.target.value)}
                rows={10}
                placeholder="Paste full issue content..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Add to archive
              </button>
            </div>
          </form>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Archive ({newsletter.archive.length})
              </h2>
              {newsletter.archive.length > 0 && (
                <button
                  onClick={handleGenerateFingerprint}
                  disabled={busy}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {busy ? "Working..." : "Generate fingerprint →"}
                </button>
              )}
            </div>
            {newsletter.archive.length === 0 ? (
              <p className="text-sm text-zinc-500">No issues yet.</p>
            ) : (
              <ul className="space-y-3">
                {newsletter.archive.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <p className="font-medium">{issue.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {issue.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "fingerprint" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Status</p>
              <p className="text-lg font-semibold capitalize">
                {fingerprint?.status?.toLowerCase() ?? "pending"}
                {fingerprint?.version ? ` · v${fingerprint.version}` : ""}
              </p>
            </div>
            <button
              onClick={handleGenerateFingerprint}
              disabled={busy || newsletter.archive.length === 0}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {fingerprint?.status === "READY" ? "Regenerate fingerprint" : "Generate fingerprint"}
            </button>
          </div>

          {fingerprint?.status === "READY" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <FingerprintCard title="Summary" content={fingerprint.summary} />
              <FingerprintCard
                title="Voice"
                content={JSON.stringify(fingerprint.voice, null, 2)}
              />
              <FingerprintCard
                title="Topics"
                content={JSON.stringify(fingerprint.topics, null, 2)}
              />
              <FingerprintCard
                title="Audience"
                content={JSON.stringify(fingerprint.audience, null, 2)}
              />
              <FingerprintCard
                title="Depth & format"
                content={JSON.stringify(fingerprint.depthFormat, null, 2)}
              />
              <FingerprintCard
                title="Obsessions"
                content={JSON.stringify(fingerprint.obsessions, null, 2)}
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add archive issues and generate a fingerprint to see structured understanding here.
            </p>
          )}
        </div>
      )}

      {tab === "ghostwriter" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={handleCreateDraft}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">New ghostwriter draft</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Requires a ready fingerprint. Draft scaffolds are assembled in your inferred voice.
            </p>
            <div className="mt-4 space-y-4">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Draft title"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <textarea
                value={draftBrief}
                onChange={(e) => setDraftBrief(e.target.value)}
                rows={4}
                placeholder="Optional brief: angle, audience slice, what to emphasize..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={busy || fingerprint?.status !== "READY"}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Generate draft
              </button>
            </div>
          </form>

          <div>
            <h2 className="text-lg font-semibold">Drafts ({newsletter.drafts.length})</h2>
            {newsletter.drafts.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No drafts yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {newsletter.drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      onClick={() => setSelectedDraftContent(draft.content)}
                      className="w-full rounded-lg border border-zinc-200 p-4 text-left hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                    >
                      <p className="font-medium">{draft.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(draft.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedDraftContent && (
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-lg font-semibold">Draft preview</h3>
              <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                {selectedDraftContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FingerprintCard({
  title,
  content,
}: {
  title: string;
  content: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold">{title}</h3>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        {content ?? "—"}
      </pre>
    </div>
  );
}
