"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterSummary } from "@/lib/types/looptilt";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    looptiltApi
      .listNewsletters()
      .then(setNewsletters)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load newsletters")
      )
      .finally(() => setLoading(false));
  }, []);

  const readyFingerprints = newsletters.filter(
    (n) => n.fingerprint?.status === "READY"
  ).length;
  const totalArchiveIssues = newsletters.reduce(
    (sum, n) => sum + n._count.archive,
    0
  );
  const totalDrafts = newsletters.reduce((sum, n) => sum + n._count.drafts, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {session?.user?.name?.split(" ")[0] || "creator"}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your fingerprint engine workspace. v1 focuses on archive → fingerprint → ghostwriter.
          </p>
        </div>
        <Link
          href="/dashboard/newsletters"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Manage newsletters
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Newsletters" value={loading ? "—" : String(newsletters.length)} />
        <StatCard label="Archive issues" value={loading ? "—" : String(totalArchiveIssues)} />
        <StatCard label="Fingerprints ready" value={loading ? "—" : String(readyFingerprints)} />
        <StatCard label="Ghostwriter drafts" value={loading ? "—" : String(totalDrafts)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            v1 workflow
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                1
              </span>
              Create a newsletter workspace and paste past issues into the archive.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                2
              </span>
              Generate your fingerprint — topics, voice, audience, depth, obsessions.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                3
              </span>
              Use Ghostwriter to draft the next issue in your inferred voice.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent newsletters
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading...</p>
          ) : newsletters.length === 0 ? (
            <div className="mt-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No newsletters yet. Create one to import your archive.
              </p>
              <Link
                href="/dashboard/newsletters"
                className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
              >
                Create your first newsletter →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {newsletters.slice(0, 5).map((newsletter) => (
                <li key={newsletter.id} className="py-3">
                  <Link
                    href={`/dashboard/newsletters/${newsletter.id}`}
                    className="flex items-center justify-between gap-4 hover:opacity-80"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {newsletter.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {newsletter._count.archive} issues ·{" "}
                        {newsletter.fingerprint?.status ?? "PENDING"} fingerprint
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
