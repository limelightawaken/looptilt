import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { sendSmtpMail } from '../common/email/smtp.transport';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
/** Off in development by default; always on in production. Set REQUIRE_EMAIL_VERIFICATION=true to test locally. */
export const requireEmailVerification =
  isProduction || process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    autoSignIn: !requireEmailVerification,
  },
  ...(requireEmailVerification
    ? {
        emailVerification: {
          sendOnSignUp: true,
          sendOnSignIn: true,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            await sendSmtpMail({
              to: user.email,
              subject: 'Verify your LoopTilt email',
              html: `
                <h1>Verify your email</h1>
                <p>Hi${user.name ? ` ${user.name}` : ''},</p>
                <p>Click the link below to verify your email address:</p>
                <p><a href="${url}">${url}</a></p>
                <p>If you did not create an account, you can ignore this email.</p>
              `,
            });
          },
        },
      }
    : {}),
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
