import { z } from 'zod';
import { getMissingEmailEnvKeys } from '../common/email/smtp.transport';

const MIN_ENCRYPTION_KEY_LENGTH = 32;

/**
 * Boot-time environment validation. Enforces the production safety guarantees:
 * no silent AI degradation and no simulator in production.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ALLOW_HEURISTIC_FALLBACK: z.string().optional(),
    ENABLE_SIMULATOR: z.string().optional(),
    ENCRYPTION_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const isProduction = env.NODE_ENV === 'production';
    if (!isProduction) {
      return;
    }
    const hasOpenAiKey = Boolean(env.OPENAI_API_KEY);
    const allowsHeuristic = env.ALLOW_HEURISTIC_FALLBACK === 'true';
    if (!hasOpenAiKey && !allowsHeuristic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Production requires OPENAI_API_KEY, or ALLOW_HEURISTIC_FALLBACK=true to explicitly accept degraded AI.',
        path: ['OPENAI_API_KEY'],
      });
    }
    if (env.ENABLE_SIMULATOR === 'true') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENABLE_SIMULATOR must not be true in production.',
        path: ['ENABLE_SIMULATOR'],
      });
    }
    if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length < MIN_ENCRYPTION_KEY_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ENCRYPTION_KEY must be at least ${MIN_ENCRYPTION_KEY_LENGTH} characters in production.`,
        path: ['ENCRYPTION_KEY'],
      });
    }
    const missingEmail = getMissingEmailEnvKeys(env);
    for (const key of missingEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Production requires ${key} for email verification.`,
        path: [key],
      });
    }
  });

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates process environment variables, throwing a descriptive error when
 * production safety requirements are not met.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }
  return config;
}
