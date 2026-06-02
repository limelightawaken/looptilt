"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionPanel } from "@/components/features/esp/connection-panel";
import { ArchivePanel } from "@/components/features/archive/archive-panel";
import { FingerprintView } from "@/components/features/fingerprint/fingerprint-view";
import { useWorkspace } from "@/lib/workspace-context";

const SECTIONS = ["Connection", "Archive", "Fingerprint"] as const;
type Section = (typeof SECTIONS)[number];

export default function SettingsPage() {
  const { newsletter, refresh } = useWorkspace();
  const [section, setSection] = useState<Section>("Connection");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((item) => (
              <button
                key={item}
                onClick={() => setSection(item)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  section === item
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {section === "Connection" && (
        <ConnectionPanel newsletterId={newsletter.id} onChange={refresh} />
      )}
      {section === "Archive" && (
        <ArchivePanel newsletterId={newsletter.id} archive={newsletter.archive} onChange={refresh} />
      )}
      {section === "Fingerprint" && (
        <FingerprintView
          newsletterId={newsletter.id}
          fingerprint={newsletter.fingerprint}
          hasArchive={newsletter.archive.length > 0}
          onChange={refresh}
        />
      )}
    </div>
  );
}
