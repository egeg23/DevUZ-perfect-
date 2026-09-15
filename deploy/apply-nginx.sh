#!/usr/bin/env bash
#
# Ставит конфиг nginx для devuz.studio и перезагружает его.
#
# Смысл скрипта не в экономии символов, а в трёх вещах, которые руками легко
# сделать неправильно:
#
# 1. Сертификат. certbot дописывает ssl_certificate прямо в рабочий файл, а в
#    репозитории на этом месте комментарий. Простой `cp` затирает пути к
#    сертификату — nginx не стартует, сайт ложится. Скрипт вынимает эти строки
#    из действующего конфига и переносит в новый.
#    Теперь блоков с сертификатом два — канонический и редирект неканонических
#    имён, — и строки переносятся в оба. Блок `listen 443 ssl` без
#    ssl_certificate не проходит nginx -t вовсе, так что вариант «перенесу в
#    первый, второй подождёт certbot» не работает: сайт не поднимется.
# 2. Старое имя файла. До переезда конфиг лежал под именем старого домена.
#    Оставить его включённым значит получить два server-блока, спорящих за
#    devuz.maximov-tech.ru: nginx возьмёт первый попавшийся, и редирект на
#    новый домен молча не сработает. Скрипт снимает старую ссылку.
# 3. Откат. Если nginx -t не проходит, старый файл возвращается на место, и
#    ничего не перезагружается. Сломать работающий сайт этим скриптом нельзя.

set -euo pipefail

DOMAIN="devuz.studio"
# Имя, под которым конфиг лежал до переезда. Нужно, чтобы забрать из него
# сертификат и снять его с публикации.
LEGACY="devuz.maximov-tech.ru"
# Все имена сайта — для подсказки про certbot. Канонический первым: certbot
# делает первым -d основным именем сертификата.
NAMES=(devuz.studio www.devuz.studio devuz.work www.devuz.work devuz.maximov-tech.ru)
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx-devuz.conf"
DST="/etc/nginx/sites-available/${DOMAIN}"
LINK="/etc/nginx/sites-enabled/${DOMAIN}"
LEGACY_DST="/etc/nginx/sites-available/${LEGACY}"
LEGACY_LINK="/etc/nginx/sites-enabled/${LEGACY}"
BACKUP="${DST}.bak.$(date +%Y%m%d-%H%M%S)"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { red "Нужен root: sudo bash deploy/apply-nginx.sh"; exit 1; }
[ -f "$SRC" ] || { red "Не найден $SRC — вы точно в каталоге проекта?"; exit 1; }

TMP="$(mktemp)"
cp "$SRC" "$TMP"

# ── Переносим строки сертификата из действующего конфига ────────────────────
# После переезда файл сменил имя, поэтому источником может быть и старый: на
# первом запуске нового скрипта $DST ещё не существует, а сертификат уже есть.
CERT_SRC=""
[ -f "$LEGACY_DST" ] && CERT_SRC="$LEGACY_DST"
[ -f "$DST" ] && CERT_SRC="$DST"

if [ -n "$CERT_SRC" ]; then
  cp "$CERT_SRC" "$BACKUP"
  echo "Старый конфиг сохранён: $BACKUP"

  CERTS="$(grep -E '^\s*(ssl_certificate|ssl_certificate_key|ssl_trusted_certificate|include .*options-ssl-nginx|ssl_dhparam)' "$CERT_SRC" | sort -u || true)"
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
# replace без счётчика заменяет ВСЕ вхождения, и это здесь обязательно:
# блоков с ssl два, и блок без сертификата не проходит nginx -t.
found = s.count(anchor)
if found:
    io.open(p, "w", encoding="utf-8").write(s.replace(anchor, certs))
    print(f"Строки сертификата перенесены в {found} блок(а).")
else:
    print("ВНИМАНИЕ: не нашёл место для сертификата, проверьте файл руками.")
PY
  else
    red "В действующем конфиге нет строк ssl_certificate."
    red "Если сертификат уже выпущен — после установки запустите:"
    red "  certbot --nginx ${NAMES[*]/#/-d }"
  fi
else
  echo "Действующего конфига нет — ставим впервые."
fi

# ── Ставим и проверяем ──────────────────────────────────────────────────────
install -m 0644 "$TMP" "$DST"
rm -f "$TMP"
ln -sfn "$DST" "$LINK"

# Старое имя файла снимаем с публикации: два блока на один server_name
# означают, что nginx возьмёт первый попавшийся и редирект на новый домен
# молча не сработает. Сам файл остаётся в sites-available как запасной.
#
# Снимаем ДО проверки, а не после: nginx -t должен проверить ровно тот набор
# файлов, который потом и перечитает. Поэтому же откат ниже возвращает
# ссылку на место — иначе неудачная проверка оставляла бы сервер с меньшим
# набором сайтов, чем было до запуска скрипта.
LEGACY_UNLINKED=0
if [ -L "$LEGACY_LINK" ] && [ "$LEGACY_LINK" != "$LINK" ]; then
  rm -f "$LEGACY_LINK"
  LEGACY_UNLINKED=1
  echo "Старая ссылка снята: $LEGACY_LINK (файл остался в sites-available)"
fi

echo
echo "Проверяю конфигурацию…"
if nginx -t; then
  systemctl reload nginx
  green "Готово: конфиг применён, nginx перезагружен."
  echo
  echo "Дальше — сертификат на все имена (старый покрывает только одно):"
  echo "  certbot --nginx ${NAMES[*]/#/-d }"
else
  echo
  red "nginx -t не прошёл — ничего не перезагружаю."
  if [ "$LEGACY_UNLINKED" = "1" ] && [ -f "$LEGACY_DST" ]; then
    ln -sfn "$LEGACY_DST" "$LEGACY_LINK"
    red "Старая ссылка возвращена: $LEGACY_LINK"
  fi
  if [ -f "$BACKUP" ]; then
    cp "$BACKUP" "$DST"
    red "Старый конфиг возвращён на место, сайт работает как работал."
  fi
  echo
  echo "Если ошибка была «limit_req_zone directive is not allowed here» —"
  echo "перенесите четыре строки limit_*_zone из начала файла"
  echo "в /etc/nginx/nginx.conf внутрь блока http { }."
  echo
  echo "Если «unknown directive \"http2\"» — конфиг новее nginx на сервере."
  echo "Версия: $(nginx -v 2>&1). Отдельная директива http2 появилась в 1.25.1;"
  echo "в конфиге репозитория используется форма listen ... http2, понятная обеим."
  exit 1
fi
