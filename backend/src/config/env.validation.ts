import { z } from 'zod';
import { getMissingEmailEnvKeys } from '../common/email/email-config';

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
    REQUIRE_EMAIL_VERIFICATION: z.string().optional(),
    EMAIL_PROVIDER: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const isProduction = env.NODE_ENV === 'production';
    if (!isProduction) {
      return;
    }
    if (env.ENABLE_SIMULATOR === 'true') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENABLE_SIMULATOR must not be true in production.',
        path: ['ENABLE_SIMULATOR'],
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

  const isProduction = config.NODE_ENV === 'production';
  if (isProduction) {
    const hasOpenAiKey = Boolean(String(config.OPENAI_API_KEY ?? '').trim());
    const allowsHeuristic = config.ALLOW_HEURISTIC_FALLBACK !== 'false';
    if (!hasOpenAiKey && !allowsHeuristic) {
      throw new Error(
        'Invalid environment configuration:\n- Production requires OPENAI_API_KEY, or ALLOW_HEURISTIC_FALLBACK must not be false.',
      );
    }

    const encryptionKey = String(config.ENCRYPTION_KEY ?? '');
    if (encryptionKey.length < MIN_ENCRYPTION_KEY_LENGTH) {
      throw new Error(
        `Invalid environment configuration:\n- ENCRYPTION_KEY must be at least ${MIN_ENCRYPTION_KEY_LENGTH} characters in production.`,
      );
    }

    if (config.REQUIRE_EMAIL_VERIFICATION !== 'false') {
      const missingEmail = getMissingEmailEnvKeys(config);
      if (missingEmail.length > 0) {
        const messages = missingEmail
          .map((key) => `- Production requires ${key} for email verification.`)
          .join('\n');
        throw new Error(`Invalid environment configuration:\n${messages}`);
      }
    }
  }

  return config;
}
