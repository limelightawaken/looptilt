# PRD: LoopTilt — Newsletter personalization for Kit

**A micro-SaaS that reads what a newsletter actually says, and turns that understanding into engagement, retention, and effortless output.**

Author: Tayo Sadique
Status: Draft v1
Last updated: June 2026

---

## 0. Positioning and naming

**Creator-facing category:** *Newsletter personalization for Kit (ConvertKit).* Use this in marketing copy, SEO (e.g. "newsletter personalization," "ConvertKit segments," "personalized newsletter"), and any surface a subscriber or creator sees first.

**Technical mechanism:** *Newsletter fingerprint* (and per-subscriber *reader fingerprints*). These terms describe the structured understanding layer inside the product, not the product category. The fingerprint is the shared engine; re-segmentation and ghostwriter are what it unlocks.

Do not lead with "fingerprint engine" in customer-facing UI. Lead with outcomes (personalized sends, adaptive segments, drafts in your voice). Explain fingerprints when describing differentiation vs generic AI drafting tools.

---

## 1. One-line summary

Most AI in the newsletter world points at the *drafting* problem ("write me an issue"). This product points at the *understanding* problem. It builds a structured fingerprint of what a newsletter is actually about, in topic, voice, audience, and depth, and uses that single understanding to power two features that feed each other: an adaptive re-segmentation loop that learns each reader, and a voice-preserving ghostwriter that makes acting on what it learns affordable.

The engine is built once. The two features are what it unlocks.

---

## 2. The problem

A newsletter creator with a real list faces two problems at once, and today solves each with a different mediocre tool.

**They write for an average reader who does not exist.** Everyone on the list gets the same issue, a compromise between the reader who wants depth and the reader who wants the quick take. The edges disengage and quietly churn.

**They cannot scale personalization.** The obvious fix, write different versions for different segments, costs more time than any solo creator or small team has. So nobody does it.

These look like two problems. They are one problem wearing two coats: **nothing in the stack actually understands the content.** Drafting tools generate words. Analytics count opens and clicks. Nobody reads the newsletter the way a sharp human editor would and turns that reading into per-reader action.

---

## 3. The core insight

If you build one thing that genuinely understands a newsletter's content, you can solve both at once, and the solutions reinforce each other.

That one thing is the **newsletter fingerprint**: a structured representation of a newsletter built by an AI that reads its archive. Topics and sub-topics. Voice and tone. Audience profile. Typical depth and format. Recurring obsessions. The things a good editor would notice on a careful read.

It has a per-subscriber counterpart. Once the engine understands the newsletter, it can score every reader against that same understanding to produce a **reader fingerprint**: a living per-person profile of topic affinities, depth and tone preference, lifecycle stage, and churn propensity (Section 6B). The newsletter fingerprint says what the publication is; the reader fingerprint says what each reader is to it. The reader fingerprint is what decides a reader's segment, and segments are what the loop sends to.

Build that, and two features fall out of it, paired so that each one removes a blocker the other would otherwise hit.

---

## 4. The loop (why this is one product, not two)

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
                 │      what to assemble per segment
                 ▼
          adaptive issue, per segment
