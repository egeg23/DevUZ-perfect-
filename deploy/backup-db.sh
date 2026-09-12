#!/usr/bin/env bash
# Резервная копия базы лидов.
#
# Смысл не в аварии диска — база живёт в Supabase, у него своя надёжность.
# Смысл в том, что админка делает журнал аудита неизменяемым, а сообщения
# внутреннего чата неудаляемыми, чтобы они работали доказательством в споре
# с уходящим менеджером. Доказательство, существующее в одном экземпляре у
# той же стороны, что и спор, — не доказательство.
#
# Ставится таймером: deploy/devuz-backup.timer
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/devuz}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
ENV_FILE="${ENV_FILE:-/opt/devuz/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "нет $ENV_FILE" >&2
  exit 1
fi

# Строка подключения лежит рядом с остальными секретами и в git не попадает.
# shellcheck disable=SC1090
# `|| true` обязателен: при set -o pipefail конвейер возвращает код grep,
# и если строки в .env нет, присваивание падает — вместе со всем скриптом,
# молча и до того, как сработает проверка ниже с человеческим объяснением.
SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "в $ENV_FILE нет SUPABASE_DB_URL — возьмите строку Session pooler из настроек проекта Supabase" >&2
  exit 1
fi

# Версия клиента должна быть не старше сервера.
#
# pg_dump отказывается снимать копию с сервера новее себя — и отказывается
# правильно: формат дампа между мажорными версиями меняется. Ubuntu 22.04
# ставит клиент 14, Supabase крутит 17, и «apt install postgresql-client»
# даёт ровно эту пару. Найдено на живом сервере: копия не делалась ни разу.
#
# Если версию сервера выяснить не удалось — не мешаем: пусть говорит сам
# pg_dump.
SERVER_MAJOR="$(psql "$SUPABASE_DB_URL" -tAc 'show server_version' 2>/dev/null | cut -d. -f1 | tr -dc '0-9')"
DUMP_MAJOR="$(pg_dump --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"

# Строка подключения не ходит аргументом ни в одном из вариантов: аргументы
# видны в списке процессов всей машины, переменные окружения — только
# владельцу процесса. Снаружи в dump() передаются только флаги.
dump() { pg_dump "$SUPABASE_DB_URL" "$@"; }

if [[ -n "$SERVER_MAJOR" && -n "$DUMP_MAJOR" && "$DUMP_MAJOR" -lt "$SERVER_MAJOR" ]]; then
  # Клиент старый. Вместо того чтобы требовать возни с чужим apt-репозиторием
  # и его ключом — берём pg_dump нужной версии из образа. Docker на этом
  # сервере есть по определению: в нём же крутится само приложение.
  #
  # Строка подключения уходит переменной окружения, а не аргументом: аргументы
  # видны в списке процессов всей машины, переменные — только владельцу.
  if command -v docker >/dev/null 2>&1; then
    echo "клиент версии $DUMP_MAJOR старше сервера $SERVER_MAJOR — беру pg_dump из образа postgres:$SERVER_MAJOR" >&2
    dump() {
      # Флаги прокидываются внутрь, а не дублируются здесь: иначе правка на
      # вызывающей стороне молча не доехала бы до контейнерного пути, и
      # копии стали бы отличаться в зависимости от версии клиента на хосте.
      docker run --rm -e PGURL="$SUPABASE_DB_URL" "postgres:$SERVER_MAJOR" \
        sh -c 'exec pg_dump "$PGURL" "$@"' sh "$@"
    }
  else
    CODENAME="$(. /etc/os-release 2>/dev/null && echo "${VERSION_CODENAME:-jammy}")"
    cat >&2 <<MSG
pg_dump версии $DUMP_MAJOR не снимет копию с сервера версии $SERVER_MAJOR,
а docker, которым это можно обойти, на машине не найден.

Поставьте клиент нужной версии:

  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt ${CODENAME}-pgdg main" > /etc/apt/sources.list.d/pgdg.list
  apt update && apt install -y postgresql-client-$SERVER_MAJOR

MSG
    exit 1
  fi
fi

mkdir -p "$DEST"
STAMP="$(date -u +%Y%m%d-%H%M)"
OUT="$DEST/devuz-$STAMP.sql.gz"

# --no-owner и --no-acl: восстанавливать будем в другой проект, где ролей с
# теми же именами нет, и падение на GRANT сделало бы копию бесполезной.
dump --no-owner --no-acl --schema=public \
  | gzip -9 > "$OUT.part"
mv "$OUT.part" "$OUT"

# Проверяем, что получилось не пусто: gzip от упавшего pg_dump — это 20 байт
# валидного архива, и без проверки такая «копия» лежала бы месяцами.
SIZE="$(stat -c%s "$OUT")"
if (( SIZE < 4096 )); then
  echo "копия подозрительно мала: $SIZE байт" >&2
  exit 1
fi

find "$DEST" -name 'devuz-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
echo "готово: $OUT ($SIZE байт)"
