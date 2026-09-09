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
SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' "$ENV_FILE" | cut -d= -f2-)"
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "в $ENV_FILE нет SUPABASE_DB_URL — возьмите строку Session pooler из настроек проекта Supabase" >&2
  exit 1
fi

# Версия клиента должна быть не старше сервера.
#
# pg_dump отказывается снимать копию с сервера новее себя — и отказывается
# правильно: формат дампа между мажорными версиями меняется. Ubuntu 22.04
# ставит клиент 14, Supabase крутит 17, и «apt install postgresql-client»
# даёт ровно эту пару. Проверено на живом сервере: копия не делалась ни
# разу, а таймер при этом отрабатывал каждую ночь.
#
# Проверяем до записи файла, чтобы не оставлять после себя .part и не
# заставлять читать сообщение pg_dump в journalctl. Если версию сервера
# выяснить не удалось — не мешаем: пусть говорит сам pg_dump.
SERVER_MAJOR="$(psql "$SUPABASE_DB_URL" -tAc 'show server_version' 2>/dev/null | cut -d. -f1 | tr -dc '0-9')"
DUMP_MAJOR="$(pg_dump --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"

if [[ -n "$SERVER_MAJOR" && -n "$DUMP_MAJOR" && "$DUMP_MAJOR" -lt "$SERVER_MAJOR" ]]; then
  CODENAME="$(. /etc/os-release 2>/dev/null && echo "${VERSION_CODENAME:-jammy}")"
  cat >&2 <<MSG
pg_dump версии $DUMP_MAJOR не снимет копию с сервера версии $SERVER_MAJOR.
Клиент из репозитория Ubuntu отстаёт от Supabase. Поставьте нужную версию:

  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    https://www.postgresql.org/media/keys/ACCC4CF8.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
https://apt.postgresql.org/pub/repos/apt ${CODENAME}-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt update && apt install -y postgresql-client-$SERVER_MAJOR

MSG
  exit 1
fi

mkdir -p "$DEST"
STAMP="$(date -u +%Y%m%d-%H%M)"
OUT="$DEST/devuz-$STAMP.sql.gz"

# --no-owner и --no-acl: восстанавливать будем в другой проект, где ролей с
# теми же именами нет, и падение на GRANT сделало бы копию бесполезной.
pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl --schema=public \
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
