#!/usr/bin/env bash
# Выкатка сайта «Сияние Севера» на сервер клиники. Запускает её задача
# «Сайт Сияние Севера: сервер клиники» (.github/workflows/syanie-app.yml)
# по SSH; сервер ничего не собирает, только скачивает два готовых образа:
#   syanie-app   — сайт, админка, вебхуки (node, база SQLite в /opt/syanie/data);
#   syanie-caddy — HTTPS: сертификат Let's Encrypt для домена сам.
# Если 80/443 уже держит nginx клиники, Caddy не ставится: nginx получает
# свой файл для домена и ведёт на 127.0.0.1:3000.
#
# Окружение (передаёт задача): SY_APP, SY_CADDY — образы с хешем коммита;
# SY_DOMAIN; SY_COMMIT; SY_SETUP — код установки (может быть пустым);
# GH_TOKEN, GH_ACTOR — вход в ghcr.io на время задачи; SY_FRONT — auto|caddy|nginx|none.
#
# Репозиторий открытый, журнал задачи видят все: ключи и код установки сюда
# не печатаются, только «задан / создан».
set -euo pipefail
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY https_proxy http_proxy all_proxy

D=/opt/syanie
FRONT="${SY_FRONT:-auto}"
: "${SY_APP:?нет образа сайта}" "${SY_DOMAIN:?нет домена}"
if [ "$(id -u)" -eq 0 ]; then SUDO=""; elif sudo -n true 2>/dev/null; then SUDO="sudo -n"; else
  echo "✗ нужен root или sudo без пароля: ставим Docker и пишем в /opt"; exit 1; fi
say() { printf '%s\n' "$*"; }

say "════ Сервер ════"
say "$(. /etc/os-release 2>/dev/null && echo "${PRETTY_NAME:-linux}") · $(nproc) ядер · $(free -m | awk '/Mem:/{print $2}') МБ памяти"
FREE_MB="$(df -Pm / | awk 'NR==2{print $4}')"
say "свободно на диске: ${FREE_MB} МБ"
[ "$FREE_MB" -ge 1500 ] || { say "✗ меньше 1,5 ГБ свободного места"; exit 1; }

say "════ Docker ════"
if ! command -v docker >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get update -qq
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io curl >/dev/null
  elif command -v dnf >/dev/null 2>&1; then
    $SUDO dnf install -y -q docker curl
  else
    curl -fsSL https://get.docker.com | $SUDO sh
  fi
  $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
  say "✓ Docker поставлен"
fi
DK="$SUDO docker"
say "✓ $($DK version --format 'Docker {{.Server.Version}}')"

