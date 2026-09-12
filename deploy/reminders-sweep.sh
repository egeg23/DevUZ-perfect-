#!/usr/bin/env bash
# Отправка созревших напоминаний по лидам.
#
# Секрет читается из .env тем же способом, что и в backup-db.sh: скрипт
# работает на хосте, а не внутри контейнера, и переменных окружения
# приложения не видит.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/devuz}"
ENV_FILE="$APP_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "нет $ENV_FILE" >&2
  exit 1
fi

# `|| true` обязателен: при set -o pipefail конвейер возвращает код grep,
# и если строки в .env нет, присваивание падает — вместе со всем скриптом,
# молча и до того, как сработает проверка ниже с человеческим объяснением.
SECRET="$(grep -E '^REMINDER_SWEEP_SECRET=' "$ENV_FILE" | cut -d= -f2- || true)"
if [[ -z "${SECRET:-}" ]]; then
  echo "в $ENV_FILE нет REMINDER_SWEEP_SECRET — напоминания не рассылаются" >&2
  exit 1
fi

PORT="$(grep -E '^APP_PORT=' "$ENV_FILE" | cut -d= -f2- || true)"
PORT="${PORT:-3310}"

# Идём на localhost, а не через домен: это тот же контейнер, и лишний круг
# через nginx и TLS ничего не даёт, кроме ещё одной точки отказа.
curl --fail --silent --show-error --max-time 60 \
  -X POST "http://127.0.0.1:${PORT}/api/reminders/sweep" \
  -H "x-devuz-sweep: ${SECRET}"
echo
