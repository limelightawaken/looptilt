# Kit (ConvertKit) API Integration

**For the re-segmentation loop. How we read signals from Kit, write the per-reader profile back, and deliver adaptive issues.**

Last updated: June 2026
API version: **v4** (base URL `https://api.kit.com/v4/`)

> **Verification status.** Every endpoint, field, enum, and constraint in this document has been checked against Kit's live v4 reference (`developers.kit.com`) and the published OpenAPI spec. Items confirmed verbatim are marked **[verified]**. A handful of behaviours that materially affect the build are called out in **[gotcha]** notes. The broadcast request/response shape is reproduced from Kit's OpenAPI spec and is authoritative.

---

## 0. Read this first

This document maps Kit's v4 API onto the three integration jobs the loop needs:

1. **Read signals out** of Kit (clicks, lifecycle events) into our engine.
2. **Write the reader profile back** to Kit (the per-topic summary and disengagement state) as custom fields and tags.
3. **Deliver adaptive content** through Kit broadcasts targeted by tag or segment.

Two things to know before building:

- **Use v4, not v3.** [verified] V3 (`api.convertkit.com/v3/`) is no longer in active development and Kit reserves the right to deprecate it. V3 and V4 keys are not interchangeable; create a v4 key in Kit's Developer settings. V4 adds full-HTML broadcasts with segment/tag targeting, cursor pagination, and consistent error handling.
- **Base URL is `https://api.kit.com/v4/`.** [verified] Note: some older client code still posts to `https://api.convertkit.com/v4/`; the current canonical host is `api.kit.com`.

---

## 1. Authentication [verified]

Two methods, both shown in the spec's `securitySchemes`:

- **API Key** via header `X-Kit-Api-Key: <api-key>`. Used for nearly everything the loop does.
- **OAuth 2.0** (authorization code flow) for bulk endpoints and purchase creation. Scopes are `read` and `write`. Token URLs:
  - authorize: `https://api.kit.com/v4/oauth/authorize`
  - token / refresh: `https://api.kit.com/v4/oauth/token`

```
curl --request GET \
  --url https://api.kit.com/v4/webhooks \
  --header 'X-Kit-Api-Key: <api-key>'
```

Keep the key server-side only (NestJS env). The free-tool frontend never holds Kit credentials; it talks to our backend, and only the backend talks to Kit.

---

## 2. Rate limits, pagination, errors

- **Rate limit**: 120 requests per rolling 60-second window per key; 429 on exceed. Use exponential backoff; batch and space profile write-backs. (Inbound webhooks do not count against this.)
- **Pagination** [verified]: cursor-based. `?after=<end_cursor>` for next page, `?before=<start_cursor>` for previous. `per_page` default 500, max 1000. `include_total_count=true` for a count (slower). Response carries a `pagination` object: `has_previous_page`, `has_next_page`, `start_cursor`, `end_cursor`, `per_page`.
- **Error codes** [verified]: `401` (auth failed), `403` (insufficient permissions), `404` (id not found), `422` (invalid params or campaign already sending). Error responses use `{ "errors": ["message", ...] }`.

---

## 3. Job 1: Read signals out (webhooks) [verified]

Kit POSTs a JSON payload to our endpoint when a subscriber event fires. We register one webhook per event type at our NestJS ingestion endpoint.

### Endpoints [verified]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v4/webhooks` | List registered webhooks |
| POST | `/v4/webhooks` | Create a webhook |
| DELETE | `/v4/webhooks/{id}` | Delete a webhook by id |

### Create a webhook (exact shape) [verified]

```
curl --request POST \
  --url https://api.kit.com/v4/webhooks \
  --header 'Content-Type: application/json' \
  --header 'X-Kit-Api-Key: <api-key>' \
  --data '{
    "target_url": "https://api.ourservice.com/webhooks/kit",
    "event": {
      "name": "subscriber.link_click",
      "form_id": null,
      "tag_id": null,
      "sequence_id": null,
      "product_id": null,
      "initiator_value": "https://newsletter.example.com/issue-42/deep-dive",
      "custom_field_id": null
    }
  }'
```

