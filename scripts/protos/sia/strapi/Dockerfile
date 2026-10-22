# Панель SIA на Strapi. Образ собирает GitHub (.github/workflows/sia-cms.yml),
# сервер его только скачивает и запускает: сборка Strapi на боевом сервере
# запрещена правилом «Сервер не собирает сайт». Контекст — корень репозитория:
# первому наполнению нужны снимки бюро из public/protos/sia.
FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY scripts/protos/sia/strapi/package.json scripts/protos/sia/strapi/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY scripts/protos/sia/strapi/ ./
# Адрес, под которым живёт панель (devuz.studio/sia-cms): панель Strapi
# собирается под него, иначе её файлы ищутся в корне сайта.
ARG PUBLIC_URL=https://devuz.studio/sia-cms
ENV PUBLIC_URL=$PUBLIC_URL NODE_ENV=production
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM public.ecr.aws/docker/library/node:22-bookworm-slim
WORKDIR /app
ARG PUBLIC_URL=https://devuz.studio/sia-cms
ENV NODE_ENV=production PUBLIC_URL=$PUBLIC_URL IS_PROXIED=true \
    DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db SIA_IMAGES=/seed-images
COPY --from=build /app /app
COPY public/protos/sia/p /seed-images/p
COPY public/protos/sia/d /seed-images/d
COPY public/protos/sia/t /seed-images/t
COPY public/protos/sia/team /seed-images/team
USER node
EXPOSE 1337
CMD ["sh", "scripts/start.sh"]
