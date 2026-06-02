/**
 * Fails production builds when SMTP is not configured (required for email verification).
 * Invoked from package.json "prebuild" when NODE_ENV=production.
 */
const PRODUCTION_SMTP_KEYS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

if (process.env.NODE_ENV === 'production') {
  const missing = PRODUCTION_SMTP_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(
      'Production build blocked: email (SMTP) is required for email verification.\n' +
        `Missing: ${missing.join(', ')}\n` +
        'Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM before building.',
    );
    process.exit(1);
  }
}
