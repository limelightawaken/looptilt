"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterSummary } from "@/lib/types/looptilt";

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadNewsletters = () => {
    setLoading(true);
    looptiltApi
      .listNewsletters()
      .then(setNewsletters)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load newsletters")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNewsletters();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await looptiltApi.createNewsletter({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      loadNewsletters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create newsletter");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Newsletters
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Each workspace holds your archive, fingerprint, and ghostwriter drafts.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-1"
        >
          <h2 className="text-lg font-semibold">New newsletter</h2>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="The Growth Brief"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="What is this newsletter about?"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {creating ? "Creating..." : "Create workspace"}
            </button>
          </div>
        </form>

        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading newsletters...</p>
          ) : newsletters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400">
                No newsletters yet. Create one to start building your fingerprint.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {newsletters.map((newsletter) => (
                <Link
                  key={newsletter.id}
                  href={`/dashboard/newsletters/${newsletter.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {newsletter.name}
                  </h3>
                  {newsletter.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {newsletter.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {newsletter._count.archive} archive issues
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {newsletter.fingerprint?.status ?? "PENDING"} fingerprint
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {newsletter._count.drafts} drafts
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
