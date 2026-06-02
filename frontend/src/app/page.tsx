"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Archive,
  Check,
  Fingerprint,
  MailOpen,
  MousePointerClick,
  PenLine,
  Reply,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LOOP_STEPS = [
  { icon: Archive, label: "Import your archive", detail: "Paste past issues. No integration required." },
  { icon: Fingerprint, label: "Build your fingerprint", detail: "Topics, voice, audience, and depth" },
  { icon: Users, label: "Sort readers into segments", detail: "Kit signals reshape segments over time" },
  { icon: Send, label: "Send the right version", detail: "One voice-matched variant per segment" },
];

const CAPABILITIES = [
  {
    icon: Fingerprint,
    title: "Newsletter Fingerprint",
    description:
      "LoopTilt reads your archive and maps your topics, voice, depth, and recurring obsessions, so every draft sounds unmistakably like you.",
  },
  {
    icon: PenLine,
    title: "AI Ghostwriter",
    description:
      "Generate a first draft of your next issue in seconds, grounded in your real voice. Edit, approve, and you're done.",
  },
  {
    icon: RefreshCw,
    title: "Adaptive Segments",
    description:
      "Reader behavior from Kit continuously reshapes your segments, so the right people get the right version of every issue.",
  },
];

const AUDIENCE_POINTS = [
  {
    icon: Activity,
    title: "Every signal becomes understanding",
    description:
      "Opens, clicks, and replies flow in from Kit and build a living fingerprint of what each reader actually cares about.",
  },
  {
    icon: RefreshCw,
    title: "Segments that re-sort themselves",
    description:
      "As interests shift, readers move between segments automatically. Your audience tilts the segmentation, not a one-time rule you set and forget.",
  },
  {
    icon: Tag,
    title: "Synced back to Kit",
    description:
      "Reader profiles are written back as tags and custom fields, so you can use the same intelligence anywhere you already work.",
  },
];

const SIGNALS = [
  { icon: MailOpen, label: "Opened 9 of last 10 issues" },
  { icon: MousePointerClick, label: "Clicked deep-dive links" },
  { icon: Reply, label: "Replied to the last issue" },
];

const SEGMENTS = ["Deep divers", "Weekend skimmers", "New & curious", "At-risk"];

const TRUST_POINTS = [
  "Works with Kit (ConvertKit)",
  "Drafts only. You approve every send",
];

const WITHOUT_LOOPTILT = [
  "One compromise issue for everyone",
  "Segments you set once and forget",
  "Personalization means hours of manual editing",
];

