import { api } from "./api";
import type {
  ContentBlock,
  ContentBlockKind,
  DataSource,
  EspStatus,
  Insights,
  NewsletterDetail,
  NewsletterFingerprint,
  NewsletterSummary,
  Reader,
  RecomputeResult,
  Segment,
  SegmentPreview,
  SegmentRule,
  Send,
} from "./types/looptilt";

const API = "/api";

export const looptiltApi = {
  listNewsletters: () => api.get<NewsletterSummary[]>(`${API}/newsletters`),
  getNewsletter: (id: string) => api.get<NewsletterDetail>(`${API}/newsletters/${id}`),
  createNewsletter: (data: { name: string; description?: string }) =>
    api.post<NewsletterSummary>(`${API}/newsletters`, data),
  deleteNewsletter: (id: string) => api.delete<void>(`${API}/newsletters/${id}`),

  addArchiveIssue: (newsletterId: string, data: { title: string; content: string }) =>
    api.post(`${API}/newsletters/${newsletterId}/archive`, data),
  removeArchiveIssue: (newsletterId: string, issueId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/archive/${issueId}`),

  getFingerprint: (newsletterId: string) =>
    api.get<NewsletterFingerprint>(`${API}/newsletters/${newsletterId}/fingerprint`),
  generateFingerprint: (newsletterId: string) =>
    api.post<NewsletterFingerprint>(`${API}/newsletters/${newsletterId}/fingerprint/generate`),

  listBlocks: (newsletterId: string, sendId: string) =>
    api.get<ContentBlock[]>(`${API}/newsletters/${newsletterId}/sends/${sendId}/blocks`),
  createBlock: (
    newsletterId: string,
    sendId: string,
    data: {
      kind?: ContentBlockKind;
      label: string;
      intent?: string;
      body?: string;
      url?: string;
      topicId?: string;
    }
  ) => api.post<ContentBlock>(`${API}/newsletters/${newsletterId}/sends/${sendId}/blocks`, data),
  deleteBlock: (newsletterId: string, sendId: string, blockId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/sends/${sendId}/blocks/${blockId}`),

  getEspStatus: (newsletterId: string) =>
    api.get<EspStatus>(`${API}/newsletters/${newsletterId}/esp`),
  connectEsp: (newsletterId: string, data: { dataSource: DataSource; apiKey?: string }) =>
    api.post<EspStatus>(`${API}/newsletters/${newsletterId}/esp/connect`, data),
  getKitOAuthUrl: (newsletterId: string) =>
    api.get<{ url: string }>(`${API}/newsletters/${newsletterId}/esp/oauth/url`),
  disconnectEsp: (newsletterId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/esp`),

  seedSimulator: (newsletterId: string, subscriberCount = 60, issues = 10) =>
    api.post<{
      archiveIssues: number;
      topics: number;
      fingerprintReady: boolean;
      subscribers: number;
      events: number;
      issues: number;
      readersUpdated: number;
      segments: number;
      memberships: number;
    }>(`${API}/newsletters/${newsletterId}/simulator/seed`, { subscriberCount, issues }),

  listReaders: (newsletterId: string) =>
    api.get<Reader[]>(`${API}/newsletters/${newsletterId}/readers`),
  getInsights: (newsletterId: string) =>
    api.get<Insights>(`${API}/newsletters/${newsletterId}/readers/insights`),

  recompute: (newsletterId: string) =>
    api.post<RecomputeResult>(`${API}/newsletters/${newsletterId}/loop/recompute`),

  listSegments: (newsletterId: string) =>
    api.get<Segment[]>(`${API}/newsletters/${newsletterId}/segments`),
  previewSegment: (newsletterId: string, description: string) =>
    api.post<SegmentPreview>(`${API}/newsletters/${newsletterId}/segments/preview`, {
      description,
    }),
  createSegment: (
    newsletterId: string,
    data: { name: string; description?: string; rationale?: string; rule: SegmentRule }
  ) => api.post<Segment>(`${API}/newsletters/${newsletterId}/segments`, data),
  deleteSegment: (newsletterId: string, segmentId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/segments/${segmentId}`),

  listSends: (newsletterId: string) =>
    api.get<Send[]>(`${API}/newsletters/${newsletterId}/sends`),
  getSend: (newsletterId: string, sendId: string) =>
    api.get<Send>(`${API}/newsletters/${newsletterId}/sends/${sendId}`),
  createSend: (newsletterId: string, title: string) =>
    api.post<Send>(`${API}/newsletters/${newsletterId}/sends`, { title }),
  generateSend: (newsletterId: string, sendId: string) =>
    api.post<Send>(`${API}/newsletters/${newsletterId}/sends/${sendId}/generate`),
  pushSendToKit: (newsletterId: string, sendId: string) =>
    api.post<Send>(`${API}/newsletters/${newsletterId}/sends/${sendId}/push-to-kit`),
};
