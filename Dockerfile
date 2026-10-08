# healthPool Asseit: uma imagem só com a API (Nest) e o app web (Expo exportado).
# Na nuvem, o mesmo endereço serve as telas (/) e a API (/api).

# ---------- 1) App web ----------
FROM node:22-slim AS web
WORKDIR /app/front
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front/ ./
# Sem EXPO_PUBLIC_API_URL: a versão web chama "/api" no mesmo endereço.
RUN npx expo export --platform web --output-dir dist

# ---------- 2) API ----------
FROM node:22-slim AS api
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY back/package.json back/package-lock.json ./
RUN npm ci
COPY back/ ./
RUN npx prisma generate && npm run build && npm prune --omit=dev

# ---------- 3) Imagem final ----------
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api /app/package.json ./
COPY --from=api /app/node_modules ./node_modules
COPY --from=api /app/dist ./dist
COPY --from=api /app/prisma ./prisma
COPY --from=web /app/front/dist ./public

EXPOSE 5000
# Aplica as migrations pendentes e sobe o servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
