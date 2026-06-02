"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { fadeUp, stagger } from "@/lib/motion";
import { appShellClass } from "@/lib/layout";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterSummary } from "@/lib/types/looptilt";

const STEPS = [
  "Create a newsletter and import your archive.",
  "Generate the fingerprint - topics, voice, audience, depth.",
  "Connect Kit (or demo data) and let signals flow in.",
  "Run the loop: reader fingerprints sort readers into segments.",
  "Compose a send - one voice-preserving variant per segment.",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    looptiltApi
      .listNewsletters()
      .then(setNewsletters)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const readyFingerprints = newsletters.filter((n) => n.fingerprint?.status === "READY").length;
  const totalArchive = newsletters.reduce((sum, n) => sum + n._count.archive, 0);
  const pendingFingerprints = newsletters.filter(
    (n) => n.fingerprint?.status !== "READY",
  ).length;

  return (
    <div className={`${appShellClass} py-8`}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0] || "creator"}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            Personalization, adaptive segments, and ghostwriter drafts in one place.
          </p>
        </div>
        <Link href="/dashboard/newsletters" className={buttonVariants()}>
          Manage newsletters
        </Link>
      </div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Newsletters", value: loading ? "-" : newsletters.length },
          { label: "Archive issues", value: loading ? "-" : totalArchive },
          { label: "Fingerprints ready", value: loading ? "-" : readyFingerprints },
          { label: "Fingerprints pending", value: loading ? "-" : pendingFingerprints },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <StatCard label={stat.label} value={stat.value} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How the loop works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your newsletters</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : newsletters.length === 0 ? (
              <EmptyState
                title="No newsletters yet"
                description="Create one to import your archive."
                action={
                  <Link href="/dashboard/newsletters" className={buttonVariants()}>
                    Create newsletter
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {newsletters.slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/dashboard/newsletters/${n.id}`}
                      className="flex items-center justify-between gap-4 py-3 transition-opacity hover:opacity-80"
                    >
                      <div>
                        <p className="text-sm font-medium">{n.name}</p>
                        <p className="text-xs text-muted-foreground">{n._count.archive} archive issues</p>
                      </div>
                      <Badge variant={n.fingerprint?.status === "READY" ? "success" : "outline"}>
                        {(n.fingerprint?.status ?? "pending").toLowerCase()}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
