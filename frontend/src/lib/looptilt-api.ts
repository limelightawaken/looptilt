import { api } from "./api";
import type {
  GhostwriterDraft,
  NewsletterDetail,
  NewsletterFingerprint,
  NewsletterSummary,
} from "./types/looptilt";

const API = "/api";

export const looptiltApi = {
  listNewsletters: () => api.get<NewsletterSummary[]>(`${API}/newsletters`),

  getNewsletter: (id: string) =>
    api.get<NewsletterDetail>(`${API}/newsletters/${id}`),

  createNewsletter: (data: { name: string; description?: string }) =>
    api.post<NewsletterSummary>(`${API}/newsletters`, data),

  deleteNewsletter: (id: string) =>
    api.delete<void>(`${API}/newsletters/${id}`),

  addArchiveIssue: (
    newsletterId: string,
    data: { title: string; content: string }
  ) =>
    api.post(`${API}/newsletters/${newsletterId}/archive`, data),

  removeArchiveIssue: (newsletterId: string, issueId: string) =>
    api.delete(`${API}/newsletters/${newsletterId}/archive/${issueId}`),

  getFingerprint: (newsletterId: string) =>
    api.get<NewsletterFingerprint>(
      `${API}/newsletters/${newsletterId}/fingerprint`
    ),

  generateFingerprint: (newsletterId: string) =>
    api.post<NewsletterFingerprint>(
      `${API}/newsletters/${newsletterId}/fingerprint/generate`
    ),

  listDrafts: (newsletterId: string) =>
    api.get<GhostwriterDraft[]>(`${API}/newsletters/${newsletterId}/drafts`),

  createDraft: (
    newsletterId: string,
    data: { title: string; outline?: string[]; brief?: string }
  ) =>
    api.post<GhostwriterDraft>(
      `${API}/newsletters/${newsletterId}/drafts`,
      data
    ),
};