Response (201) [verified]:

```json
{
  "webhook": {
    "id": 9,
    "account_id": 1539,
    "event": { "name": "link_click", "initiator_value": null },
    "target_url": "https://api.ourservice.com/webhooks/kit"
  }
}
```

**[gotcha]** The `event` object in the request accepts the full set of optional parameter keys (`form_id`, `tag_id`, `sequence_id`, `product_id`, `initiator_value`, `custom_field_id`); set the ones the event requires and leave the rest `null`. Note the response normalizes `event.name` (e.g. request `subscriber.subscriber_activate` returns as `subscriber_activate`).

### Available event types and required params [verified]

| Event name | Required param | Loop usage |
|------------|----------------|------------|
| `subscriber.subscriber_activate` | none | New active subscriber; start a reader profile |
| `subscriber.subscriber_unsubscribe` | none | Churn (terminal); stop the loop, log outcome |
| `subscriber.subscriber_bounce` | none | Deliverability negative signal |
| `subscriber.subscriber_complain` | none | Strong negative signal (spam complaint) |
| `subscriber.form_subscribe` | `form_id` (Integer) | Acquisition: which form/source |
| `subscriber.course_subscribe` | `sequence_id` (Integer) | Sequence enrollment context |
| `subscriber.course_complete` | `sequence_id` (Integer) | Sequence completion |
| **`subscriber.link_click`** | `initiator_value` (String URL) | **Core click signal**; URL maps the click to a topic |
| `subscriber.product_purchase` | `product_id` (Integer) | Monetization signal |
| `subscriber.tag_add` | `tag_id` (Integer) | Reacting to tags (incl. our own + explicit-pref tags) |
| `subscriber.tag_remove` | `tag_id` (Integer) | Tag removed |
| `purchase.purchase_create` | none | Purchase created |
| `custom_field.field_created` | none | Field definition created |
| `custom_field.field_deleted` | none | Field definition deleted |
| `custom_field.field_value_updated` | `custom_field_id` (Integer) | Field value changed (if explicit prefs stored as fields) |

### Subscriber event payload [verified]

```json
{
  "subscriber": {
    "id": 1,
    "first_name": "John",
    "email_address": "John@example.com",
    "state": "active",
    "created_at": "2018-02-15T19:40:24.913Z",
    "fields": { "My Custom Field": "Value" }
  }
}
```

### The important one: `subscriber.link_click`

This is what makes click-to-topic mapping possible. The event carries `initiator_value` (the clicked URL). Strategy:

- **Encode a topic id into every link** before send (e.g. `?lt=<topicId>`, or a per-topic path segment). On click, parse the URL, extract the topic id, attribute the click to that fingerprint topic for that reader.
- **Encode link position** the same way (`&pos=lower`) to get a read-depth proxy.

Without per-link topic encoding, clicks are just URLs. With it, every click becomes a typed signal feeding the per-topic matrix.

### [gotcha] There is no per-subscriber "open" webhook

The verified event list above has **no open event**. Open data lives in stats, not webhooks. To get open/skip and open-latency you must either:

- pull per-subscriber stats from **`GET /v4/subscribers/{id}/stats`** (List stats for a subscriber) [verified: endpoint exists], or
- pull per-broadcast aggregates from the **broadcast stats** endpoint [verified: stats exists on broadcasts], or
- instrument your own tracking pixel in the send template.

Design implication: on Kit the reliable per-reader signals are **clicks (topic-encoded)**, **lifecycle events**, and **tag/field changes**. Opens are coarser. The loop's "degrade gracefully" rule carries the weight here.

### Webhook ingestion (our side)

