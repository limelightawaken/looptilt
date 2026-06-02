# Multi-stage build for LoopTilt NestJS backend

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./

RUN npm ci

COPY prisma ./prisma/

RUN npx prisma generate

COPY src ./src
COPY scripts ./scripts/

# Do not set NODE_ENV=production here — prebuild enforces SMTP and is for deploy-time config.
RUN npm run build

RUN ls -la dist/ && test -f dist/main.js

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Prisma CLI for migrate deploy at container start
RUN npm install prisma@^6.0.0 --save-dev && npm cache clean --force

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

RUN ls -la dist/ && test -f dist/main.js

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Apply pending migrations, then start the API (requires DATABASE_URL at runtime).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
