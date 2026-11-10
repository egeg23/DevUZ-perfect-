# HTTPS сайта CZECHFARM. Свой образ в ghcr.io, а не caddy с Docker Hub: сервер
# компании ходит только в ghcr.io, Docker Hub отвечает не всегда и не везде.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
