# HTTPS сайта клиники. Свой образ в ghcr.io, а не caddy с Docker Hub: сервер
# клиники ходит только в ghcr.io, Docker Hub из России отвечает не всегда.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
