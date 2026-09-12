#!/usr/bin/env bash
# Применяет миграции базы из репозитория.
#
# Зачем скрипт, если есть SQL-редактор Supabase: копирование стало отдельным
# источником ошибок. Длинный SQL с комментариями выделяют руками, с телефона,
# в прокручиваемом блоке — и в базу приезжает то адрес файла вместо его
# содержимого, то текст без ведущих «--», после чего комментарий становится
# командой. Здесь копировать нечего: файлы уже лежат на сервере, их кладёт
# каждая выкатка.
#
# Все миграции проекта идемпотентны: create ... if not exists, add column if
# not exists, drop trigger if exists перед create trigger. Поэтому скрипт
# спокойно прогоняет их все подряд, а не пытается угадать непримененные —
# повторный прогон ничего не меняет и ничего не ломает.
#
# Запуск:  sudo bash /opt/devuz/deploy/apply-migrations.sh
# Одну:    sudo bash /opt/devuz/deploy/apply-migrations.sh 0013_store_delivery.sql
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/devuz}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
DIR="$APP_DIR/supabase/migrations"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "нет $ENV_FILE" >&2
  exit 1
fi

# Та же строка подключения, что у ночных копий: Session pooler из настроек
# проекта Supabase. В git она не попадает.
# `|| true` обязателен: при set -o pipefail конвейер возвращает код grep,
# и если строки в .env нет, присваивание падает — вместе со всем скриптом,
# молча и до того, как сработает проверка ниже с человеческим объяснением.
SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' "$ENV_FILE" | cut -d= -f2- || true)"
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  cat >&2 <<'MSG'
В .env нет SUPABASE_DB_URL — без него скрипту некуда подключаться.

Возьмите её в Supabase: Project Settings → Database → Connection string →
Session pooler, и добавьте строкой в /opt/devuz/.env:

  SUPABASE_DB_URL=postgresql://postgres.xxxx:ПАРОЛЬ@aws-0-...:5432/postgres

MSG
  exit 1
fi

if [[ ! -d "$DIR" ]]; then
  echo "нет каталога $DIR — обновите код: cd $APP_DIR && git pull" >&2
  exit 1
fi

# Какие файлы применяем: либо названные аргументами, либо все по порядку.
# Откаты (*.down.sql) не трогаем никогда — их запускают руками и осознанно.
if (( $# > 0 )); then
  FILES=()
  for name in "$@"; do
    if [[ "$name" == *".down.sql" ]]; then
      echo "✗ $name — это откат, автоматически такое не применяем" >&2
      exit 1
    fi
    [[ -f "$DIR/$name" ]] || { echo "✗ нет $DIR/$name" >&2; exit 1; }
    FILES+=("$name")
  done
else
  mapfile -t FILES < <(cd "$DIR" && ls *.sql 2>/dev/null | grep -v '\.down\.sql$' | sort)
fi

(( ${#FILES[@]} )) || { echo "нечего применять" >&2; exit 1; }

# psql на хосте может не быть — на этом сервере он и не нужен ни для чего
# другого. Docker есть по определению: в нём крутится само приложение.
#
# Версия клиента здесь, в отличие от pg_dump, роли не играет: psql просто
# выполняет текст, формат дампа ни при чём.
if command -v psql >/dev/null 2>&1; then
  run() { PGURL="$SUPABASE_DB_URL" psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$DIR/$1"; }
elif command -v docker >/dev/null 2>&1; then
  echo "▸ psql на хосте нет — беру из образа postgres:17"
  # Строка подключения уходит переменной окружения, а не аргументом:
  # аргументы видны в списке процессов всей машины, переменные — только
  # владельцу процесса.
  run() {
    docker run --rm -e PGURL="$SUPABASE_DB_URL" -v "$DIR:/migrations:ro" postgres:17 \
      sh -c 'exec psql "$PGURL" -v ON_ERROR_STOP=1 -f "/migrations/$1"' sh "$1"
  }
else
  echo "✗ нет ни psql, ни docker — применить миграции нечем" >&2
  exit 1
fi

echo "▸ Применяю ${#FILES[@]} файл(ов) из $DIR"
echo

for name in "${FILES[@]}"; do
  printf '  %-34s ' "$name"
  # Вывод прячем, пока всё хорошо: успешная миграция печатает десяток
  # строк вида ALTER TABLE, и на двенадцати файлах это стена текста, в
  # которой не видно единственной важной строки — ошибки.
  if out="$(run "$name" 2>&1)"; then
    echo "ок"
  else
    echo "ОШИБКА"
    echo
    echo "$out" >&2
    echo >&2
    echo "✗ Остановился на $name. Предыдущие файлы применены." >&2
    exit 1
  fi
done

echo
echo "✓ Готово. Все миграции применены."
echo "  Проверить: откройте /admin/releases — плашки про выдачу быть не должно,"
echo "  если задан DOWNLOAD_SIGNING_SECRET."
