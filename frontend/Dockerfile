# STAGE 1: Dependencies
FROM node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# STAGE 2: Builder
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# RUN npm run build
# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_PRODUCTS_API_URL
ARG NEXT_PUBLIC_ORDERS_API_URL
ARG NEXT_PUBLIC_INVENTORY_API_URL

# Make them available as environment variables during build
ENV NEXT_PUBLIC_PRODUCTS_API_URL=$NEXT_PUBLIC_PRODUCTS_API_URL
ENV NEXT_PUBLIC_ORDERS_API_URL=$NEXT_PUBLIC_ORDERS_API_URL
ENV NEXT_PUBLIC_INVENTORY_API_URL=$NEXT_PUBLIC_INVENTORY_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# STAGE 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# [Security] Create non-root user
# Source Requirement: "Require non-root containers" 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files for the standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# [Reliability] Healthcheck (using wget since Alpine doesn't have curl by default)
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["node", "server.js"]