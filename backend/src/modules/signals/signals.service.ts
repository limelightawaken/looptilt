import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Prisma, SignalType } from '@prisma/client';
import { DatabaseService } from '../../common/database/database.service';
import { decodeTopicLink } from './link-encoder';

const EVENT_TYPE_MAP: Record<string, SignalType> = {
  link_click: SignalType.LINK_CLICK,
  subscriber_activate: SignalType.ACTIVATE,
  subscriber_unsubscribe: SignalType.UNSUBSCRIBE,
  subscriber_bounce: SignalType.BOUNCE,
  subscriber_complain: SignalType.COMPLAIN,
  form_subscribe: SignalType.FORM_SUBSCRIBE,
  tag_add: SignalType.TAG_ADD,
  tag_remove: SignalType.TAG_REMOVE,
};

interface KitSubscriberPayload {
  subscriber?: {
    id?: number | string;
    email_address?: string;
    first_name?: string;
  };
  initiator_value?: string;
  link?: { url?: string };
}

/**
 * Ingests inbound signals (real Kit webhooks). Events are stored append-only and
 * always stamped source=KIT. A newsletter must be in LIVE_KIT mode for live
 * events to be accepted, so live and simulated data never mix.
 */
@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(private readonly database: DatabaseService) {}

  async ingestKitEvent(
    newsletterId: string,
    eventName: string,
    payload: KitSubscriberPayload,
  ): Promise<void> {
    const connection = await this.database.espConnection.findUnique({ where: { newsletterId } });
    if (!connection || connection.dataSource !== 'LIVE_KIT') {
      this.logger.warn(`Ignoring Kit event for ${newsletterId}: not in LIVE_KIT mode`);
      return;
    }
    const type = this.resolveType(eventName);
    if (!type) {
      this.logger.warn(`Unmapped Kit event "${eventName}" for ${newsletterId}`);
      return;
    }
    const email = payload.subscriber?.email_address;
    if (!email) {
      this.logger.warn(`Kit event "${eventName}" missing subscriber email`);
      return;
    }
    const subscriber = await this.upsertSubscriber(newsletterId, email, payload);
    const clickUrl = payload.initiator_value || payload.link?.url || null;
    const topicId = clickUrl ? await this.resolveTopicId(newsletterId, clickUrl) : null;
    const position = clickUrl ? decodeTopicLink(clickUrl).position : null;
    await this.recordEvent({
      newsletterId,
      subscriberId: subscriber.id,
      type,
      source: DataSource.LIVE_KIT,
      topicId,
      linkUrl: clickUrl,
      position,
      rawPayload: payload as unknown as Prisma.InputJsonValue,
    });
  }

  private resolveType(eventName: string): SignalType | null {
    const normalized = eventName.replace(/^subscriber\./, '').replace(/^subscriber_/, (m) => m);
    const key = eventName.replace(/^subscriber\./, '');
    return EVENT_TYPE_MAP[key] ?? EVENT_TYPE_MAP[normalized] ?? null;
  }

  private async upsertSubscriber(
    newsletterId: string,
    email: string,
    payload: KitSubscriberPayload,
  ) {
    return this.database.subscriber.upsert({
      where: { newsletterId_email: { newsletterId, email } },
      create: {
        newsletterId,
        email,
        source: DataSource.LIVE_KIT,
        espSubscriberId: payload.subscriber?.id ? String(payload.subscriber.id) : null,
        firstName: payload.subscriber?.first_name ?? null,
      },
      update: {
        espSubscriberId: payload.subscriber?.id ? String(payload.subscriber.id) : undefined,
      },
    });
  }

  private async resolveTopicId(newsletterId: string, url: string): Promise<string | null> {
    const decoded = decodeTopicLink(url);
    if (!decoded.topicSlug) {
      return null;
    }
    const topic = await this.database.newsletterTopic.findUnique({
      where: { newsletterId_slug: { newsletterId, slug: decoded.topicSlug } },
      select: { id: true },
    });
    return topic?.id ?? null;
  }

  private async recordEvent(data: Prisma.SignalEventUncheckedCreateInput): Promise<void> {
    await this.database.signalEvent.create({ data });
  }
}
