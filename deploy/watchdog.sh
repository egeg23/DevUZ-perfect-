#!/usr/bin/env bash
# Сторож сайта: раз в минуту спрашивает приложение, живо ли оно.
#
# 07.10.2026 сервер несколько часов отвечал через раз, и единственным, кто
# это заметил, был владелец — по тому, что бот не узнал его на /login.
# Проверка Docker (healthcheck в compose) смотрит изнутри контейнера и
# перезапуском не занимается; restart: unless-stopped поднимает только
# упавший процесс, а не зависший. Сторож закрывает этот зазор снаружи,
# с хоста, тем же запросом, которым проверяют выкатку.
#
# Правила — три, и они нарочно простые:
#   1. три минуты молчания подряд → перезапуск контейнера и строка владельцу;
#   2. перезапускали меньше десяти минут назад, а сайт опять молчит →
#      перезапуском это не лечится: один раз зовём человека и больше не
#      дёргаем ни контейнер, ни его;
#   3. ответил после тревоги → одна строка «снова отвечает».
# Пока идёт выкатка (замок /tmp/devuz-deploy.lock занят), сторож молчит:
# контейнер в это время перезапускается по плану.
#
# Состояние — в /run: это память, она обнуляется с перезагрузкой сервера,
# и старый счётчик не может сработать на свежем старте.
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/devuz}"
STATE="${WATCHDOG_STATE:-/run/devuz-watchdog}"
LOCK=/tmp/devuz-deploy.lock
FAILS_BEFORE_RESTART=3
RESTART_COOLDOWN_S=600

mkdir -p "$STATE"
[ -f "$APP_DIR/.env" ] || { echo "watchdog: нет $APP_DIR/.env" >&2; exit 0; }

envval() {
  grep -m1 "^$1=" "$APP_DIR/.env" | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}
PORT="$(envval APP_PORT || true)"; PORT="${PORT:-3310}"

# Выкатка идёт — не вмешиваемся и счётчик не трогаем.
if ! flock -n "$LOCK" true 2>/dev/null; then
  exit 0
fi

# Строка владельцу — с хоста, не через приложение: когда сторож срабатывает,
# приложения как раз и нет. Две дороги, как у бота: напрямую, потом через
# прокси из .env. Текст уходит и в journal: без Telegram его всё равно видно.
say() {
  local text="$1" token chat proxy
  echo "watchdog: $text"
  token="$(envval TELEGRAM_BOT_TOKEN || true)"
  chat="$(envval TELEGRAM_OWNER_CHAT_ID || true)"
  [ -n "$chat" ] || chat="$(envval TELEGRAM_SALES_CHAT_ID || true)"
  [ -n "$token" ] && [ -n "$chat" ] || return 0
  proxy="$(envval HTTPS_PROXY || true)"
  local body
  body="$(printf '{"chat_id":"%s","text":"%s","disable_web_page_preview":true}' "$chat" "🖥 devuz.studio: $text")"
  for road in direct proxy; do
    if [ "$road" = proxy ]; then
      [ -n "$proxy" ] || continue
      via=(--proxy "$proxy")
    else
      via=(--noproxy '*')
    fi
    # Токен — в адресе через stdin-конфиг, чтобы не светить его в ps.
    if printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$token" \
      | curl -sS --max-time 15 "${via[@]}" -K - -H 'content-type: application/json' -d "$body" >/dev/null 2>&1; then
      return 0
    fi
  done
  echo "watchdog: строка в Telegram не ушла ни напрямую, ни через прокси" >&2
}

if curl -fsS --max-time 20 --noproxy '*' "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  if [ -f "$STATE/down" ]; then
    rm -f "$STATE/down" "$STATE/escalated"
    say "снова отвечает ✅"
  fi
  echo 0 > "$STATE/fails"
  exit 0
fi

fails=$(( $(cat "$STATE/fails" 2>/dev/null || echo 0) + 1 ))
echo "$fails" > "$STATE/fails"
echo "watchdog: приложение не ответило ($fails подряд)"
[ "$fails" -ge "$FAILS_BEFORE_RESTART" ] || exit 0

now="$(date +%s)"
last="$(cat "$STATE/restarted_at" 2>/dev/null || echo 0)"
if [ $(( now - last )) -lt "$RESTART_COOLDOWN_S" ]; then
  # Уже перезапускали — и не помогло. Дальше нужен человек, и зовём его
  # один раз за аварию, а не каждую минуту.
  if [ ! -f "$STATE/escalated" ]; then
    touch "$STATE/escalated"
    say "не отвечает и после перезапуска ⛔ Перезапуском не лечится, нужен человек: ssh на сервер, docker compose logs web в $APP_DIR"
  fi
  exit 0
fi

echo "$now" > "$STATE/restarted_at"
touch "$STATE/down"
say "не отвечает $fails минуты подряд ⚠️ Перезапускаю контейнер."
cd "$APP_DIR" || exit 0
# up — если контейнера нет или он остановлен; restart — если он есть, но завис.
docker compose up -d --no-build web >/dev/null 2>&1 || true
docker compose restart web >/dev/null 2>&1 || echo "watchdog: docker compose restart не удался" >&2
