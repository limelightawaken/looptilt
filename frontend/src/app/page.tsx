"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending || session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              LT
            </div>
            <span className="text-lg font-semibold tracking-tight">LoopTilt</span>
          </div>
          <div className="flex items-center gap-3">
            {!isPending && session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-pantone-orange">
            Newsletter Fingerprint Engine
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Understand what your newsletter actually says. Then act on it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Most AI tools write generic drafts. LoopTilt reads your archive, builds a structured
            fingerprint of your topics, voice, and audience, and uses that understanding to draft
            in your voice — and eventually personalize each send per reader.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Start with Ghostwriter (v1)
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              See how the loop works
            </a>
          </div>
        </section>

        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3 sm:px-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">The problem</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Creators write for an average reader who does not exist. Personalization is obvious
                but impossibly expensive — so everyone sends the same compromise issue.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">The insight</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Build one engine that genuinely understands your content. Two features fall out of
                it — adaptive re-segmentation and voice-preserving ghostwriting — and they reinforce
                each other.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">The posture</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                LoopTilt does not send email. It sits on top of the ESP you already use — Kit first —
                reading signals out, writing profiles back, and delivering variants through segments.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">The LoopTilt loop</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Re-segmentation makes email engaging but creates demand creators cannot meet alone.
            Ghostwriter makes that demand affordable. Both draw on the same fingerprint.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Shared engine
              </p>
              <h3 className="mt-2 text-xl font-semibold">Newsletter Fingerprint</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Topics, voice, audience, depth, obsessions — extracted from your archive by reading
                it the way a sharp editor would.
              </p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                v1 — shipping now
              </p>
              <h3 className="mt-2 text-xl font-semibold">Ghostwriter</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Paste your archive, generate your fingerprint, draft the next issue in your voice.
                No ESP integration required. Value on day one.
              </p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                shipping now
              </p>
              <h3 className="mt-2 text-xl font-semibold">Re-segmentation Loop</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Kit signals reshape each reader&apos;s fingerprint and segment. The ghostwriter assembles
                one variant per segment from modular blocks — affordable personalization at scale.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary py-16 text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold">Built for newsletter operators, not generic AI demos</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              End-to-end: archive ingestion, fingerprint generation, Kit signal capture, the
              reader-fingerprint and segmentation loop, and per-segment voice-preserving sends.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>LoopTilt — Newsletter Fingerprint Engine</p>
          <p>Author: Tayo Sadique · June 2026</p>
        </div>
      </footer>
    </div>
  );
}
