"use client";

import { SegmentsPanel } from "@/components/features/segments/segments-panel";
import { useWorkspace } from "@/lib/workspace-context";

export default function SegmentsRoutePage() {
  const { newsletter } = useWorkspace();
  return <SegmentsPanel newsletterId={newsletter.id} />;
}
