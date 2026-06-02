# LoopTilt

**Newsletter personalization for Kit (ConvertKit)**

> Most AI in the newsletter world points at the *drafting* problem ("write me an issue"). LoopTilt points at the *understanding* problem, then uses that understanding to power engagement, retention, and affordable output.

**Author:** Tayo Sadique · **Status:** Full end-to-end system · **Last updated:** June 2026

---

## Positioning and naming

| Layer | What to call it | Where it shows up |
|-------|-----------------|-------------------|
| **Category (creator-facing)** | Newsletter personalization for Kit | Website, SEO, sales, README headline |
| **Mechanism (product-internal)** | Newsletter fingerprint (+ reader fingerprints) | Architecture, API, dashboard, PRD technical sections |

**Newsletter personalization for Kit** is the market category: personalize sends per reader segment, in the creator's voice, on top of Kit. Creators and search use language like "newsletter personalization," "ConvertKit," and "segmented sends."

**Newsletter fingerprint** is how LoopTilt delivers that category. It is a structured profile of the publication (topics, voice, audience, depth, obsessions) built from the archive. Reader fingerprints and Kit signals power adaptive segments; the ghostwriter assembles per-segment variants. Say "fingerprint" when explaining *why* LoopTilt is different from a generic AI writer, not as the shelf label on the landing page.

---

## The pitch

Newsletter creators with real lists don't have a writing problem — they have an **understanding** problem.

Every issue goes to the same list. Depth-seekers and skimmers get the same compromise. Disengagement stays invisible until it becomes an unsubscribe. Personalization is obviously better, but nobody can sustain N segments × M issues.

**LoopTilt reads your newsletter the way a sharp editor would** — topics, voice, audience, depth, obsessions — and turns that reading into action:

| | What it does | Why it matters |
|---|-------------|----------------|
| **Newsletter fingerprint** | AI reads your archive and builds a structured profile of what your publication actually is | One source of truth that every downstream feature draws on |
| **Reader fingerprint** | Scores every subscriber against that profile — topic affinities, lifecycle stage, churn slope | Per-reader understanding without manual tagging |
| **Re-segmentation loop** | Ingests Kit signals, updates reader profiles, sorts readers into segments, reshapes the next send | Engagement and retention from behavior, not guesswork |
| **Ghostwriter** | You write a menu of content blocks once; the engine assembles voice-preserving variants per segment | Makes segment-level personalization affordable at cadence |

**LoopTilt does not send email.** It sits on top of the ESP you already use — Kit (ConvertKit) first, same posture as SparkLoop. It reads signals out, writes reader profiles back as tags and custom fields, and delivers per-segment variants through Kit draft broadcasts. Sends are **per-segment, not per-person** — what every ESP can actually do, and what keeps variant count tractable.

The re-segmentation loop *creates* personalization demand; the ghostwriter *satisfies* it. Two features, one engine, mutually enabling.

---

## For reviewers — start here

**What to look at in this repo**

1. **The loop is real, not a mockup.** Archive → fingerprint → signals → reader profiles → segments → per-segment assembly → Kit draft broadcasts. Full stack, wired end to end.
2. **Kit v4 integration is live.** Webhooks in, tags/custom fields out, per-segment broadcasts as drafts. Adapter interface ready for other ESPs.
3. **Production safety is explicit.** Live vs demo data never mix. Simulator is dev-only. AI provider is reported at boot and on the readiness endpoint — no silent degradation.
4. **Try it without a Kit account.** Demo mode seeds subscribers, generates signals, and runs the full loop locally in ~5 minutes.

