# ─── MediBank Nexus API — Dockerfile ─────────────────────────────────────────
#
# Multi-stage build:
#   Stage 1 (deps)    — install production dependencies only
#   Stage 2 (runner)  — minimal Node Alpine image, run as non-root user

# ─── Stage 1: Install production deps ────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline

# ─── Stage 2: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S nexus && adduser -S nexus -G nexus

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Own files as non-root user
RUN chown -R nexus:nexus /app

USER nexus

EXPOSE 3001

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# dumb-init ensures signals are forwarded correctly for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
