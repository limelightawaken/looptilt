# LoopTilt

**The Newsletter Fingerprint Engine**

> Most AI in the newsletter world points at the *drafting* problem ("write me an issue"). LoopTilt points at the *understanding* problem — then uses that understanding to power engagement, retention, and affordable output.

**Author:** Tayo Sadique  
**Status:** v1 prototype (Ghostwriter + Fingerprint Engine)  
**Last updated:** June 2026

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [The problem LoopTilt solves](#the-problem-looptilt-solves)
3. [Product architecture: the loop](#product-architecture-the-loop)
4. [What is implemented in this repo (v1)](#what-is-implemented-in-this-repo-v1)
5. [Roadmap (v2)](#roadmap-v2)
6. [Technical architecture](#technical-architecture)
7. [Data model](#data-model)
8. [API reference](#api-reference)
9. [Getting started](#getting-started)
10. [Demo walkthrough](#demo-walkthrough)
11. [Design decisions & trade-offs](#design-decisions--trade-offs)
12. [ESP integration strategy](#esp-integration-strategy)
13. [Project structure](#project-structure)
14. [Environment variables](#environment-variables)
15. [Deployment notes](#deployment-notes)

---

## Executive summary

LoopTilt is a micro-SaaS concept built for newsletter operators — especially those in the SparkLoop ecosystem — who face two linked problems:

1. **They write for an average reader who does not exist.** Everyone gets the same issue; edges disengage and churn.
2. **They cannot scale personalization.** Writing different versions per segment costs more time than any solo creator has.

These look like two problems. They are one problem wearing two coats: **nothing in the stack actually understands the content.** Drafting tools generate words. Analytics count opens. Nobody reads the newsletter the way a sharp human editor would — and turns that reading into per-reader action.

LoopTilt's answer is a **Newsletter Fingerprint**: a structured profile (topics, voice, audience, depth, obsessions) produced by reading a creator's archive. That single artifact powers two mutually reinforcing features:

| Feature | Role | Ships |
|---------|------|-------|
| **Ghostwriter** | Drafts new issues (and eventually per-reader variants) in the creator's voice | **v1 — this repo** |
| **Re-segmentation loop** | Learns each reader from behavioral signals and reshapes the next send | v2 — schema ready |

This repository is a **working full-stack prototype of v1**: creators can sign up, create a newsletter workspace, paste archive issues, generate a structured fingerprint, and produce ghostwriter draft scaffolds — end to end.

It is intentionally built on a production-grade starter stack (NestJS, Next.js, PostgreSQL, Better Auth) so v2 ESP integrations and signal ingestion can extend the same foundation without a rewrite.

---

## The problem LoopTilt solves

Newsletter creators with real lists hit a ceiling:

- **Engagement:** The same issue goes to depth-seekers and skimmers alike. Compromise content underperforms for both.
- **Retention:** Disengagement is invisible until it becomes an unsubscribe — by then it's usually too late.
- **Production cost:** Personalization is obviously better, but N segments × M issues = workload nobody can sustain.

Existing tools address symptoms, not the root cause:

| Tool category | What it does | What it misses |
|---------------|--------------|----------------|
| AI drafting (ChatGPT, etc.) | Generic copy on any topic | No knowledge of *your* voice or archive |
| ESP analytics | Opens, clicks, counts | No semantic link between clicks and *topics* |
| Segmentation (tags, lists) | Static buckets | No adaptive learning from behavior over time |

LoopTilt's bet: **build understanding once, use it everywhere.**

---

## Product architecture: the loop

```
            ┌─────────────────────────────┐
            │   NEWSLETTER FINGERPRINT     │
            │   (the shared engine)        │
            └─────────────────────────────┘
                 │                   │
       learns    ▼                   ▼   generates in
       the reader│                   │   the creator's voice
          ┌──────────────┐     ┌─────────────┐
          │ RE-SEGMENT   │────▶│ GHOSTWRITER │
          │ LOOP         │     │             │
          └──────────────┘◀────└─────────────┘
                 │      tells the ghostwriter
                 │      what to assemble per reader
                 ▼
          adaptive issue, per reader
```

**Why this is one product, not two:**

- **Re-segmentation** makes email engaging but creates demand the creator cannot meet alone (infinite variants).
- **Ghostwriter** makes that demand affordable by learning voice from archive and assembling modular blocks per reader.
- Both consume the **same fingerprint**. The loop creates personalization demand; the ghostwriter satisfies it.

**Cold-start honesty:** New subscribers have no behavioral history. The loop uses acquisition signals (signup trigger, channel, referring newsletter) plus a sensible default until ~5–10 issues of signal accrue. The first handful of sends are lightly informed, not fully adaptive.

---

## What is implemented in this repo (v1)

### Creator-facing UI

| Route | Purpose |
|-------|---------|
| `/` | Public landing page — product narrative, loop explanation, CTA |
| `/signup`, `/signin` | Authentication |
| `/dashboard` | Overview stats and v1 workflow guide |
| `/dashboard/newsletters` | Create and list newsletter workspaces |
| `/dashboard/newsletters/[id]` | **Core workflow** — Archive, Fingerprint, Ghostwriter tabs |

### Backend modules

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| `newsletters` | CRUD + archive management | Workspace and past-issue ingestion |
| `fingerprints` | GET + POST generate | Structured content understanding from archive |
| `ghostwriter` | List + create drafts | Voice-preserving draft generation from fingerprint |
| `auth` | Better Auth | Session-based email/password auth |
| `users` | Profile + admin | User management |

### Fingerprint engine (v1 implementation)

The fingerprint schema captures five dimensions defined in the PRD:

```typescript
{
  topics: [{ name, weight, subTopics }],
  voice: { tone, formality, sentenceRhythm, humor, signaturePhrases },
  audience: { profile, expertiseLevel, motivations },
  depthFormat: { typicalLength, technicalDepth, structure, avgWordsPerIssue, avgSentencesPerIssue },
  obsessions: [{ theme, frequency }],
  summary: string
}
```

**Current implementation:** A deterministic heuristic analyzer extracts term frequency, sentence metrics, and tone signals from pasted archive text. This makes the prototype **fully runnable without an LLM API key** while preserving the exact JSON schema that an LLM-backed production engine would populate.

**Production path:** Swap `FingerprintsService.buildFingerprintFromArchive()` for an LLM pipeline with structured output validation against the same schema. Both Ghostwriter and (future) Re-segmentation depend on schema stability, not on which engine fills it.

### Ghostwriter (v1 implementation)

Given a ready fingerprint + optional brief, Ghostwriter assembles a markdown draft scaffold:

- Title and creator brief
- Fingerprint summary woven into the opening
- Section placeholders styled to match inferred voice (tone, formality, rhythm)
- Explicit footer noting voice profile used

This demonstrates the **assembly pattern** v2 will use for per-reader variants — modular blocks selected and rendered per profile, not one monolithic AI blob.

---

## Roadmap (v2)

The database schema and architecture anticipate v2 without building it speculatively:

| Capability | Schema / hook | Not yet built |
|------------|---------------|---------------|
| ESP signal ingestion | `EspConnection` model, `espProvider` on `Newsletter` | Kit webhooks, click→topic mapping |
| Per-reader topic matrix | Custom fields written back to ESP | Signal aggregation service |
| Re-segmentation loop | Assembly instructions per reader | In-email taps, poll links, AMP fallback |
| Per-reader delivery | Segment-based broadcasts on Kit | Variant generation + ESP adapter |
| Disengagement detection | Negative signal taxonomy in PRD | Trend/derivative scoring on opens |

**Build sequence (from PRD):** v1 Ghostwriter ships first because it delivers standalone value, proves the fingerprint engine, and is the prerequisite that makes the loop affordable. v2 correctly depends on both Ghostwriter and ESP integration.

---

## Technical architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 (Frontend)                    │
│  App Router · React 19 · Tailwind 4 · Better Auth client    │
│  Landing · Dashboard · Newsletter workspace UI               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + cookies (credentials)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     NestJS 11 (Backend)                      │
│  REST API · Swagger · Better Auth · Validation pipes        │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ Newsletters │ │ Fingerprints │ │ Ghostwriter         │  │
│  └─────────────┘ └──────────────┘ └─────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL                               │
│  Users · Sessions · Newsletters · Archive · Fingerprints    │
│  · Drafts · ESP connections (v2-ready)                      │
└─────────────────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | App Router, SSR-ready, fast iteration |
| Backend | NestJS 11 | Modular domain architecture, Swagger, guards |
| Database | PostgreSQL + Prisma 6 | Relational model fits fingerprint + reader matrix |
| Auth | Better Auth | Session cookies, email/password, extensible |
| API | REST (+ tRPC scaffold on frontend for future) | Simple demo path; Swagger for reviewers |
| Email | Nodemailer (optional) | Verification + password reset |
| Storage | AWS S3 module (optional) | Future archive file imports |

---

## Data model

```
User
 └── Newsletter (workspace)
      ├── ArchiveIssue[]        ← pasted past issues
      ├── NewsletterFingerprint ← 1:1 structured JSON profile
      ├── GhostwriterDraft[]    ← generated drafts
      └── EspConnection?        ← v2: Kit/beehiiv/etc.
```

### Key enums

- `FingerprintStatus`: `PENDING` → `PROCESSING` → `READY` | `FAILED`
- `EspProvider`: `NONE`, `KIT`, `BEEHIIV`, `KLAVIYO`, `MAILCHIMP`
- `DraftStatus`: `DRAFT`, `REVIEW`, `APPROVED`

Every newsletter is created with an empty `NewsletterFingerprint` row in `PENDING` state, so the generate endpoint always has a target record.

---

## API reference

Base URL: `http://localhost:3001/api`  
Swagger UI: `http://localhost:3001/api/docs`  
Auth: session cookie (`better-auth.session_token`) — sign in via frontend or `POST /api/auth/sign-in/email`

### Newsletters

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/newsletters` | Create workspace `{ name, description?, espProvider? }` |
| `GET` | `/newsletters` | List current user's newsletters |
| `GET` | `/newsletters/:id` | Full detail with archive, fingerprint, drafts |
| `PATCH` | `/newsletters/:id` | Update metadata |
| `DELETE` | `/newsletters/:id` | Delete workspace and cascade |
| `POST` | `/newsletters/:id/archive` | Add issue `{ title, content, publishedAt?, sortOrder? }` |
| `DELETE` | `/newsletters/:id/archive/:issueId` | Remove archive issue |

### Fingerprints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/newsletters/:id/fingerprint` | Current fingerprint record |
| `POST` | `/newsletters/:id/fingerprint/generate` | Analyze archive → populate fingerprint JSON |

### Ghostwriter

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/newsletters/:id/drafts` | List drafts |
| `POST` | `/newsletters/:id/drafts` | Generate draft `{ title, outline?, brief? }` |
| `GET` | `/newsletters/:id/drafts/:draftId` | Single draft |

All authenticated responses are wrapped:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-02T12:00:00.000Z"
}
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** (local or hosted — Supabase, Neon, etc.)
- **npm**

### 1. Clone and install

```bash
git clone <repository-url>
cd looptilt

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/looptilt?schema=public"
BETTER_AUTH_SECRET="your-super-secret-key-minimum-32-characters"
BETTER_AUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
PORT=3001
API_PREFIX=api
REQUIRE_EMAIL_VERIFICATION=false
```

Run migrations and start:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Backend: `http://localhost:3001/api`  
Swagger: `http://localhost:3001/api/docs`

### 3. Frontend setup

```bash
cd frontend
```

Create `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

```bash
npm run dev
```

Frontend: `http://localhost:3000`

### 4. Docker (backend only)

```bash
cd backend
docker build -t looptilt-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="your-database-url" \
  -e BETTER_AUTH_SECRET="your-secret" \
  -e FRONTEND_URL="http://localhost:3000" \
  looptilt-backend
```

---

## Demo walkthrough

Use this flow when presenting the prototype:

1. **Landing (`/`)** — Walk through the problem/insight/loop narrative. Emphasize ESP-agnostic posture (does not send email).

2. **Sign up** — Create a creator account.

3. **Dashboard** — Note v1 workflow cards and empty stats.

4. **Create newsletter** — e.g. "The Growth Brief" with a one-line description.

5. **Archive tab** — Paste 2–3 realistic past issues (title + body). More issues → richer fingerprint.

6. **Generate fingerprint** — Click generate. Switch to Fingerprint tab. Walk through:
   - `topics` — weighted themes from term analysis
   - `voice` — tone, formality, rhythm
   - `audience` — inferred reader profile
   - `depthFormat` — word counts, typical length
   - `obsessions` — recurring anchor themes

7. **Ghostwriter tab** — Create a draft with a title and optional brief. Show the assembled markdown scaffold that references the fingerprint voice profile.

8. **Architecture callout** — Same fingerprint JSON will feed v2's per-reader assembly. Ghostwriter already demonstrates the modular assembly pattern.

### Sample archive text (for quick testing)

Paste any newsletter-style content — the engine needs substantive text (a few paragraphs per issue). Include varied vocabulary so topic extraction has signal.

---

## Design decisions & trade-offs

### 1. Heuristic fingerprint first, LLM second

**Decision:** Ship a deterministic analyzer that fills the production schema.  
**Why:** Reviewers can run the full demo without API keys or spend. The interface contract (JSON schema) is what downstream features depend on.  
**Trade-off:** Fingerprint quality is lower than a careful LLM read — acceptable for prototype; documented upgrade path.

### 2. REST over GraphQL for v1

**Decision:** NestJS REST controllers with Swagger.  
**Why:** Faster to demo, easier for interview reviewers to curl endpoints. tRPC scaffold exists on frontend for future end-to-end typing.  
**Trade-off:** No batch queries — fine at prototype scale.

### 3. Modular blocks in Ghostwriter output

**Decision:** Drafts are section scaffolds, not finished prose.  
**Why:** Matches PRD constraint that re-segmentation requires modular content the engine selects/orders — not invented-from-scratch per-person content.  
**Trade-off:** Creator still edits — but editing a scaffold is cheaper than writing from zero.

### 4. ESP connection schema without integration

**Decision:** `EspConnection` model + `EspProvider` enum exist; no Kit API calls yet.  
**Why:** v1 delivers value without migration friction. Schema documents v2 intent without speculative webhook code.  
**Trade-off:** Signal taxonomy (Section 6 of PRD) is designed but not wired.

### 5. Segment-based delivery as default ESP path

**Decision:** Document Kit segment broadcasts as primary delivery mechanism.  
**Why:** Honest about Kit's thinner in-broadcast conditional content vs Klaviyo. Degrades gracefully: conditional content → segments → link-out.  
**Trade-off:** Coarser than true per-subscriber HTML at send time — acceptable for newsletter ESP reality.

### 6. Signal weighting philosophy (designed, v2)

From the PRD — encoded in architecture docs for v2:

1. **Weight by clarity** — explicit "less of this" beats ambiguous skips
2. **Track deltas** — declining open *rate* beats absolute level for churn prediction
3. **Degrade gracefully** — useful with passive signals alone; sharper with explicit interaction

---

## ESP integration strategy

LoopTilt does not send email. It sits on top of the ESP the creator already uses.

Three integration jobs (ESPs vary most on Job 3):

| Job | Description | Kit support |
|-----|-------------|-------------|
| **1. Read signals out** | Opens, clicks (per-link URL → topic), lifecycle events | Webhooks: link-clicked, tag-added |
| **2. Write profile back** | Per-reader topic matrix + disengagement flag as custom fields/tags | API: subscribers, custom fields, tags |
| **3. Deliver adaptive content** | Per-reader variant via segments or conditional content | Segment-filtered broadcasts (primary path on Kit) |

**Lead integration:** Kit (ConvertKit) — strategically aligned with SparkLoop, solid API for all three jobs with honest segment-based delivery.

**Adapter pattern:** Fingerprint engine and per-reader matrix are ESP-agnostic. Only thin adapters at read/write/delivery edges change per platform.

---

## Project structure

```
looptilt/
├── looptilt-prd.md              # Full product requirements document
├── README.md                    # This file
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Domain + auth models
│   │   └── migrations/
│   └── src/
│       ├── modules/
│       │   ├── newsletters/     # Workspace + archive CRUD
│       │   ├── fingerprints/    # Fingerprint generation
│       │   ├── ghostwriter/     # Draft generation
│       │   ├── auth/            # Better Auth
│       │   ├── users/
│       │   └── health/
│       ├── common/              # Database, email, guards, interceptors
│       └── config/
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                           # Landing
        │   ├── (auth)/                            # Sign in / sign up
        │   └── (protected)/dashboard/             # Creator workspace
        │       ├── page.tsx                       # Overview
        │       └── newsletters/
        │           ├── page.tsx                   # List + create
        │           └── [id]/page.tsx              # Archive / Fingerprint / Ghostwriter
        └── lib/
            ├── looptilt-api.ts                    # Typed API client
            └── types/looptilt.ts                  # Shared frontend types
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | No | `http://localhost:3001` | Auth base URL |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `NODE_ENV` | No | `development` | Environment |
| `PORT` | No | `3001` | Server port |
| `API_PREFIX` | No | `api` | Route prefix |
| `REQUIRE_EMAIL_VERIFICATION` | No | `false` | Email verification gate |
| `SMTP_*` | No | — | Email delivery (optional) |
| `AWS_*` | No | — | S3 storage (optional) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | No | `http://localhost:3001` | Backend API URL |

---

## Deployment notes

### Backend production checklist

1. Set `NODE_ENV=production`
2. Strong `BETTER_AUTH_SECRET`
3. Production `DATABASE_URL`
4. `REQUIRE_EMAIL_VERIFICATION=true` + SMTP configured
5. `npm run prisma:migrate:prod`
6. `npm run build && npm run start:prod`

### Frontend production checklist

1. `NEXT_PUBLIC_BACKEND_URL` → production API URL
2. `npm run build`
3. Deploy to Vercel or `npm run start`

---

## Why this fits a newsletter-growth company

LoopTilt attacks the two numbers that decide whether a newsletter business survives: **engagement** and **churn**. It does so without asking the creator to write more — the ghostwriter absorbs the extra production personalization requires.

It is not a footer feature. It is a **platform primitive** (content understanding) the stack is missing — and it sits on top of existing ESPs rather than replacing them.

For SparkLoop specifically: Kit integration as first ESP target, recommendation/acquisition signals as cold-start inputs, and growth metrics (opens, churn slope) as first-class signal citizens in the taxonomy.

---

## Scripts reference

### Backend

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate:prod` | Deploy migrations (prod) |
| `npm run prisma:studio` | Visual DB browser |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |

---

## License

MIT

---

## Contact

Built by **Tayo Sadique** as a product + engineering prototype for the Newsletter Fingerprint Engine concept. Full product specification: [`looptilt-prd.md`](./looptilt-prd.md).