**Quick demo path** → [Demo walkthrough](#demo-walkthrough)

**Architecture at a glance**

```mermaid
flowchart LR
  Archive["Past issues"] --> FP["Newsletter fingerprint"]
  Kit["Kit signals"] --> RF["Reader fingerprints"]
  FP --> Segments["Segments"]
  RF --> Segments
  Segments --> GW["Ghostwriter"]
  FP --> GW
  GW --> Send["Per-segment drafts → Kit"]
  Segments -->|"tags + fields"| Kit
```

---

## Table of contents

### Product
1. [The problem LoopTilt solves](#the-problem-looptilt-solves)
2. [Product architecture: the loop](#product-architecture-the-loop)
3. [What is implemented](#what-is-implemented)
4. [Demo walkthrough](#demo-walkthrough)
5. [Design decisions & trade-offs](#design-decisions--trade-offs)

### Technical
6. [Seed vs production (no silent fallback)](#seed-vs-production-no-silent-fallback)
7. [The AI layer](#the-ai-layer)
8. [Kit (ConvertKit) integration](#kit-convertkit-integration)
9. [Technical architecture](#technical-architecture)
10. [Data model](#data-model)
11. [API reference](#api-reference)
12. [Getting started](#getting-started)
13. [Project structure](#project-structure)
14. [Environment variables](#environment-variables)
15. [Deployment notes](#deployment-notes)

---

## Executive summary

LoopTilt is a micro-SaaS for newsletter operators — especially those in the SparkLoop / Kit ecosystem — built around one idea: **build something that genuinely understands a newsletter's content, and you can solve both engagement and churn at once.**

That one thing is the **newsletter fingerprint**: a structured profile (topics, voice, audience, depth, obsessions) produced by an AI reading the archive. It has a per-subscriber counterpart, the **reader fingerprint** (topic affinities, lifecycle stage, churn propensity, segment membership). Together they power two mutually reinforcing features:

| Feature | Role | Status |
|---------|------|--------|
| **Ghostwriter** | Learns the voice from the archive; assembles per-segment variants from an issue's content blocks | Implemented |
| **Re-segmentation loop** | Reads Kit signals, computes the reader fingerprint, sorts readers into segments, and reshapes the next send per segment | Implemented |

This repository is the **full system, end to end**: archive ingestion → fingerprint (OpenAI-compatible) → Kit signal capture (or a local simulator) → reader fingerprints + churn detection → default and AI-built segments → per-segment voice-preserving sends → Kit draft broadcasts.

---

## The problem LoopTilt solves

Newsletter creators with real lists hit a ceiling:

- **Engagement:** The same issue goes to depth-seekers and skimmers alike. Compromise content underperforms for both.
- **Retention:** Disengagement is invisible until it becomes an unsubscribe — by then it's usually too late.
- **Production cost:** Personalization is obviously better, but N segments × M issues = workload nobody can sustain.

These are one problem wearing two coats: **nothing in the stack actually understands the content.** Drafting tools generate words; analytics count opens. LoopTilt reads the newsletter the way a sharp editor would and turns that reading into per-reader action — then makes acting on it affordable.

---

## Product architecture: the loop

```mermaid
flowchart TB
  subgraph inputs["Inputs"]
    Kit["Kit (ConvertKit) v4"]
    Sim["Simulator (dev only)"]
    Newsletter["Newsletter fingerprint (OpenAI)"]
  end

  subgraph signals["Signal pipeline"]
    Ingest["Signal ingestion (fast 2xx)"]
    Events["Events table (append-only, source-tagged)"]
    Recompute["Recompute job (scheduled + on demand)"]
    Reader["Reader fingerprint (affinities, lifecycle, churn slope)"]
  end

  subgraph personalize["Personalization"]
    Segments["Default + AI-built segments"]
    Ghost["Ghostwriter: blocks to per-segment variants"]
    Sends["Per-segment broadcasts (draft by default)"]
  end

  Kit -->|"webhooks (link_click, lifecycle)"| Ingest
  Sim --> Events
  Ingest --> Events
  Events -->|"events matching connection.dataSource"| Recompute
  Recompute --> Reader
  Reader --> Segments
  Newsletter --> Segments
  Newsletter --> Ghost
  Segments --> Ghost
  Ghost --> Sends
  Segments -->|"tags + fields (LIVE_KIT only)"| Kit
  Sends -->|"POST /v4/broadcasts (LIVE_KIT only)"| Kit
```

**Why this is one product, not two.** Re-segmentation makes the email engaging but creates demand the creator cannot meet alone (a variant per segment). The ghostwriter makes that demand affordable: the creator adds an issue's content blocks once, and the engine assembles/orders them per segment in the creator's own voice. The loop *creates* the personalization demand; the ghostwriter *satisfies* it — both drawing on the same fingerprint.

---

## What is implemented

### Backend (NestJS modules)

| Module | Responsibility |
|--------|----------------|
| `ai` | Provider-agnostic AI layer: `OpenAiProvider` (structured JSON, zod-validated) + `HeuristicProvider` fallback; explicit selection |
| `newsletters` | Workspaces + archive ingestion |
| `fingerprints` | Newsletter fingerprint generation (via AI), promotes topics to stable rows for click mapping |
| `esp` | `EspAdapter` interface, Kit v4 client, connection management, **gated** signal simulator |
| `signals` | Inbound Kit webhook ingestion (append-only, source-stamped), per-link topic encoding |
| `reader-fingerprints` | Per-subscriber matrix, lifecycle staging, **churn detector (slope, not level)**, insights |
| `segments` | Zero-setup default segments + AI custom-segment builder; Kit tag write-back |
| `loop` | Recompute orchestration (reader fingerprints + segment reassignment), hourly scheduler + manual trigger |
| `ghostwriter` | Per-issue content blocks (copy, links, images, promotions, instructions) + per-segment voice-preserving assembly |
| `sends` | Generate one variant per segment; push to Kit as **draft** broadcasts (Live mode only) |

### Frontend (Next.js)

A restrained, editorial dashboard (shadcn-style primitives + Framer Motion) with a per-newsletter workspace: **Connection** (Live Kit vs Demo data + simulator controls), **Archive**, **Fingerprint**, **Signals** (lifecycle mix, topic engagement, churn-risk readers), **Segments** (defaults + AI builder with rule/rationale/match-count), and **Send** (create an issue, add its content blocks — copy, links, images, promotions, instructions — then generate per-segment variants and push to Kit). A persistent **mode badge** shows Live (Kit) vs Demo data everywhere.

---

## Demo walkthrough

The full loop runs locally without a Kit account using **Demo data** mode.

1. **Sign up**, then create a newsletter (e.g. "The Growth Brief").
2. **Archive tab** — paste 2–3 past issues.
3. **Fingerprint tab** — Generate. Review topics, voice, audience, depth (shows whether OpenAI or heuristic produced it).
4. **Connection tab** — choose **Use demo data**, then click **Seed demo data** (archive, fingerprint, subscribers, signals, and loop in one step).
5. **Signals tab** — see the lifecycle mix, topic engagement, and the highest churn-risk readers (the simulator deliberately includes declining readers so the churn-slope detector lights up).
6. **Segments tab** — defaults appear automatically. Try the AI builder: type "readers who cooled off and lean technical" → Preview → see the rule, rationale, and live match count → Save.
7. **Send tab** — create an issue, then add its content blocks (copy, links, images, promotions, or author instructions). Click **Generate variants** and the ghostwriter produces one voice-preserving variant per segment. (In Live mode, "Push to Kit" creates draft broadcasts per segment tag.)

To use **Live (Kit)** instead: Connection tab → paste a Kit v4 API key → Connect. Webhooks register automatically and signals flow from Kit.

---

## Design decisions & trade-offs

- **Explicit data-source mode over fallback.** Live and simulated data are physically separated by `source` and never mix; production can't run the simulator. This is the single most important production-safety property.
- **Heuristic AI fallback is dev-only.** Production fails fast without an OpenAI key (unless explicitly allowed), so you never ship degraded analysis unknowingly.
- **Per-segment, not per-person, delivery.** Matches what Kit (and most ESPs) can actually do and bounds the ghostwriter's work to a handful of variants.
- **Churn = slope, not level.** A reader at 40% opens trending 70→60→50→40 is riskier than a steady-40% reader. The detector reads the derivative.
- **Broadcasts default to drafts.** No accidental sends to a whole list during a demo or in production.
- **Adapter interface.** Kit is the only implementation today; beehiiv/Klaviyo/Mailchimp slot in behind `EspAdapter`.
- **No GraphQL.** The starter's unused tRPC scaffold was removed in favor of typed REST, consistent with the NestJS module conventions.

---

# Technical documentation

Everything below is for engineers setting up, extending, or deploying the system.

---

## Seed vs production (no silent fallback)

A core safety property: **the product never quietly runs on fake data.** Two independent guarantees:

1. **Data source is an explicit per-newsletter mode, not a fallback.**
   - `EspConnection.dataSource` is `LIVE_KIT` or `SIMULATOR`. A newsletter is in exactly one mode.
   - Every `Subscriber` and `SignalEvent` is stamped with its `source` (`LIVE_KIT` or `SIMULATOR`), indexed by `(newsletterId, source)`.
   - The recompute job, reader fingerprints, segments, and sends read **only** events whose source matches the connection's mode. A live newsletter physically cannot read simulator rows.

2. **The simulator cannot run in production.**
   - Gated by `ENABLE_SIMULATOR` **and** a hard `NODE_ENV !== 'production'` check (`SimulatorGuard` returns 403). The simulator controller is **not even registered** in production.
   - Creating a `SIMULATOR` connection is blocked in production.
   - Boot-time env validation refuses to start production if `ENABLE_SIMULATOR=true`.

3. **Visibility.** `GET /api/health/readiness` reports the active `aiProvider` (openai vs heuristic) and connection counts per data source, so monitoring can assert `AI=openai, dataSource=LIVE_KIT`.

The same principle applies to the AI layer: **in production the app fails fast at boot if `OPENAI_API_KEY` is missing**, unless `ALLOW_HEURISTIC_FALLBACK=true` is explicitly set. No silent degraded AI.

---

## The AI layer

The newsletter fingerprint, the AI segment builder, and per-segment assembly are all LLM jobs. They go through `AiService`, which resolves one provider explicitly:

- **`OpenAiProvider`** — used whenever `OPENAI_API_KEY` is set. Works with any OpenAI-compatible API (OpenAI, DeepSeek, Ollama, etc.) via optional `OPENAI_BASE_URL`. Returns structured JSON validated with zod; on a malformed response it falls back to the heuristic result for that single call so a transient model error never breaks a feature.
- **`HeuristicProvider`** — a deterministic, dependency-free analyzer. It fills the exact same schemas, so the whole system runs without an API key in development (lower quality, clearly reported via the readiness endpoint and the fingerprint's `generatedBy`).

---

## Kit (ConvertKit) integration

Implemented against Kit's **v4** API (`https://api.kit.com/v4`, `X-Kit-Api-Key` auth) per the three jobs in `kit-api-integration.md`:

- **Job 1 — read signals out.** Webhooks register on connect (`link_click`, `subscriber_activate/unsubscribe/bounce/complain`, `form_subscribe`, `tag_add/remove`). The receiver responds `2xx` fast and stores events append-only. Every outbound link is topic+position encoded (`?lt=<slug>&pos=<upper|lower>`) so an inbound `link_click` maps to a fingerprint topic. (Opens are not in Kit webhooks — the loop's graceful-degradation handles this by leaning on clicks/lifecycle.)
- **Job 2 — write the reader profile back.** Segment membership is written as Kit **tags**; the bounded score summary maps to custom fields. Rate-limit-aware (120/60s) with exponential backoff.
- **Job 3 — deliver adaptive content.** Per-segment sends via `POST /v4/broadcasts` with a single-group `subscriber_filter` targeting the segment's tag. **Created as drafts (`public:false`) by default** with an empty-filter guard — LoopTilt never auto-sends to the whole list.

The Kit adapter sits behind an `EspAdapter` interface so beehiiv / Klaviyo / Mailchimp are future implementations, not rewrites.

---

## Technical architecture

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16, React 19, Tailwind 4, Framer Motion | App Router; editorial design system |
| Backend | NestJS 11 | Modular domains, Swagger, Better Auth, `@nestjs/schedule`, `@nestjs/throttler` |
| Database | PostgreSQL + Prisma 6 | Append-only events + relational fingerprint/segment model |
| AI | OpenAI-compatible (`openai` SDK) + heuristic fallback | Works with OpenAI, DeepSeek, Ollama, etc. via `OPENAI_BASE_URL`; zod-validated structured output |
| Secrets | AES-256-GCM (`CryptoService`) | Kit API keys encrypted at rest |

---

## Data model

```
User
 └── Newsletter
      ├── ArchiveIssue[]
      ├── NewsletterFingerprint (1:1)
      ├── NewsletterTopic[]          ← stable ids for click->topic mapping
      ├── EspConnection? (dataSource: LIVE_KIT | SIMULATOR; encrypted key)
      ├── Subscriber[] (source-tagged)
      │     ├── SignalEvent[] (append-only, source-tagged)
      │     ├── ReaderFingerprint (1:1)
      │     └── SegmentMembership[]
      ├── Segment[] (DEFAULT_* | CUSTOM; rule + rationale + kitTagId)
      ├── ContentBlock[]             ← the ghostwriter block menu
      └── Send[] -> SegmentVariant[] (kitBroadcastId, status)
```

Migrations live in `backend/prisma/migrations/`.

---

## API reference

Base URL `http://localhost:3001/api` · Swagger at `/api/docs` · session-cookie auth.

### Newsletters & fingerprint
- `POST /newsletters`, `GET /newsletters`, `GET/PATCH/DELETE /newsletters/:id`
- `POST /newsletters/:id/archive`, `DELETE /newsletters/:id/archive/:issueId`
- `GET /newsletters/:id/fingerprint`, `POST /newsletters/:id/fingerprint/generate`

### ESP connection & simulator
- `GET /newsletters/:id/esp`, `POST /newsletters/:id/esp/connect`, `DELETE /newsletters/:id/esp`
- `POST /newsletters/:id/simulator/seed` *(dev only — full demo state in one call)*

### Signals (inbound)
- `POST /webhooks/kit/:newsletterId?event=<name>` — Kit webhook receiver

### Reader fingerprints, loop, segments
- `GET /newsletters/:id/readers`, `GET /newsletters/:id/readers/insights`
- `POST /newsletters/:id/loop/recompute`
- `GET /newsletters/:id/segments`, `POST /newsletters/:id/segments/preview`, `POST /newsletters/:id/segments`, `DELETE /newsletters/:id/segments/:segmentId`

### Ghostwriter blocks & sends
- `GET/POST /newsletters/:id/blocks`, `PATCH/DELETE /newsletters/:id/blocks/:blockId`
- `GET/POST /newsletters/:id/sends`, `GET /newsletters/:id/sends/:sendId`, `POST /newsletters/:id/sends/:sendId/push-to-kit`

### Health
- `GET /health`, `GET /health/db`, `GET /health/readiness`

---

## Getting started

### Prerequisites
- Node.js 20+, PostgreSQL, npm

### Backend

```bash
cd backend
cp .env.example .env
```

Set at minimum in `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/looptilt?schema=public"
BETTER_AUTH_SECRET="a-32-char-minimum-secret"
ENCRYPTION_KEY="another-32-char-minimum-secret"
# Optional in dev (heuristic fallback runs without it); REQUIRED in production:
OPENAI_API_KEY=
# Optional — point at an OpenAI-compatible provider (omit for default OpenAI):
# OPENAI_BASE_URL=https://api.deepseek.com
# OPENAI_MODEL=deepseek-chat
# Dev only — must be false/unset in production:
ENABLE_SIMULATOR=true
```

```bash
npm install
npm run prisma:generate
npm run prisma:migrate      # apply migrations
npm run start:dev
```

API: `http://localhost:3001/api` · Swagger: `http://localhost:3001/api/docs`

### Frontend

```bash
cd frontend
echo 'NEXT_PUBLIC_BACKEND_URL=http://localhost:3001' > .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

---

## Project structure

```
looptilt/
├── looptilt-prd.md
├── kit-api-integration.md            # verified Kit v4 reference
├── backend/
│   ├── prisma/{schema.prisma,migrations/}
│   └── src/
│       ├── config/                   # app/ai/esp config + env validation
│       ├── common/{crypto,database,email,...}
│       └── modules/
│           ├── ai/                   # providers + AiService
│           ├── newsletters/ fingerprints/
│           ├── esp/                  # adapter, Kit client, connection, simulator
│           ├── signals/              # webhook ingestion + link encoder
│           ├── reader-fingerprints/  # matrix + churn detector + insights
│           ├── segments/             # defaults + AI builder + evaluator
│           ├── loop/                 # recompute service + scheduler
│           ├── ghostwriter/          # blocks + assembly
│           └── sends/                # per-segment variants + Kit push
└── frontend/
    └── src/
        ├── app/(protected)/dashboard/newsletters/[id]/   # workspace + tabs
        ├── components/{ui,shared,features/*}
        └── lib/{looptilt-api.ts, types/looptilt.ts, motion.ts}
```

---

## Environment variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (≥32 chars) |
| `ENCRYPTION_KEY` | Yes (prod) | ≥32-char secret for AES-256-GCM encryption of stored ESP keys |
| `OPENAI_API_KEY` | Yes in prod* | API key for OpenAI or any OpenAI-compatible provider; absent in dev uses heuristic fallback |
| `OPENAI_BASE_URL` | No | Base URL for OpenAI-compatible APIs (e.g. `https://api.deepseek.com`); omit for default OpenAI |
| `OPENAI_MODEL` | No | Model id for the configured provider; defaults to `gpt-4o-mini` |
| `ALLOW_HEURISTIC_FALLBACK` | No | Set `true` to explicitly allow heuristic AI in production |
| `ENABLE_SIMULATOR` | No | `true` enables the dev simulator; must be false/unset in production |
| `KIT_API_BASE_URL` | No | Defaults to `https://api.kit.com/v4` |
| `APP_PUBLIC_URL` | No | Public URL of this backend, used for Kit webhook targets |
| `FRONTEND_URL` | No | CORS origin |

*Production boot fails without `OPENAI_API_KEY` unless `ALLOW_HEURISTIC_FALLBACK=true`.

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | No | Backend API URL (default `http://localhost:3001`) |

---

## Deployment notes

- Set `NODE_ENV=production`, a strong `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`, and `OPENAI_API_KEY`.
- Ensure `ENABLE_SIMULATOR` is unset/false — production refuses to boot otherwise.
- Backend Docker image runs `prisma migrate deploy` on startup, then `node dist/main.js` (set `DATABASE_URL` and other env vars on the container).
- For non-Docker deploys: run `npm run prisma:migrate:prod`, build (`npm run build`), and start (`npm run start:prod`).
- Point `APP_PUBLIC_URL` at the publicly reachable backend so Kit can deliver webhooks.
- Frontend: set `NEXT_PUBLIC_BACKEND_URL`, `npm run build`, deploy to Vercel or `npm run start`.

---

## License

MIT
