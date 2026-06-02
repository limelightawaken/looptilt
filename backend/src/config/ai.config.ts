import { registerAs } from '@nestjs/config';

/**
 * Configuration for the AI layer.
 * Provider selection is explicit: OpenAI when a key exists; the heuristic
 * fallback is only permitted outside production or when explicitly allowed.
 */
export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  /** Optional override for OpenAI-compatible APIs (DeepSeek, Ollama, etc.). */
  openaiBaseUrl: process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  allowHeuristicFallback: process.env.ALLOW_HEURISTIC_FALLBACK === 'true',
}));
