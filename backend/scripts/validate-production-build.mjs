/**
 * Fails production builds when email is not configured (required for email verification).
 * Invoked from package.json "prebuild" when NODE_ENV=production.
 */
const PRODUCTION_SMTP_KEYS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
const PRODUCTION_RESEND_KEYS = ['RESEND_API_KEY', 'SMTP_FROM'];

if (process.env.NODE_ENV === 'production') {
  const provider = process.env.EMAIL_PROVIDER === 'resend' ? 'resend' : 'smtp';
  const requiredKeys = provider === 'resend' ? PRODUCTION_RESEND_KEYS : PRODUCTION_SMTP_KEYS;
  const missing = requiredKeys.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(
      `Production build blocked: email (${provider}) is required for email verification.\n` +
        `Missing: ${missing.join(', ')}\n` +
        (provider === 'resend'
          ? 'Set EMAIL_PROVIDER=resend, RESEND_API_KEY, and SMTP_FROM before building.'
          : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM before building.'),
    );
    process.exit(1);
  }
}
