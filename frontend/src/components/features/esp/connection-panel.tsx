"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeBadge } from "@/components/shared/mode-badge";
import { looptiltApi } from "@/lib/looptilt-api";
import type { EspStatus } from "@/lib/types/looptilt";

interface ConnectionPanelProps {
  newsletterId: string;
  onChange: () => void;
}

export function ConnectionPanel({ newsletterId, onChange }: ConnectionPanelProps) {
  const [status, setStatus] = useState<EspStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = () => looptiltApi.getEspStatus(newsletterId).then(setStatus).catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [newsletterId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const esp = params.get("esp");
    if (esp === "connected") {
      setNote("Kit account connected via OAuth — webhooks registered.");
    } else if (esp === "error") {
      setError("Kit connection failed or was cancelled. Please try again.");
    }
    if (esp) {
      params.delete("esp");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    }
  }, []);

  const connectKitOAuth = async () => {
    setBusy("live");
    setError(null);
    setNote(null);
    try {
      const { url } = await looptiltApi.getKitOAuthUrl(newsletterId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Kit OAuth");
      setBusy(null);
    }
  };

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
                Connect your Kit account securely with OAuth. You&apos;ll grant access on Kit and be
                returned here. Registers webhooks and writes tags back to Kit.
              </p>
              <div className="mt-3">
                <Button className="w-full" disabled={busy !== null} onClick={connectKitOAuth}>
                  {busy === "live" ? "Redirecting to Kit..." : "Connect with Kit"}
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
              One click seeds demo archive, fingerprint topics, 60 subscribers, 10 issues of signals,
              and runs the full re-segmentation loop.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              disabled={busy !== null}
              onClick={() =>
                run(
                  "seed",
                  () => looptiltApi.seedSimulator(newsletterId),
                  "Demo data ready — check Signals and Segments tabs"
                )
              }
            >
              {busy === "seed" ? "Seeding..." : "Seed demo data"}
            </Button>
            <Button
              variant="subtle"
              disabled={busy !== null}
              onClick={() =>
                run("recompute", () => looptiltApi.recompute(newsletterId), "Loop recomputed")
              }
            >
              {busy === "recompute" ? "Running..." : "Re-run the loop"}
            </Button>
          </CardContent>
        </Card>
      )}

      {status?.connected && !isDemo && (
        <Card>
          <CardHeader>
            <CardTitle>Re-segmentation loop</CardTitle>
            <CardDescription>
              Recompute reader fingerprints and segment membership now from the latest Kit signals,
              and write segment tags back to Kit. Also runs automatically on a schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={busy !== null}
              onClick={() =>
                run("recompute", () => looptiltApi.recompute(newsletterId), "Loop recomputed")
              }
            >
              {busy === "recompute" ? "Running..." : "Run the loop now"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