```

The dependency, in plain words:

**Re-segmentation makes the email engaging, but it produces demand the creator cannot meet alone.** Each signal sharpens a reader's fingerprint and may move them into a different segment, so the next issue's angle should shift toward each segment. The problem: if every segment wants a slightly different issue, someone has to produce all those variants.

**Ghostwriter makes that demand affordable.** Personalizing per segment would normally mean writing a fresh draft for each one, which no creator can do at cadence. The ghostwriter learns the creator's voice from the archive, so the creator writes once (a menu of blocks) and the engine assembles and renders the per-segment variants *in the creator's own voice*. Without this, the loop generates a workload nobody can fulfil.

So the loop *creates* the personalization demand and the ghostwriter *satisfies* it, both drawing on the same newsletter fingerprint. Two features, one engine, mutually enabling.

**Cold-start (no matchmaker).** A brand-new subscriber has no behavioral signal yet. Rather than guess, the loop leans on acquisition signals (Section 6.1), which issue or topic they signed up from, which channel, which campaign, plus a sensible default issue, and starts genuinely personalizing once roughly 5 to 10 issues of signal accrue. The honest version: the first handful of issues are lightly informed, not adaptive, and the product earns its keep from there.

---

## 5. The two features

### 5.1 Re-segmentation loop (engagement + retention)

**What it does.** A small interaction sits inside each issue (a tap-to-rate, a "more of this / less of that," a one-question poll). Each tap is a behavioral signal. The engine reads that tap plus the reader's history, updates the reader's fingerprint (Section 6B), and re-files them into the segment that now fits them. It then reshapes the *next* send's angle per segment: which block leads, what depth, what tone, what gets cut.

**Why it is novel.** Almost all AI-and-newsletter effort points at drafting. This points at the *feedback loop*. The AI is not the writer; it is the learner and router. It watches behavior and adapts delivery. Over weeks, two readers who land in different segments are effectively reading different newsletters, each shaped toward them.

**Inputs.** The full reader signal surface (see Section 6, the signal taxonomy) + (at cold-start) acquisition signals.

**Outputs.** An evolving reader fingerprint per subscriber and the segment it places them in (Section 6B), and a per-segment assembly instruction for the next issue.

**Role in the loop.** Generates the signal that makes the product get smarter the longer someone reads, and creates the per-segment personalization demand the ghostwriter fulfils.

**Honest constraint.** Reshaping per segment requires *modular* content. The creator writes a menu of blocks; the engine selects and orders them per segment. It does not invent content per person from nothing. This is also what keeps the ghostwriter's job tractable, and it is why the product sends to a bounded set of segments rather than to individuals.

### 5.2 Ghostwriter (affordable output)

**What it does.** Learns a newsletter's voice from its archive (paste or import past issues), then drafts new content, and the per-segment variants the loop needs, in that voice.

**Why it is novel relative to generic AI writers.** The angle is voice-cloning-from-archive, not generic generation. It is not "write me a newsletter about X." It is "write the next issue the way *this* newsletter writes," learned from real sends.

**Inputs.** Newsletter fingerprint (voice component) + the creator's outline or block menu.

**Outputs.** Drafts and per-segment variants that preserve the creator's voice.

**Role in the loop.** Eliminates the infinite-drafts problem, turning the loop's per-segment demand into output the creator never has to hand-write.

---

## 6. The signal taxonomy (what the loop actually learns from)

The re-segmentation loop is only as good as the signals feeding it. "In-email taps" is not one input; it is the tip of a much larger surface. This section catalogs the full set.

The organizing principle: **signals trade off cost against clarity.** Cheap signals (an open) are abundant but ambiguous, a single open tells you almost nothing. Expensive signals (a deliberate "show me more of this") are rare but unambiguous. A good loop collects everything, weights by clarity, and degrades gracefully when only cheap signals exist. And it tracks *trends*, not just levels: a reader whose technical-topic engagement is climbing matters more than one sitting flat, even if the flat reader's absolute rate is higher.

### 6.1 Acquisition signals (the origin story)

Available before the reader ever opens an issue. These warm-start the loop so a new subscriber is not a blank slate.

- **Signup trigger**: did they join off a specific issue or topic? If they subscribed right after a deep-dive on topic X, X is their opening bet.
- **Acquisition channel**: referral, Upscribe recommendation, social, organic, paid. Channel correlates with intent and quality.
- **Referring newsletter** (if via recommendation): *which* newsletter sent them. This is a strong taste signal, the source newsletter's subject matter is a clue to what this reader already likes, usable as a starting bet before they engage with anything.
- **Signup context**: landing page, lead magnet, or campaign they came through.

### 6.2 Passive engagement signals (cheap, abundant, ambiguous)

Collected automatically every send. Individually weak, powerful in aggregate and over time.

- **Open / skip** per issue.
- **Open latency**: opened within minutes vs days later (immediacy signals priority).
- **Read-depth proxies**: scroll depth, time-in-email, whether they reached lower blocks.
- **Time-of-day and device**: when and how they read (informs send timing, a delivery lever).
- **Open streak and decay**: consecutive opens, or a cooling trend that flags disengagement early.

### 6.3 Click signals (medium cost, clearer intent)

A click is a deliberate act, and *where* the click lands carries topic information.

- **Which links** they clicked.
- **Link position**: a click low in the issue means they read that far, a free read-depth signal.
- **Topic of the clicked link**: map every link to a fingerprint topic so clicks aggregate into topic-level interest.
- **Link type**: content link vs product/offer vs recommendation. Different intents.
- **Click recency and frequency** per topic.

### 6.4 Explicit interaction signals (high cost, high clarity)

The deliberate, in-email actions. Rare but the most trustworthy.

- **Poll / quiz answers**: direct statements of preference or state.
- **Tap-to-rate**: per-issue or per-section rating.
- **"More of this / less of that" controls**: the reader explicitly steering their own feed. Highest-clarity signal in the system, and the one that keeps the experience feeling like steering rather than surveillance.
- **Recommendation taps**: did they take an in-email recommendation, and which one (another taste signal about adjacent interests).
- **Reply behavior**: did they reply, and on which topic. A reply is the strongest engagement act a reader can take.

### 6.5 Topic-level aggregation (the real engine input)

The signals above are raw inputs. What the loop actually reasons over is their aggregation *per fingerprint topic*, per reader:

- **Per-topic open rate**: do they open issues that lead with this topic?
- **Per-topic click rate**: do they click into this topic when present?
- **Per-topic explicit-preference score**: net of polls, ratings, and more/less controls.
- **Per-topic trend**: is engagement with this topic rising or falling over recent issues?

This per-topic, per-reader matrix is the thing the loop uses to decide next-issue assembly. Everything else feeds it. In practice it takes roughly 5 to 10 issues of signal before the matrix is dense enough to drive confident decisions, and it keeps sharpening after that. Before that threshold the loop leans on acquisition signal (Section 6.1) and a sensible default rather than guessing.

### 6.6 Negative and lifecycle signals (often ignored, highly informative)

Disengagement is as informative as engagement, and catching it early is where churn gets prevented.

- **Consistent topic skipping**: a topic they reliably ignore is a candidate to cut for them.
- **Disengagement trajectory**: falling opens, lengthening latency, shrinking read depth. This is the early-warning system, and it is the loop's highest-priority negative signal. What matters is the *rate of decline*, not the current level: a decelerating reader is a leaving reader, and the steeper the deceleration the more urgent the intervention. Catch the slope, not the floor.
- **Unsubscribe / spam risk proxies**: behavior patterns that precede opt-out, so the loop can intervene (lighter cadence, different lead) before they leave.
- **Dormancy and reactivation**: going quiet, then re-opening on a *specific* topic, that reactivation topic is gold, it is literally the thing that brought them back.
- **Forwards and shares**: which issues or topics they found worth passing on (also a growth signal).

### 6.7 How signals combine

Three rules govern how the loop uses the surface:

1. **Weight by clarity.** An explicit "less of this" outweighs a hundred ambiguous skips. Passive signals inform; explicit signals decide.
2. **Track deltas, not just levels, and treat downtrends as the strongest predictor in the system.** Direction of travel beats absolute value. Rising engagement with a topic is a stronger instruction than a flat high baseline. More importantly, a *declining rate* is the single best early-warning signal the loop has: a reader at 40% opens who has gone 70 → 60 → 50 → 40 is in freefall and about to churn, while a reader steady at 40% forever is simply a stable 40% reader and no risk at all. Same current level, opposite futures. The loop reads the derivative. And deceleration precedes the stop: by the time a reader has fully gone quiet they are usually already lost, so the loop watches for the *slowing* (opens getting less frequent, latency lengthening, read-depth shrinking) and intervenes while there is still time, not after the reader has flatlined.
3. **Degrade gracefully.** Most readers will only ever produce passive signals. The loop must do something useful with opens and clicks alone, and get sharper as richer signals arrive, never requiring explicit interaction to function.

---

## 6B. The reader fingerprint and segments

The signal taxonomy is raw material. This section is what the loop builds out of it: a per-subscriber fingerprint, and the segments that fingerprint sorts readers into. Crucially, **sends are per-segment, not per-person.** The fingerprint is computed for every individual, but delivery targets segments, which is what every ESP can actually do (Section 7B) and what keeps the creator's and ghostwriter's variant count bounded.

### 6B.1 The reader fingerprint (per subscriber)

Where the newsletter fingerprint (Section 7) captures what the *publication* is, the **reader fingerprint** captures what each *subscriber* is to that publication. It is the per-person rollup of the entire signal surface in Section 6, scored against the newsletter's own topics, so it is always expressed in the publication's native vocabulary rather than generic demographics.

Each reader fingerprint holds:

- **Topic affinities**: the per-topic interest scores and trends from 6.5, the spine of the fingerprint.
- **Depth and tone preference**: inferred from read-depth and click behavior, quick-take vs deep-dive, which formats they actually finish.
- **Lifecycle stage**: new / warming / engaged / cooling / dormant / reactivated, derived from the engagement trajectory in 6.6.
- **Churn propensity**: a single forward-looking risk score driven primarily by the *slope* of engagement (the derivative rule in 6.7), not its current level, so a high-but-falling reader scores riskier than a low-but-stable one.
- **Segment membership**: which segment(s) the reader currently falls into (below).

The fingerprint is recomputed every send as new signals land, so it is a living profile, not a one-time label. It is the artifact written back to the ESP as custom fields and tags (Section 7B, Job 2), and it is the thing every segment is defined over.

### 6B.2 Default segments (zero setup)

A set of segments ships out of the box, derived directly from the reader fingerprint so they work before a creator configures anything:

- **By lifecycle**: New, Engaged, Cooling (churn-risk), Dormant, Reactivated.
- **By depth preference**: Skimmers vs Deep readers.
- **By top affinity**: one segment per dominant fingerprint topic, so the list auto-organizes around what the newsletter actually covers.

These cover the common cases with no configuration, the Cooling / churn-risk segment in particular being the retention workhorse the loop intervenes on first.

### 6B.3 AI-built custom segments

Beyond the defaults, creators build their own segments **by description, not by query-builder**. The creator writes what they want in plain language, e.g. "readers who used to open everything but have cooled off in the last month and lean technical," and the AI:

1. **Builds the rule.** It translates the description into concrete conditions over the available signals and fingerprint fields, topic affinities, trends, lifecycle stage, churn propensity, depth preference, and acquisition source.
2. **Shows the rule back.** It presents the exact conditions and thresholds it chose in an editable form, plus a live estimate of how many subscribers match, so the creator can adjust any threshold or condition before saving.
3. **Explains its rationale.** In plain language it states why it picked those signals, what each threshold is doing, and which signals it deliberately left out and why, so the creator trusts and understands the segment rather than receiving an opaque rule.

The creator stays in control: the AI proposes, the creator inspects, adjusts, and approves. Saved custom segments become first-class alongside the defaults, carry a fingerprint-derived definition that re-evaluates every send, and write back to the ESP as tags for segment-based delivery.

---

## 7. The shared engine: the fingerprint

Everything above is a consumer of one artifact. The fingerprint is a structured profile produced by an AI reading a newsletter's archive. Conceptually it captures:

- **Topics**: primary themes and recurring sub-topics, weighted by frequency and emphasis.
- **Voice**: tone, sentence rhythm, formality, humor, signature phrases.
- **Audience**: who this is written for, inferred from content and framing.
- **Depth and format**: how technical, how long, how it structures an issue.
- **Obsessions**: the things this newsletter returns to that define its identity.

Build this once, well, and everything downstream consumes it: each subscriber is scored against the topic slice to produce their reader fingerprint and segment (Section 6B), while the ghostwriter generates from the voice slice of the same one.

---

## 7B. Integrating with existing ESPs

This product does not send email. It sits on top of the ESP the creator already uses, the same posture SparkLoop itself takes. That keeps adoption friction near zero (no migration) and means the real engineering question is: what can each ESP actually let us read and write?

Integration has three distinct jobs. ESPs vary most on the third.

**Job 1, read signals out.** Pull opens, clicks (ideally per-link, which we map to fingerprint topics), and lifecycle events into our engine. Mechanism: ESP webhooks, or polling an events API. This is the best-supported job across the board.

**Job 2, write the reader fingerprint back.** Our engine computes each subscriber's reader fingerprint (the per-topic affinity matrix, lifecycle stage, churn propensity, and segment membership; Section 6B). Those need to live where the ESP can act on them, as custom fields and tags on the subscriber record. Well-supported by the major ESPs.

**Job 3, get adaptive content in.** Deliver the per-segment variant via a single segment-based mechanism:
- *Segment-based sends*: split the list into tag-defined segments (the defaults and AI-built segments from Section 6B) and send each the matching variant (works on almost every ESP, the deliberate delivery model rather than a fallback for true per-person).

### Lead integration: Kit (ConvertKit)

Kit is the first target. It owns SparkLoop, so it is the strategically aligned platform, and its developer surface supports the jobs we need:

- **Signals out**: Kit's webhooks fire on subscriber events, and notably there is a link-clicked trigger that passes the clicked URL, which is exactly what we need to map clicks to topics. Tag-added and tag-removed events fire too.
- **Profile back**: custom fields and tags are first-class and writable via the API (subscribers, forms, broadcasts, all reachable; JSON; API-key auth). We write the topic matrix as custom fields and the disengagement state as a tag.
- **Delivery**: Kit can target broadcasts by subscriber filters on tags and custom fields. So the realistic delivery path on Kit is *segment-based sends* (a broadcast per variant, each filtered to the matching tag), with link-out as the richer-experience fallback. Kit's per-subscriber conditional content inside a single broadcast is thinner than Klaviyo's, so we lead with segments, not in-broadcast liquid. Being honest about this is better than pretending Kit does something it does not.

### How the others compare

- **beehiiv**: large creator base, solid API and webhooks, custom fields and segments. Delivery via segment-based sends; conditional content is limited. Strong second target.
- **Klaviyo**: best-in-class conditional content (liquid) and rich events, so it is the one ESP where true per-reader variants inside one send are realistic. Best technical fit for Job 3, less central to the newsletter-creator audience.
- **Mailchimp**: mature merge-tag conditional content and a broad API. Capable on all three jobs, less loved by serious newsletter operators.

### Integration principle

Read signals wherever the ESP allows it, write the profile back as fields and tags, and deliver through the richest mechanism that ESP supports, degrading from native conditional content to segment sends to link-out. The newsletter fingerprint layer and the per-reader matrix are ESP-agnostic; only the thin adapter at each end changes per platform.

---

## 8. Build sequence (what ships first)

The honest sequencing for a small team, given the dependency between the two features.

**v1: Ghostwriter.** It works with nothing but an archive, no signals, no delivery infrastructure, no per-recipient sends. The creator pastes or imports past issues, the engine learns the voice, and it drafts in that voice immediately. It delivers value on day one, proves the newsletter fingerprint, and is the piece every creator wants regardless of the loop. Critically, it is also the prerequisite that makes the loop affordable, so it has to exist first anyway.

**v2: Re-segmentation loop.** Once voice-preserving generation exists, the loop becomes buildable and affordable. This is the harder piece: it needs signal capture from the ESP (Section 7B), the reader fingerprint and segmentation layer (Section 6B), and per-segment delivery. It is sequenced second because it depends on the ghostwriter to fulfil the personalization demand it creates, and on ESP integration to both read signals and deliver variants.

This sequencing is deliberate: v1 ships standalone value *and* builds the exact capability v2 needs to be viable. Nothing is built speculatively.

---

## 9. Delivery and technical notes

**In-email interaction.** True in-inbox inputs require AMP for Email (renders in Gmail, Yahoo, Apple Mail) with a static fallback elsewhere. For discrete single-tap signals (rate, pick-one), pre-encoded links work everywhere with no AMP and no sender registration. The realistic build is layered: AMP where supported, pre-encoded links as the universal fallback, hosted micro-app for anything richer.

**AI layer.** The newsletter fingerprint, the reader fingerprint and segmentation, the voice generation, and the per-segment assembly are all LLM jobs. The engineering challenge is not the model calls; it is the structured fingerprint schema and keeping it stable enough that both features can rely on it.

**Per-segment delivery (v2).** Generate one variant per segment (Section 6B) and send each segment its variant through the ESP's native segmentation, a broadcast per variant filtered to the matching tag. This is the heaviest infrastructure piece and is correctly deferred to v2. See Section 7B for how this maps onto real ESPs.

---

## 10. Why this fits a newsletter-growth company

The product attacks the two numbers that decide whether a newsletter business survives: engagement and churn. It does so without asking the creator to write more, the ghostwriter absorbs the extra production the personalization requires. It is not a feature bolted onto a footer. It is a platform primitive (content understanding) that the whole stack is currently missing, and it sits on top of existing ESPs rather than trying to replace them. A growth company would want this on its roadmap.

---

## 11. Open questions

- How much archive is enough to produce a reliable fingerprint, and how does fingerprint quality degrade with less input?
- How faithfully can the ghostwriter hold a distinctive voice across many per-segment variants before drift becomes noticeable to the creator?
- Where is the creepiness line on "the newsletter learns you," and how do we keep it feeling like the reader is *steering* rather than being watched?
- What is the minimum modular-content structure a creator will actually maintain for the loop to function?
- The loop starts producing useful decisions after roughly 5 to 10 issues of passive signal and sharpens from there. What is the precise break-even point where its decisions beat sending everyone the default, and how does that shift with list type and cadence?
- Which negative signals most reliably predict churn early enough to act on, and what is the right intervention when one fires?