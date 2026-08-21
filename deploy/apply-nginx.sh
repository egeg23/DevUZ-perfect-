#!/usr/bin/env bash
#
# Ставит конфиг nginx для devuz.maximov-tech.ru и перезагружает его.
#
# Смысл скрипта не в экономии символов, а в двух вещах, которые руками легко
# сделать неправильно:
#
# 1. Сертификат. certbot дописывает ssl_certificate прямо в рабочий файл, а в
#    репозитории на этом месте комментарий. Простой `cp` затирает пути к
#    сертификату — nginx не стартует, сайт ложится. Скрипт вынимает эти строки
#    из действующего конфига и переносит в новый.
# 2. Откат. Если nginx -t не проходит, старый файл возвращается на место, и
#    ничего не перезагружается. Сломать работающий сайт этим скриптом нельзя.

set -euo pipefail

DOMAIN="devuz.maximov-tech.ru"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx-devuz.conf"
DST="/etc/nginx/sites-available/${DOMAIN}"
LINK="/etc/nginx/sites-enabled/${DOMAIN}"
BACKUP="${DST}.bak.$(date +%Y%m%d-%H%M%S)"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { red "Нужен root: sudo bash deploy/apply-nginx.sh"; exit 1; }
[ -f "$SRC" ] || { red "Не найден $SRC — вы точно в каталоге проекта?"; exit 1; }

TMP="$(mktemp)"
cp "$SRC" "$TMP"

# ── Переносим строки сертификата из действующего конфига ────────────────────
if [ -f "$DST" ]; then
  cp "$DST" "$BACKUP"
  echo "Старый конфиг сохранён: $BACKUP"

  CERTS="$(grep -E '^\s*(ssl_certificate|ssl_certificate_key|ssl_trusted_certificate|include .*options-ssl-nginx|ssl_dhparam)' "$DST" || true)"
  if [ -n "$CERTS" ]; then
    # Подставляем на место комментария-заглушки. Строки передаём переменной
    # окружения, а не подстановкой в текст скрипта: путь с кавычкой или
    # обратным слэшем иначе сломал бы разбор.
    CERTS="$CERTS" python3 - "$TMP" <<'PY'
import io, os, sys
p = sys.argv[1]
s = io.open(p, encoding="utf-8").read()
anchor = "    # ssl_certificate и ssl_certificate_key сюда допишет certbot."
certs = os.environ["CERTS"].rstrip()
if anchor in s:
    io.open(p, "w", encoding="utf-8").write(s.replace(anchor, certs))
    print("Строки сертификата перенесены из действующего конфига.")
else:
    print("ВНИМАНИЕ: не нашёл место для сертификата, проверьте файл руками.")
PY
  else
    red "В действующем конфиге нет строк ssl_certificate."
    red "Если сертификат уже выпущен — после установки запустите:"
    red "  certbot --nginx -d ${DOMAIN}"
  fi
else
  echo "Действующего конфига нет — ставим впервые."
fi

# ── Ставим и проверяем ──────────────────────────────────────────────────────
install -m 0644 "$TMP" "$DST"
rm -f "$TMP"
ln -sfn "$DST" "$LINK"

echo
echo "Проверяю конфигурацию…"
if nginx -t; then
  systemctl reload nginx
  green "Готово: конфиг применён, nginx перезагружен."
else
  echo
  red "nginx -t не прошёл — ничего не перезагружаю."
  if [ -f "$BACKUP" ]; then
    cp "$BACKUP" "$DST"
    red "Старый конфиг возвращён на место, сайт работает как работал."
  fi
  echo
  echo "Если ошибка была «limit_req_zone directive is not allowed here» —"
  echo "перенесите четыре строки limit_*_zone из начала файла"
  echo "в /etc/nginx/nginx.conf внутрь блока http { }."
  exit 1
fi
