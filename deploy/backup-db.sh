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