const WITH_LOOPTILT = [
  "A version tuned to each reader segment",
  "Segments that update as readers change",
  "Drafts written in your voice, ready to approve",
];

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isPending || session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-cream text-foreground dark:bg-eerie-black">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-light-silver/30 bg-background/80 backdrop-blur-md dark:border-gunmetal/30"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pantone-orange to-midnight-green">
              <RefreshCw className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold md:text-base">LoopTilt</div>
              <div className="hidden text-xs text-muted-foreground sm:block">
                Newsletter personalization for Kit
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href="#how-it-works"
              className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-pantone-orange dark:text-foreground/90 dark:hover:text-sand-yellow md:inline-block"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-pantone-orange dark:text-foreground/90 dark:hover:text-sand-yellow md:inline-block"
            >
              Features
            </a>
            <a
              href="#audience"
              className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-pantone-orange dark:text-foreground/90 dark:hover:text-sand-yellow md:inline-block"
            >
              Audience
            </a>
            <ThemeToggle />
            <Link href="/signin">
              <Button variant="outline" size="sm" className="hidden border-foreground/20 sm:inline-flex">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-pantone-orange text-primary-foreground hover:bg-pantone-orange/90 shadow-md"
              >
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="pt-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-ivory-cream via-wheat/40 to-sand-yellow/30 dark:from-eerie-black dark:via-gunmetal/40 dark:to-ty-blue/20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-ty-blue/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-midnight-green/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pantone-orange/5 blur-3xl" />
          </div>

          <div className="relative container mx-auto px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6 text-center lg:text-left md:space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-ty-blue/10 px-4 py-2 text-xs font-medium text-ty-blue dark:text-sand-yellow sm:text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Newsletter personalization for Kit
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                >
                  Personalize every send{" "}
                  <span className="bg-gradient-to-r from-ty-blue via-midnight-green to-pantone-orange bg-clip-text text-transparent dark:from-pantone-orange dark:via-sand-yellow dark:to-wheat">
                    in your own voice
                  </span>
                  .
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
                >
                  LoopTilt learns your newsletter&apos;s voice, topics, and audience from your past
                  issues, then drafts your next send and tailors a version for every reader segment.
                  It plugs into Kit, so you stay in control of what goes out.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
                >
                  <Link href="/signup" className="flex-1 sm:flex-none">
                    <Button
                      size="lg"
                      className="w-full bg-pantone-orange px-6 text-sm text-primary-foreground shadow-lg hover:bg-pantone-orange/90 sm:text-base"
                    >
                      Start free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#how-it-works" className="flex-1 sm:flex-none">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-foreground/20 px-6 text-sm hover:bg-foreground hover:text-background dark:border-foreground/30 sm:text-base"
                    >
                      See how it works
                    </Button>
                  </a>
                </motion.div>

                <motion.ul
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start"
                >
                  {TRUST_POINTS.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-pantone-orange" />
                      {item}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative mx-auto w-full max-w-md lg:max-w-none"
              >
                <Card className="border-2 border-light-silver/30 bg-card/80 shadow-2xl backdrop-blur-sm dark:border-gunmetal/40">
                  <CardContent className="space-y-5 p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pantone-orange/15">
                        <RefreshCw className="h-5 w-5 text-pantone-orange" />
                      </div>
                      <div>
                        <p className="font-semibold">How the loop works</p>
                        <p className="text-xs text-muted-foreground">From archive to a tailored send</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {LOOP_STEPS.map((step, index) => (
                        <div key={step.label}>
                          <div className="flex items-start gap-3 rounded-lg border border-light-silver/40 bg-background/60 p-3 dark:border-gunmetal/50">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-ty-blue/10 text-ty-blue dark:text-sand-yellow">
                              <step.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{step.label}</p>
                              <p className="text-xs text-muted-foreground">{step.detail}</p>
                            </div>
                          </div>
                          {index < LOOP_STEPS.length - 1 && (
                            <div className="flex justify-center py-0.5" aria-hidden="true">
                              <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-pantone-orange opacity-20 animate-pulse sm:-top-4 sm:-right-4 sm:h-20 sm:w-20 hidden lg:block" />
                <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-midnight-green opacity-30 animate-pulse delay-1000 sm:-bottom-4 sm:-left-4 sm:h-16 sm:w-16 hidden lg:block" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-light-silver/30 bg-wheat/30 py-20 dark:border-gunmetal/30 dark:bg-gunmetal/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                One newsletter. Thousands of different readers.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sending a unique issue to every subscriber by hand is impossible, so most
                newsletters settle for a single compromise. LoopTilt understands your content deeply
                enough to adapt each send to the reader, in your voice, without adding hours to your
                week.
              </p>
            </motion.div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-light-silver bg-card/60 shadow-sm dark:border-gunmetal/50">
                  <CardContent className="p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Writing by hand
                    </p>
                    <ul className="mt-4 space-y-3">
                      {WITHOUT_LOOPTILT.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                            <X className="h-3 w-3" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-pantone-orange/30 bg-pantone-orange/5 shadow-md dark:border-pantone-orange/40">
                  <CardContent className="p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-pantone-orange">
                      With LoopTilt
                    </p>
                    <ul className="mt-4 space-y-3">
                      {WITH_LOOPTILT.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-pantone-orange/15 text-pantone-orange">
                            <Check className="h-3 w-3" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-pantone-orange sm:text-sm">
              What you get
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              One engine. Everything personalization needs.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A single fingerprint of your newsletter powers writing and segmentation alike, so the
              two reinforce each other instead of fighting for your time.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {CAPABILITIES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-light-silver bg-card shadow-md transition-shadow hover:shadow-lg dark:border-gunmetal/50">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pantone-orange/15 to-midnight-green/15 text-pantone-orange">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="audience" className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-pantone-orange sm:text-sm">
                Audience intelligence
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Your newsletter learns who&apos;s really reading
              </h2>
              <p className="mt-4 text-muted-foreground">
                Most segmentation is a guess you make once and never revisit. LoopTilt watches how
                readers actually behave, builds a fingerprint for each one, and keeps re-sorting them
                as their interests change, so every send is aimed at who your readers are today, not
                who they were when you first tagged them.
              </p>

              <ul className="mt-8 space-y-5">
                {AUDIENCE_POINTS.map((point) => (
                  <li key={point.title} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pantone-orange/15 to-midnight-green/15 text-pantone-orange">
                      <point.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{point.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              className="mx-auto w-full max-w-md lg:max-w-none"
            >
              <Card className="border-2 border-light-silver/30 bg-card/80 shadow-2xl backdrop-blur-sm dark:border-gunmetal/40">
                <CardContent className="space-y-5 p-6 sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Reader signals
                    </p>
                    <div className="mt-3 space-y-2">
                      {SIGNALS.map((signal) => (
                        <div
                          key={signal.label}
                          className="flex items-center gap-3 rounded-lg border border-light-silver/40 bg-background/60 p-3 dark:border-gunmetal/50"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-ty-blue/10 text-ty-blue dark:text-sand-yellow">
                            <signal.icon className="h-4 w-4" />
                          </div>
                          <p className="text-sm">{signal.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-px flex-1 bg-light-silver/50 dark:bg-gunmetal/60" />
                    <RefreshCw className="h-3.5 w-3.5 text-pantone-orange" />
                    re-sorts the reader into
                    <span className="h-px flex-1 bg-light-silver/50 dark:bg-gunmetal/60" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SEGMENTS.map((segment, i) => (
                      <span
                        key={segment}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                          i === 0
                            ? "bg-pantone-orange/15 text-pantone-orange ring-1 ring-pantone-orange/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {segment}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-light-silver/30 bg-wheat/30 py-20 dark:border-gunmetal/30 dark:bg-gunmetal/20"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-pantone-orange sm:text-sm">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                From your archive to a tailored send
              </h2>
              <p className="mt-4 text-muted-foreground">
                Set it up once. After that, every issue gets smarter as your readers tell you what
                they care about.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {LOOP_STEPS.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="h-full border border-light-silver bg-card shadow-md dark:border-gunmetal/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ty-blue/10 text-ty-blue dark:text-sand-yellow">
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className="text-3xl font-bold text-light-silver dark:text-gunmetal">
                          {i + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold">{step.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-wheat/20 dark:bg-gunmetal/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-ty-blue/15 bg-card/90 shadow-xl shadow-ty-blue/5 backdrop-blur-sm dark:border-ty-blue/25 dark:bg-card/80 dark:shadow-none">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pantone-orange/10 via-midnight-green/8 to-ty-blue/12 dark:from-pantone-orange/15 dark:via-midnight-green/12 dark:to-ty-blue/20"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-pantone-orange/15 blur-3xl dark:bg-pantone-orange/20"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-midnight-green/10 blur-3xl dark:bg-midnight-green/15"
                  aria-hidden="true"
                />

                <div className="relative p-8 text-center md:p-12">
                  <span className="inline-flex items-center gap-2 rounded-full bg-ty-blue/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-ty-blue dark:text-sand-yellow">
                    <Sparkles className="h-3.5 w-3.5 text-pantone-orange" />
                    Ready when you are
                  </span>

                  <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                    Give every reader an issue that feels{" "}
                    <span className="bg-gradient-to-r from-ty-blue via-midnight-green to-pantone-orange bg-clip-text text-transparent dark:from-pantone-orange dark:via-sand-yellow dark:to-wheat">
                      written for them
                    </span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Connect your archive, generate your fingerprint, and send your first
                    personalized issue today.
                  </p>

                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                    <Link href="/signup" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full bg-pantone-orange px-8 text-primary-foreground shadow-lg transition-all hover:bg-pantone-orange/90 hover:shadow-xl sm:min-h-[56px] sm:text-lg"
                      >
                        Start free
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/signin" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-foreground/20 text-foreground transition-all hover:bg-foreground hover:text-background dark:border-foreground/30 sm:min-h-[56px] sm:px-8 sm:text-lg"
                      >
                        Sign in
                      </Button>
                    </Link>
                  </div>

                  <ul className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
                    {TRUST_POINTS.map((point) => (
                      <li
                        key={point}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pantone-orange/15 text-pantone-orange">
                          <Check className="h-3 w-3" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-light-silver bg-ivory-cream py-8 dark:border-gunmetal/50 dark:bg-eerie-black">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>LoopTilt · Newsletter personalization for Kit</p>
          <p>Built by Temitayo Sadique · June 2026</p>
        </div>
      </footer>
    </div>
  );
}