say "════ Каталог и ключи ════"
case "${SY_SETUP:-}" in *[!A-Za-z0-9_-]*) say "· код установки — только латиница, цифры, _ и -: беру случайный"; SY_SETUP="";; esac
$SUDO mkdir -p "$D/data" "$D/caddy"
$SUDO chown -R 1000:1000 "$D/data"
if ! $SUDO test -s "$D/.env"; then
  k() { openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
  CODE="${SY_SETUP:-$(k | cut -c1-12)}"
  printf 'APP_SECRET=%s\nSETUP_CODE=%s\n' "$(k)" "$CODE" | $SUDO tee "$D/.env" >/dev/null
  $SUDO chmod 600 "$D/.env"
  if [ -n "${SY_SETUP:-}" ]; then say "✓ ключи созданы, код установки — из секрета SYANIE_SETUP_CODE"
  else say "✓ ключи созданы, код установки — в $D/.env (SETUP_CODE), сюда не выводится"; fi
else
  say "✓ ключи на месте"
  # Код установки нужен только до первого входа; новый из секрета заменяет старый.
  if [ -n "${SY_SETUP:-}" ]; then $SUDO sed -i "s/^SETUP_CODE=.*/SETUP_CODE=$SY_SETUP/" "$D/.env"; fi
fi

say "════ Образы ════"
if [ -n "${GH_TOKEN:-}" ]; then printf '%s' "$GH_TOKEN" | $DK login ghcr.io -u "${GH_ACTOR:-x}" --password-stdin >/dev/null; fi
$DK pull -q "$SY_APP" >/dev/null && say "✓ сайт: ${SY_APP##*/}"
if [ -n "${SY_CADDY:-}" ] && [ "$FRONT" != "nginx" ] && [ "$FRONT" != "none" ]; then $DK pull -q "$SY_CADDY" >/dev/null && say "✓ HTTPS: ${SY_CADDY##*/}"; fi
$DK logout ghcr.io >/dev/null 2>&1 || true
$DK network inspect syanie >/dev/null 2>&1 || $DK network create syanie >/dev/null

say "════ Сайт ════"
OLD="$($DK inspect -f '{{.Config.Image}}' syanie-app 2>/dev/null || true)"
run_app() {
  $DK rm -f syanie-app >/dev/null 2>&1 || true
  $DK run -d --name syanie-app --restart unless-stopped --network syanie \
    --memory 512m --memory-swap 512m --cpus 1 \
    -p 127.0.0.1:3000:3000 --env-file "$D/.env" \
    -e DOMAIN="$SY_DOMAIN" -e TRUST_PROXY=1 -e COMMIT="${SY_COMMIT:-}" \
    -v "$D/data:/data" --log-opt max-size=20m --log-opt max-file=3 \
    "$1" >/dev/null
}
health() { curl -s --max-time 3 http://127.0.0.1:3000/api/health 2>/dev/null || true; }
run_app "$SY_APP"
OK=0
for _ in $(seq 1 30); do
  if health | grep -q "\"commit\":\"${SY_COMMIT:-}\""; then OK=1; break; fi
  sleep 2
done
if [ "$OK" != 1 ]; then
  say "✗ сайт не поднялся за минуту, последние строки:"
  $DK logs --tail 40 syanie-app 2>&1 | sed 's/^/  /'
  if [ -n "$OLD" ] && [ "$OLD" != "$SY_APP" ]; then run_app "$OLD" && say "↩ вернул прошлый образ: ${OLD##*/}"; fi
  exit 1
fi
say "✓ сайт отвечает: $(health)"

say "════ HTTPS ════"
busy() { (ss -ltnH "sport = :$1" 2>/dev/null || netstat -ltn 2>/dev/null | grep ":$1 ") | grep -q .; }
CADDY_UP="$($DK ps -q -f name=^syanie-caddy$)"
if [ "$FRONT" = auto ]; then
  if [ -n "$CADDY_UP" ] || { ! busy 80 && ! busy 443; }; then FRONT=caddy
  elif command -v nginx >/dev/null 2>&1; then FRONT=nginx
  else FRONT=none; fi
fi
case "$FRONT" in
  caddy)
    [ -n "${SY_CADDY:-}" ] || { say "✗ нет образа Caddy"; exit 1; }
    if [ -n "$CADDY_UP" ] && [ "$($DK inspect -f '{{.Config.Image}}' syanie-caddy 2>/dev/null || true)" = "$SY_CADDY" ]; then
      say "✓ Caddy тот же, не трогаю"
    else
      $DK rm -f syanie-caddy >/dev/null 2>&1 || true
      $DK run -d --name syanie-caddy --restart unless-stopped --network syanie \
        --memory 128m --cpus 0.5 -p 80:80 -p 443:443 -p 443:443/udp \
        -e DOMAIN="$SY_DOMAIN" -v "$D/caddy:/data" \
        --log-opt max-size=10m --log-opt max-file=3 "$SY_CADDY" >/dev/null
      say "✓ Caddy на 80/443, сертификат для $SY_DOMAIN получит сам"
    fi
    ;;
  nginx)
    F=/etc/nginx/conf.d/syanie.conf
    if ! $SUDO test -f "$F" || ! $SUDO grep -q "server_name $SY_DOMAIN;" "$F"; then
      $SUDO tee "$F" >/dev/null <<NGX
# Сайт «Сияние Севера»: контейнер syanie-app на 127.0.0.1:3000 (syanie-app.yml).
server {
    listen 80;
    server_name $SY_DOMAIN;
    client_max_body_size 4m;
    gzip on; gzip_types text/css application/javascript text/javascript application/json image/svg+xml;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
NGX
      if $SUDO nginx -t >/dev/null 2>&1; then $SUDO systemctl reload nginx; say "✓ nginx: $F"
      else $SUDO rm -f "$F"; say "✗ nginx -t не прошёл, файл убран"; exit 1; fi
      if command -v certbot >/dev/null 2>&1; then
        $SUDO certbot --nginx -d "$SY_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect >/dev/null 2>&1 \
          && say "✓ сертификат certbot" || say "· certbot не смог: проверьте, что домен смотрит на этот сервер"
      else say "· certbot нет: HTTPS поставьте в nginx сами (Telegram и Wazzup работают только по HTTPS)"; fi
    else say "✓ nginx уже ведёт $SY_DOMAIN на сайт"; fi
    ;;
  none) say "· 80/443 заняты не nginx: сайт на 127.0.0.1:3000, подключите его к своему веб-серверу" ;;
esac

say "════ Проверка снаружи ════"
sleep 3
IP="$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || true)"
DNS="$(getent hosts "$SY_DOMAIN" | awk '{print $1}' | head -1 || true)"
say "IP сервера: ${IP:-?} · $SY_DOMAIN смотрит на: ${DNS:-нет записи}"
say "https://$SY_DOMAIN/api/health → $(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$SY_DOMAIN/api/health" || true)"
FIRST="$(curl -s --max-time 3 http://127.0.0.1:3000/api/admin/state | grep -c '"setup":true' || true)"
[ "$FIRST" = 1 ] && say "· владелец ещё не заведён: https://$SY_DOMAIN/admin → «Первый вход» с кодом установки"

say "════ Уборка ════"
# Остаётся текущий образ и один прошлый — для отката.
for IMG in "$SY_APP" "${SY_CADDY:-}"; do
  [ -n "$IMG" ] || continue
  $DK images "${IMG%:*}" --format '{{.Repository}}:{{.Tag}}' | grep -vx "$IMG" | tail -n +2 | xargs -r $DK rmi >/dev/null 2>&1 || true
done
$DK stats --no-stream --format '{{.Name}} {{.MemUsage}} {{.CPUPerc}}' syanie-app $([ "$FRONT" = caddy ] && echo syanie-caddy) || true
say "✓ готово: $SY_COMMIT"
