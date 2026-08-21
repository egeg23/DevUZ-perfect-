# syntax=docker/dockerfile:1

# ─── Зависимости ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── Сборка ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные с префиксом NEXT_PUBLIC_ вшиваются в клиентский бандл на этапе
# сборки, поэтому они обязаны быть здесь, а не в рантайме. Серверные ключи,
# наоборот, сюда попадать не должны: всё, что видел билд, остаётся в слоях
# образа.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID
ARG NEXT_PUBLIC_GA_ID
ARG GIT_COMMIT
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    GIT_COMMIT=$GIT_COMMIT \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Рантайм ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Node сам по себе игнорирует HTTP_PROXY и HTTPS_PROXY — в отличие от Python,
# где то же самое работает без единой строки кода. Флаг включает разбор этих
# переменных для fetch. Если прокси не задан, флаг ничего не делает, поэтому
# он включён всегда: так одна и та же сборка работает и с прокси, и без.
ENV NODE_OPTIONS=--use-env-proxy

# Обращения внутрь контейнера через прокси гнать нельзя: healthcheck стучится
# на 127.0.0.1, и без этого исключения он уходил бы наружу и падал, объявляя
# исправный контейнер больным.
ENV NO_PROXY=127.0.0.1,localhost

# Своим пользователем, а не root: если процесс скомпрометируют, у него не
# будет прав на весь контейнер.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
