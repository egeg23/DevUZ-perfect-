# Сайт «Сияние Севера» для сервера клиники: сайт, админка и вебхуки одним
# процессом node, база SQLite в /data. Собирает GitHub (syanie-app.yml):
# там же SY_PROD=1 node gen.mjs кладёт страницы в site/, а кадры и видео
# копируются из public/protos/syanie в контекст сборки. Сервер клиники
# образ только скачивает (deploy/remote.sh).
FROM node:22-alpine
ENV NODE_ENV=production DATA_DIR=/data PORT=3000 NODE_OPTIONS=--disable-warning=ExperimentalWarning
WORKDIR /app
COPY --chown=node:node lib/ lib/
COPY --chown=node:node admin/ admin/
COPY --chown=node:node site/ site/
COPY --chown=node:node server.mjs ./
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.mjs"]
