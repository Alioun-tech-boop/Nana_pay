# =============================================================================
# NanaPay Backend - Image de production (multi-stage, non-root)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Outils de build pour modules natifs (argon2)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
# Génère le client Prisma. Variables fictives si absentes (generate ne se connecte pas).
RUN DATABASE_URL="${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}" \
    DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}" \
    npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Utilisateur non-root
RUN addgroup -S nanapay && adduser -S nanapay -G nanapay
USER nanapay

EXPOSE 3000

# Healthcheck applicatif (endpoint /healthz)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
