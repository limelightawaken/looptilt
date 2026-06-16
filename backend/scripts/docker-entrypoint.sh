#!/bin/sh
set -e

# Mirror local docker URL resolution: explicit BACKEND_URL/FRONTEND_URL, then SERVICE_URL_* fallbacks.
export BACKEND_URL="${BACKEND_URL:-${SERVICE_URL_BACKEND}}"
export FRONTEND_URL="${FRONTEND_URL:-${SERVICE_URL_FRONTEND}}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-${BACKEND_URL}}"
export APP_PUBLIC_URL="${APP_PUBLIC_URL:-${BACKEND_URL}}"

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
  echo "ERROR: BACKEND_URL and FRONTEND_URL must be set (or SERVICE_URL_BACKEND / SERVICE_URL_FRONTEND)."
  exit 1
fi

# Build a URL-safe DATABASE_URL (Coolify-generated passwords often contain special chars).
if [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export DATABASE_URL="$(node -e "
    const user = process.env.POSTGRES_USER || 'looptilt';
    const pass = encodeURIComponent(process.env.POSTGRES_PASSWORD || '');
    const host = process.env.POSTGRES_HOST || 'postgres';
    const port = process.env.POSTGRES_PORT || '5432';
    const db = process.env.POSTGRES_DB || 'looptilt';
    process.stdout.write(
      'postgresql://' + user + ':' + pass + '@' + host + ':' + port + '/' + db + '?schema=public',
    );
  ")"
fi

echo "BACKEND_URL=$BACKEND_URL"
echo "FRONTEND_URL=$FRONTEND_URL"
echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting NestJS application..."
exec node dist/main.js
