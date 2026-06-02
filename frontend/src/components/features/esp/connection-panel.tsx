"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeBadge } from "@/components/shared/mode-badge";
import { looptiltApi } from "@/lib/looptilt-api";
import type { EspStatus } from "@/lib/types/looptilt";

interface ConnectionPanelProps {
  newsletterId: string;
  onChange: () => void;
}

export function ConnectionPanel({ newsletterId, onChange }: ConnectionPanelProps) {
  const [status, setStatus] = useState<EspStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = () => looptiltApi.getEspStatus(newsletterId).then(setStatus).catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [newsletterId]);

  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    setError(null);
    setNote(null);
    try {
      await fn();
      await refresh();
      onChange();
      if (success) setNote(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const isDemo = status?.dataSource === "SIMULATOR";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ESP connection</CardTitle>
              <CardDescription>
                LoopTilt sits on top of Kit. It reads signals, writes the reader profile back, and
                delivers per-segment variants. It never sends email itself.
              </CardDescription>
            </div>
            <ModeBadge dataSource={status?.dataSource ?? null} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {note && <p className="rounded-lg bg-midnight-green/10 p-3 text-sm text-midnight-green dark:text-sand-yellow">{note}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Live (Kit)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect a real Kit v4 API key. Registers webhooks and writes tags back to Kit.
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="kit-key">Kit API key</Label>
                <Input
                  id="kit-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="kit_v4_..."
                  type="password"
                />
                <Button
                  className="w-full"
                  disabled={busy !== null || !apiKey.trim()}
                  onClick={() =>
                    run("live", () =>
                      looptiltApi.connectEsp(newsletterId, { dataSource: "LIVE_KIT", apiKey })
                    )
                  }
                >
                  {busy === "live" ? "Connecting..." : "Connect Kit"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Demo data</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the full loop locally with a simulated signal stream. Disabled in production.
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                disabled={busy !== null}
                onClick={() =>
                  run("demo", () =>
                    looptiltApi.connectEsp(newsletterId, { dataSource: "SIMULATOR" })
                  )
                }
              >
                {busy === "demo" ? "Enabling..." : "Use demo data"}
              </Button>
            </div>
          </div>

          {status?.connected && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={() => run("disconnect", () => looptiltApi.disconnectEsp(newsletterId))}
            >
              Disconnect
            </Button>
          )}
        </CardContent>
      </Card>

      {isDemo && (
        <Card>
          <CardHeader>
            <CardTitle>Demo signal simulator</CardTitle>
            <CardDescription>
              Seed subscribers and generate a realistic stream (opens, topic-encoded clicks, explicit
              signals), then run the loop. Generate a fingerprint first so topics exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="subtle"
              disabled={busy !== null}
              onClick={() =>
                run("seed", () => looptiltApi.seedSimulator(newsletterId, 60), "Seeded 60 demo subscribers")
              }
            >
              {busy === "seed" ? "Seeding..." : "Seed 60 subscribers"}
            </Button>
            <Button
              variant="subtle"
              disabled={busy !== null}
              onClick={() =>
                run("signals", () => looptiltApi.generateSignals(newsletterId, 10), "Generated 10 issues of signals")
              }
            >
              {busy === "signals" ? "Generating..." : "Generate 10 issues of signals"}
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() =>
                run("recompute", () => looptiltApi.recompute(newsletterId), "Loop recomputed")
              }
            >
              {busy === "recompute" ? "Running..." : "Run the loop"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
