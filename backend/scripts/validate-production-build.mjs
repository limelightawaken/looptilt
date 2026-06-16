/**
 * Fails production builds when email is not configured (required for email verification).
 * Invoked from package.json "prebuild" when NODE_ENV=production.
 */
const PRODUCTION_SMTP_KEYS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
const PRODUCTION_RESEND_KEYS = ['RESEND_API_KEY', 'SMTP_FROM'];
const PRODUCTION_UNOSEND_KEYS = ['UNOSEND_API_KEY', 'SMTP_FROM'];

function resolveEmailProvider() {
  const provider = process.env.EMAIL_PROVIDER;
  if (provider === 'unosend') {
    return 'unosend';
  }
  if (provider === 'resend') {
    const apiKey = process.env.UNOSEND_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
    const baseUrl =
      process.env.UNOSEND_BASE_URL?.trim() ||
      process.env.RESEND_API_URL?.trim() ||
      'https://api.unosend.co';
    if (apiKey?.startsWith('un_') || baseUrl.includes('unosend.co')) {
      return 'unosend';
    }
    return 'resend';
  }
  return 'smtp';
}

if (process.env.NODE_ENV === 'production') {
  const requireEmail = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
  const provider = resolveEmailProvider();
  const requiredKeys = requireEmail
    ? provider === 'unosend'
      ? PRODUCTION_UNOSEND_KEYS
      : provider === 'resend'
        ? PRODUCTION_RESEND_KEYS
        : PRODUCTION_SMTP_KEYS
    : [];
  const missing = requiredKeys.filter((key) => {
    if (key === 'UNOSEND_API_KEY') {
      return !(process.env.UNOSEND_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim());
    }
    return !process.env[key]?.trim();
  });
  if (missing.length > 0) {
    console.error(
      `Production build blocked: email (${provider}) is required for email verification.\n` +
        `Missing: ${missing.join(', ')}\n` +
        (provider === 'unosend'
          ? 'Set EMAIL_PROVIDER=unosend, UNOSEND_API_KEY, and SMTP_FROM before building.'
          : provider === 'resend'
            ? 'Set EMAIL_PROVIDER=resend, RESEND_API_KEY, and SMTP_FROM before building.'
            : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM before building.'),
    );
    process.exit(1);
  }
}
