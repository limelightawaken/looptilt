#!/bin/sh
set -e

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

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting NestJS application..."
exec node dist/main.js