- Respond `2xx` fast, process async (queue the raw event, ack immediately, compute later). Senders retry on non-2xx.
- Store raw events append-only, keyed by subscriber. The matrix is computed from the stream, never mutated in place.
- Verify the request is genuinely from Kit before trusting it (confirm Kit's current signing/verification mechanism in the docs).

---

## 4. Job 2: Write the reader profile back

### 4a. Custom fields [verified]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v4/custom_fields` | List field definitions (get keys) |
| POST | `/v4/custom_fields` | Create a field definition |
| PUT | `/v4/custom_fields/{id}` | Update a field definition |
| DELETE | `/v4/custom_fields/{id}` | Delete a field definition |

**[gotcha] Custom fields are account-level definitions, not per-subscriber columns.** You create the field once for the whole account, then set its value per subscriber via the subscriber endpoints. A field you create appears on every subscriber.

**[gotcha] 140-field hard cap.** [verified] Each account is limited to 140 custom fields; exceeding it errors. Do NOT create a field per micro-topic. Keep a bounded, curated set; the full matrix lives in our Postgres, only an actionable summary is mirrored to Kit.

### 4b. Setting field values on a subscriber [verified]

Values are set through **Create a subscriber** (`POST /v4/subscribers`, upsert) or **Update a subscriber** (`PUT /v4/subscribers/{id}`), via a `fields` object.

```
curl --request POST \
  --url https://api.kit.com/v4/subscribers \
  --header 'Content-Type: application/json' \
  --header 'X-Kit-Api-Key: <api-key>' \
  --data '{
    "first_name": "Alice",
    "email_address": "alice@convertkit.dev",
    "state": "active",
    "fields": {
      "Lead Score": "87",
      "Interests": "Monetization"
    }
  }'
```

`state` enum [verified]: `active`, `bounced`, `cancelled`, `complained`, `inactive` (defaults to `active`).

**[gotcha] `POST /v4/subscribers` is an upsert with three sharp edges** [verified]:
1. **It silently ignores unknown custom fields.** If the field key does not already exist on the account, Kit accepts the request and drops the value with no error. Always create fields first (4a), then set values.
2. **It cannot change `state`.** The docs explicitly state updating subscriber state via this endpoint is not supported. Use the dedicated unsubscribe endpoint for state transitions.
3. Max 140 custom fields created/updated per call.

**[gotcha] `fields` key naming is inconsistent in Kit's own docs.** One reference example keys `fields` by label ("Last name"); another keys by snake_case key ("last_name") and says passing an unknown key returns 422. Treat this as: **call `GET /v4/custom_fields` first, use exactly the key strings it returns**, and verify against a live test account before relying on either form. Do not hardcode guessed keys.

### 4c. Tags [verified]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v4/tags` | List tags |
| POST | `/v4/tags` | Create a tag |
| POST | `/v4/tags/{tag_id}/subscribers/{id}` | **Tag a subscriber** (by subscriber id) |
| DELETE | `/v4/tags/{tag_id}/subscribers/{id}` | Remove a tag from a subscriber |
| GET | `/v4/tags/{tag_id}/subscribers` | List subscribers with a tag |
| GET | `/v4/subscribers/{id}/tags` | List tags for a subscriber |

Tag a subscriber [verified] (empty JSON body; ids are path params):

```
curl --request POST \
  --url https://api.kit.com/v4/tags/{tag_id}/subscribers/{id} \
  --header 'Content-Type: application/json' \
  --header 'X-Kit-Api-Key: <api-key>' \
  --data '{}'
```

Response [verified] returns the subscriber with a `tagged_at` timestamp. **[gotcha]** The subscriber must already exist before tagging (create them first). There is no limit on tags per subscriber.

### What we write (and why tags carry delivery)

- **Top-N per-topic scores** to custom fields (numeric, bounded set).
- **Variant assignment** to a tag (e.g. `variant_deepdive`). This is what broadcasts target (Job 3).
- **Disengagement state** to a tag (e.g. `at_risk_declining`) when the downtrend detector fires; drives intervention sends and is queryable.

**[gotcha] Tag/segment counts are eventually consistent.** [verified] Kit notes counts can take minutes to update. Do not assume a tag write is instantly reflected in a segment used for an immediately following broadcast; allow propagation time.

### 4d. Useful read endpoint: filter by engagement [verified]

`POST /v4/subscribers/filter_subscribers_based_on_engagement` exists and lets you query subscribers by engagement. Worth evaluating as a supplementary source for the open/engagement signals webhooks do not provide.

---

## 5. Job 3: Deliver adaptive content (broadcasts) [verified from OpenAPI]

Kit v4 broadcasts support full HTML and targeting by **segment or tag ids**. There is **no per-individual conditional content inside a single broadcast**. So the model is **segment/tag-based sends**, plus a **link-out fallback** for true per-person experiences.

### Endpoints [verified]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v4/broadcasts` | List broadcasts |
| POST | `/v4/broadcasts` | Create a broadcast |
| GET | `/v4/broadcasts/{id}` | Get a broadcast |
| PUT | `/v4/broadcasts/{id}` | Update a broadcast |
| DELETE | `/v4/broadcasts/{id}` | Delete a broadcast |
| GET | broadcast stats | Open/click aggregates (covers the opens gap from Job 1) |

### Create/update request body [verified from OpenAPI]

Fields: `email_template_id` (int; account default if omitted; "Starting point" template not supported), `email_address` (nullable; account default if omitted), `content` (HTML string), `description` (string), `public` (bool: `false` = save draft, `true` = publish/schedule), `published_at` (ISO8601), `send_at` (ISO8601 scheduled send; UTC if no tz), `preview_text` (string), `subject` (string), `thumbnail_alt`, `thumbnail_url`, and `subscriber_filter` (see below).

Draft vs schedule [verified]: set `public: false` to draft; set `public: true` and provide `send_at` to schedule. A scheduled broadcast needs at minimum a subject and content.

### `subscriber_filter` (the targeting mechanism) [verified from OpenAPI]

An array of one filter group. Each group is an object with `all`, `any`, and `none` keys; each holds an array of `{ "type": "segment" | "tag", "ids": [int, ...] }`.

- `all` is logical AND (subscriber must be in every listed segment/tag)
- `any` is logical OR (in at least one)
- `none` is logical NOT (in none)

Example (target one segment) [verified]:

```json
"subscriber_filter": [
  {
    "all": [ { "type": "segment", "ids": [51] } ],
    "any": null,
    "none": null
  }
]
```

Target a variant tag instead:

```json
"subscriber_filter": [
  {
    "all": [ { "type": "tag", "ids": [12345] } ],
    "any": null,
    "none": null
  }
]
```

**[gotcha] Only ONE filter group type per API call.** [verified] You may use `all` OR `any` OR `none`, but not combinations. Violating this returns 422: "Only a single filter group is supported. Use one of `all`, `any`, or `none`." If `subscriber_filter` is omitted entirely, the broadcast defaults to ALL subscribers; guard against accidentally sending to the whole list.

### Delivery model on Kit

**A. Segment/tag-based sends (primary).** Loop assigns each reader a variant tag (Job 2). Ghostwriter generates one variant per segment (bounded: ~3 to 6, not one per person). Create one broadcast per variant, each `subscriber_filter` targeting the matching tag id. Each reader gets the matching variant. Genuine per-reader-*group* adaptation using only native capability.

**B. Link-out (richer fallback).** Broadcast is a light shell; the fully personalized experience lives on a hosted page (our service), per-subscriber via signed URL param. Use when per-person beats staying fully in-inbox.

### Create response (shape) [verified from OpenAPI]

Returns `{ "broadcast": { id, publication_id, created_at, subject, preview_text, description, content, public, published_at, send_at, thumbnail_alt, thumbnail_url, public_url, email_address, email_template: { id, name }, subscriber_filter: [...] } }`.

---

## 6. End-to-end data flow

```
  Kit (creator's ESP)                 Our service (Next + Nest + Postgres)
  ───────────────────                 ────────────────────────────────────

  subscriber.link_click  ──webhook──▶  /webhooks/kit  ──queue──▶  events table
  subscriber_activate    ──webhook──▶                              (append-only)
  unsubscribe/bounce/... ──webhook──▶                                   │
                                                                        ▼
   (opens NOT in webhooks)                              scheduled recompute job
   GET /subscribers/{id}/stats ─poll─▶                  (per-topic matrix +
   broadcast stats            ─poll─▶                    downtrend detector)
                                                                        │
                                  ◀──set fields / tag──────────  profile write-back
   subscriber record                 (Job 2: POST/PUT subscribers,    (batched,
   (top-N scores, variant tag,        POST /tags/{id}/subscribers/{id}) backoff)
    at_risk tag)
                                                                        │
   POST /broadcasts          ◀──create + subscriber_filter──   delivery (Job 3:
   (target variant tag id)                                      ghostwriter variants)
```

The loop's intelligence (matrix, downtrend detector, assembly decision) lives entirely in our Postgres and Nest services. Kit is the signal source and the delivery surface. Only a bounded summary is ever mirrored onto Kit.

---

## 7. Build checklist (Kit adapter)

- [ ] Create a v4 API key in Kit Developer settings; store server-side in Nest config.
- [ ] Build webhook ingestion (fast 2xx, async queue, source verification).
- [ ] Register webhooks for: `subscriber.link_click`, `subscriber.subscriber_activate`, `subscriber.subscriber_unsubscribe`, `subscriber.subscriber_bounce`, `subscriber.subscriber_complain`, `subscriber.form_subscribe`, `subscriber.tag_add`, `subscriber.tag_remove`. (Add `custom_field.field_value_updated` if explicit prefs are stored as fields.)
- [ ] Implement per-link topic + position encoding in the send template so `link_click` maps to topics.
- [ ] Resolve opens: poll `GET /v4/subscribers/{id}/stats` and/or broadcast stats; evaluate `filter_subscribers_based_on_engagement`. Do NOT expect an open webhook.
- [ ] Create the bounded custom-field set FIRST (`POST /v4/custom_fields`); never rely on the subscriber upsert to create fields (it silently drops unknown keys). Stay well under 140.
- [ ] Always `GET /v4/custom_fields` and use the exact returned keys when setting `fields`.
- [ ] Implement profile write-back (batched, backoff-aware, under 120/60s).
- [ ] Implement delivery via `POST /v4/broadcasts` with a single-group `subscriber_filter` targeting a variant tag id. Guard against empty filter (sends to everyone).
- [ ] Account for eventual consistency between tag writes and segment/broadcast targeting (allow propagation delay).
- [ ] Put the whole Kit adapter behind an `EspAdapter` interface so beehiiv/Klaviyo/Mailchimp are future implementations, not rewrites.

---

## 8. Source references (all v4)

- API reference overview: `https://developers.kit.com/api-reference/overview`
- Webhooks (event types, create/list/delete): `https://developers.kit.com/api-reference/webhooks/create-a-webhook`
- Subscribers (create/update/filter/stats/tags): `https://developers.kit.com/api-reference/subscribers/create-a-subscriber`
- Broadcasts (full OpenAPI incl. subscriber_filter): `https://developers.kit.com/api-reference/broadcasts/update-a-broadcast`
- Tags (tag/untag a subscriber): `https://developers.kit.com/api-reference/tags/tag-a-subscriber`
- v4 overview and migration: `https://help.kit.com/en/articles/9902901-kit-api-overview`
- Machine-readable index: `https://developers.kit.com/llms.txt`

The two shapes still worth a live-account smoke test before you depend on them: (1) the exact `fields` key form (label vs snake_case key), and (2) Kit's current webhook source-verification mechanism. Everything else here is confirmed against the live v4 reference and OpenAPI spec.