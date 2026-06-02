/**
 * Per-link topic + position encoding. Every outbound link carries the topic id
 * (lt) and a read-depth position (pos) so that an inbound Kit link_click webhook
 * (which only gives us the clicked URL) can be mapped back to a fingerprint topic.
 */
export interface DecodedLink {
  topicSlug: string | null;
  position: string | null;
}

/**
 * Appends topic + position params to a content URL before send.
 */
export function encodeTopicLink(url: string, topicSlug: string, position: string): string {
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${url}${separator}lt=${encodeURIComponent(topicSlug)}&pos=${encodeURIComponent(position)}`;
}

/**
 * Extracts the encoded topic slug and position from a clicked URL.
 */
export function decodeTopicLink(url: string): DecodedLink {
  try {
    const parsed = new URL(url);
    return {
      topicSlug: parsed.searchParams.get('lt'),
      position: parsed.searchParams.get('pos'),
    };
  } catch {
    return { topicSlug: null, position: null };
  }
}
