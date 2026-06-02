import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === 'true' || isProduction;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'USER',
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },
  // BETTER_AUTH_SECRET is required at boot (see env.validation). The dev-only
  // fallback never applies in production and avoids a hardcoded shared secret.
  secret:
    process.env.BETTER_AUTH_SECRET ||
    (isProduction ? undefined : 'dev-only-insecure-secret-do-not-use-in-prod'),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  basePath: '/api/auth',
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
});

export type Auth = typeof auth;
