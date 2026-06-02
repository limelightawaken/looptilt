/**
 * ESP-agnostic types for the three integration jobs (read signals, write
 * profile, deliver content). The Kit adapter implements EspAdapter; beehiiv,
 * Klaviyo, and Mailchimp are future implementations of the same contract.
 */

export interface EspSubscriberUpsert {
  email: string;
  firstName?: string;
  fields?: Record<string, string>;
}

export interface EspWebhookRegistration {
  event: string;
  initiatorValue?: string;
}

export interface EspBroadcastInput {
  subject: string;
  content: string;
  tagId: string;
  /** When false the broadcast is saved as a draft and never sent. */
  publish: boolean;
}

export interface EspBroadcastResult {
  broadcastId: string;
  isDraft: boolean;
}

export interface EspAdapter {
  readonly provider: 'KIT';
  verifyConnection(): Promise<{ accountId: string }>;
  ensureCustomField(label: string): Promise<string>;
  ensureTag(name: string): Promise<string>;
  upsertSubscriber(input: EspSubscriberUpsert): Promise<{ id: string }>;
  tagSubscriber(tagId: string, subscriberId: string): Promise<void>;
  untagSubscriber(tagId: string, subscriberId: string): Promise<void>;
  registerWebhook(targetUrl: string, registration: EspWebhookRegistration): Promise<string>;
  createBroadcast(input: EspBroadcastInput): Promise<EspBroadcastResult>;
}
