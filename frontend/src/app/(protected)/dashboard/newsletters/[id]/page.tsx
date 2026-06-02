"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ModeBadge } from "@/components/shared/mode-badge";
import { ArchivePanel } from "@/components/features/archive/archive-panel";
import { FingerprintView } from "@/components/features/fingerprint/fingerprint-view";
import { ConnectionPanel } from "@/components/features/esp/connection-panel";
import { SignalsPanel } from "@/components/features/signals/signals-panel";
import { SegmentsPanel } from "@/components/features/segments/segments-panel";
import { BlocksPanel } from "@/components/features/ghostwriter/blocks-panel";
import { SendsPanel } from "@/components/features/sends/sends-panel";
import { fadeUp } from "@/lib/motion";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterDetail } from "@/lib/types/looptilt";

const TABS = [
  "Connection",
  "Archive",
  "Fingerprint",
  "Signals",
  "Segments",
  "Blocks",
  "Send",
] as const;
type Tab = (typeof TABS)[number];

export default function NewsletterDetailPage() {
  const params = useParams();
  const newsletterId = params.id as string;
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Connection");

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
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground sm:px-6">Loading...</div>;
  }

  if (!newsletter) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground">Newsletter not found.</p>
        <Link href="/dashboard/newsletters" className="mt-4 inline-block text-sm underline">
          Back to newsletters
        </Link>
      </div>
    );
  }

  const dataSource = newsletter.esp?.dataSource ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard/newsletters" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; All newsletters
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{newsletter.name}</h1>
          <ModeBadge dataSource={dataSource} />
          {newsletter.fingerprint?.status === "READY" && <Badge variant="success">fingerprint ready</Badge>}
        </div>
        {newsletter.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{newsletter.description}</p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === item ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item}
            {tab === item && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground"
              />
            )}
          </button>
        ))}
      </div>

      <motion.div key={tab} variants={fadeUp} initial="hidden" animate="visible">
        {tab === "Connection" && <ConnectionPanel newsletterId={newsletterId} onChange={load} />}
        {tab === "Archive" && (
          <ArchivePanel newsletterId={newsletterId} archive={newsletter.archive} onChange={load} />
        )}
        {tab === "Fingerprint" && (
          <FingerprintView
            newsletterId={newsletterId}
            fingerprint={newsletter.fingerprint}
            hasArchive={newsletter.archive.length > 0}
            onChange={load}
          />
        )}
        {tab === "Signals" && <SignalsPanel newsletterId={newsletterId} />}
        {tab === "Segments" && <SegmentsPanel newsletterId={newsletterId} />}
        {tab === "Blocks" && <BlocksPanel newsletterId={newsletterId} />}
        {tab === "Send" && <SendsPanel newsletterId={newsletterId} dataSource={dataSource} />}
      </motion.div>
    </div>
  );
}
