import { api } from "./api";
import type {
  ContentBlock,
  DataSource,
  EspStatus,
  GhostwriterDraft,
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

  listDrafts: (newsletterId: string) =>
    api.get<GhostwriterDraft[]>(`${API}/newsletters/${newsletterId}/drafts`),
  createDraft: (newsletterId: string, data: { title: string; brief?: string }) =>
    api.post<GhostwriterDraft>(`${API}/newsletters/${newsletterId}/drafts`, data),

  listBlocks: (newsletterId: string) =>
    api.get<ContentBlock[]>(`${API}/newsletters/${newsletterId}/blocks`),
  createBlock: (
    newsletterId: string,
    data: { label: string; intent: string; body: string; topicId?: string }
  ) => api.post<ContentBlock>(`${API}/newsletters/${newsletterId}/blocks`, data),
  deleteBlock: (newsletterId: string, blockId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/blocks/${blockId}`),

  getEspStatus: (newsletterId: string) =>
    api.get<EspStatus>(`${API}/newsletters/${newsletterId}/esp`),
  connectEsp: (newsletterId: string, data: { dataSource: DataSource; apiKey?: string }) =>
    api.post<EspStatus>(`${API}/newsletters/${newsletterId}/esp/connect`, data),
  disconnectEsp: (newsletterId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/esp`),

  seedSimulator: (newsletterId: string, subscriberCount: number) =>
    api.post<{ created: number }>(`${API}/newsletters/${newsletterId}/simulator/seed`, {
      subscriberCount,
    }),
  generateSignals: (newsletterId: string, issues: number) =>
    api.post<{ subscribers: number; events: number; issues: number }>(
      `${API}/newsletters/${newsletterId}/simulator/generate`,
      { issues }
    ),

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
  createSend: (newsletterId: string, title: string) =>
    api.post<Send>(`${API}/newsletters/${newsletterId}/sends`, { title }),
  pushSendToKit: (newsletterId: string, sendId: string) =>
    api.post<Send>(`${API}/newsletters/${newsletterId}/sends/${sendId}/push-to-kit`),
};
