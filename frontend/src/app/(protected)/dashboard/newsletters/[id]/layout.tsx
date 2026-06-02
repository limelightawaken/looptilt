"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ModeBadge } from "@/components/shared/mode-badge";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { appShellClass } from "@/lib/layout";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterDetail } from "@/lib/types/looptilt";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const newsletterId = params.id as string;
  const pathname = usePathname();
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    looptiltApi
      .getNewsletter(newsletterId)
      .then(setNewsletter)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [newsletterId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={`${appShellClass} py-16 text-sm text-muted-foreground`}>
        Loading workspace...
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className={`${appShellClass} py-16 text-center`}>
        <p className="text-muted-foreground">Newsletter not found.</p>
        <Link href="/dashboard/newsletters" className="mt-4 inline-block text-sm underline">
          Back to newsletters
        </Link>
      </div>
    );
  }

  const base = `/dashboard/newsletters/${newsletterId}`;
  const dataSource = newsletter.esp?.dataSource ?? null;
  const tabs = [
    { label: "Overview", href: base },
    { label: "Issues", href: `${base}/issues` },
    { label: "Audience", href: `${base}/audience` },
    { label: "Segments", href: `${base}/segments` },
    { label: "Settings", href: `${base}/settings` },
  ];

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  return (
    <WorkspaceProvider value={{ newsletter, dataSource, refresh: load }}>
      <div className={`${appShellClass} py-8`}>
        <div className="mb-6">
          <Link
            href="/dashboard/newsletters"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; All newsletters
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{newsletter.name}</h1>
              <ModeBadge dataSource={dataSource} />
              {newsletter.fingerprint?.status === "READY" && (
                <Badge variant="success">fingerprint ready</Badge>
              )}
            </div>
            <Link href={`${base}/issues`} className={buttonVariants({ size: "sm" })}>
              New issue
            </Link>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-1 border-b border-border">
          {tabs.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="workspace-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </WorkspaceProvider>
  );
}
