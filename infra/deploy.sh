#!/usr/bin/env bash
#
# Выкатка SUNSCRYPT на сервере. Запускается из GitHub Actions по SSH
# (.github/workflows/sunscrypt-deploy.yml) после каждого пуша в ветку
# sunscrypt; руками — `bash /opt/sunscrypt/infra/deploy.sh` от root.
#
# Сервер общий: на нём же devuz.studio, витрина globalex и другие проекты.
# Поэтому скрипт трогает только своё — проект Docker Compose «sunscrypt»,
# свой порт и свой сайт nginx — и ничего не чистит за пределами этого.
#
# Секреты приложения в git не попадают никогда: репозиторий публичный. Они
# живут в /opt/sunscrypt/.env (только root), создаются здесь один раз и
# дальше не перезаписываются.

set -euo pipefail
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY https_proxy http_proxy all_proxy

APP_DIR="${APP_DIR:-/opt/sunscrypt}"
ENV_FILE="$APP_DIR/.env"
cd "$APP_DIR"

say() { printf '▸ %s\n' "$*"; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }
env_get() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true; }

# ── 1. Секреты: один раз, на сервере ────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  say "Первая выкатка: создаю $ENV_FILE с новыми секретами"
  umask 077
  {
    echo "# SUNSCRYPT — секреты сервера. В git не класть. Создан $(date -u +%F)."
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
    echo "MASTER_KEY=$(openssl rand -base64 32)"
    echo "SESSION_SECRET=$(openssl rand -hex 32)"
  } > "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"

# ── 1б. Секреты владельца из GitHub ──────────────────────────────────────────
# Владелец заводит их в Settings → Secrets → Actions с префиксом SUNSCRYPT_;
# выкатка передаёт их сюда в окружении и записывает в .env без префикса.
# Пустой — не трогаем (секрет не заведён или уже записан раньше). Значения
# не печатаются.
env_set() {
  local tmp; tmp="$(mktemp "$APP_DIR/.env.XXXXXX")"
  grep -vE "^$1=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  chmod 600 "$tmp"; mv "$tmp" "$ENV_FILE"
}
for name in TELEGRAM_TOKEN BYBIT_DEMO_API_KEY BYBIT_DEMO_API_SECRET; do
  var="SUNSCRYPT_$name"
  if [ -n "${!var:-}" ]; then
    if [ "$(env_get "$name")" != "${!var}" ]; then
      env_set "$name" "${!var}"
      say "Секрет $name записан в .env"
    fi
  fi
done

# ── 2. Порт: свободный, запоминается ────────────────────────────────────────
port_busy() { ss -ltnH "sport = :$1" 2>/dev/null | grep -q .; }
if [ -z "$(env_get WEB_PORT)" ]; then
  for p in $(seq 3470 3499); do
    if ! port_busy "$p"; then echo "WEB_PORT=$p" >> "$ENV_FILE"; break; fi
  done
fi
WEB_PORT="$(env_get WEB_PORT)"
[ -n "$WEB_PORT" ] || die "Нет свободного порта в 3470–3499"

# ── 3. Временный адрес: sunscrypt.<ip>.sslip.io ─────────────────────────────
# Бриф: «сейчас — не на поддомене, временный хост, потом перенос на
# maximov-tech.ru». sslip.io отвечает адресом, зашитым в имя, — домен не
# нужен, а сертификат Let's Encrypt на такое имя выдаётся. Переезд на домен —
# PUBLIC_HOST в .env и повторная выкатка.
if [ -z "$(env_get PUBLIC_HOST)" ]; then
  IP="$(curl -fsS --max-time 10 https://api.ipify.org || hostname -I | awk '{print $1}')"
  [ -n "$IP" ] || die "Не узнал внешний адрес сервера"
  echo "PUBLIC_HOST=sunscrypt.${IP//./-}.sslip.io" >> "$ENV_FILE"
fi
PUBLIC_HOST="$(env_get PUBLIC_HOST)"

# ── 4. Сборка и запуск ──────────────────────────────────────────────────────
export GIT_COMMIT
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
COMPOSE=(docker compose -p sunscrypt --env-file "$ENV_FILE" -f infra/docker-compose.yml)
say "Собираю и запускаю (порт $WEB_PORT)"
"${COMPOSE[@]}" up -d --build --remove-orphans

say "Жду ответа приложения"
ok=""
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:$WEB_PORT/"; then ok=1; break; fi
  sleep 2
done
if [ -z "$ok" ]; then
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --tail 80 >&2 || true
  die "Приложение не ответило на 127.0.0.1:$WEB_PORT"
fi
say "Проверяю API, базу и Redis"
health=""
for _ in $(seq 1 30); do
  if health="$(curl -fsS --max-time 5 "http://127.0.0.1:$WEB_PORT/api/health")"; then break; fi
  health=""; sleep 2
done
if [ -z "$health" ]; then
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --tail 80 backend >&2 || true
  die "API не ответил: /api/health"
fi
say "API: $health"
say "Память контейнеров: $(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' $("${COMPOSE[@]}" ps -q) | tr '\n' ';')"

# ── 5. nginx и сертификат ───────────────────────────────────────────────────
SITE=/etc/nginx/sites-available/sunscrypt
LINK=/etc/nginx/sites-enabled/sunscrypt
if [ -f "$SITE" ]; then
  # certbot уже дописал в файл сертификат — меняем только адрес и порт.
  cp "$SITE" "$SITE.bak"
  sed -i -E "s#proxy_pass http://127\.0\.0\.1:[0-9]+;#proxy_pass http://127.0.0.1:$WEB_PORT;#g; s#server_name [^;]+;#server_name $PUBLIC_HOST;#g" "$SITE"
else
  sed -e "s#__HOST__#$PUBLIC_HOST#g" -e "s#__PORT__#$WEB_PORT#g" infra/nginx.conf.template > "$SITE"
fi
ln -sf "$SITE" "$LINK"
if nginx -t 2>/dev/null; then
  systemctl reload nginx
else
  nginx -t || true
  [ -f "$SITE.bak" ] && mv "$SITE.bak" "$SITE" || rm -f "$SITE" "$LINK"
  die "nginx -t не прошёл — конфиг SUNSCRYPT откатан, остальные сайты не тронуты"
fi

if ! grep -q ssl_certificate "$SITE"; then
  if command -v certbot >/dev/null 2>&1; then
    say "Получаю сертификат для $PUBLIC_HOST"
    certbot --nginx -d "$PUBLIC_HOST" --non-interactive --agree-tos \
      --register-unsafely-without-email --redirect \
      || echo "⚠ сертификат не получен — сайт пока работает по http" >&2
  else
    echo "⚠ certbot не установлен — сайт работает по http" >&2
  fi
fi

# ── 6. Что за сервер и пускает ли Bybit ─────────────────────────────────────
# Для того, кто строит дальше: сколько ресурсов на общем сервере и открыт ли
# отсюда Bybit (из облачных контейнеров он закрыт гео-блоком, бриф, раздел 4).
say "Сервер: $(nproc) CPU, память $(free -h | awk '/^Mem:/{print $2" всего, "$7" свободно"}'), диск $(df -h "$APP_DIR" | awk 'NR==2{print $4" свободно"}')"
for url in https://api.bybit.com/v5/market/time https://api-demo.bybit.com/v5/market/time https://stream.bybit.com/v5/public/linear; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "нет ответа")"
  say "Bybit $url → $code"
done

SCHEME=http
grep -q ssl_certificate "$SITE" && SCHEME=https
say "Готово: $SCHEME://$PUBLIC_HOST (коммит $(git rev-parse --short HEAD))"
