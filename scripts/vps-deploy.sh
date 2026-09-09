#!/usr/bin/env bash
#
# Разворачивает текущую ветку на VPS. Запускается GitHub Action по SSH, но
# работает и руками: ssh на сервер, затем /opt/devuz/scripts/vps-deploy.sh
#
# Скрипт намеренно не создаёт .env. Секреты живут на сервере и переживают
# любой деплой: положить их в репозиторий или генерировать при выкатке
# означало бы однажды перезаписать боевые ключи.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/devuz}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "▸ Забираем $BRANCH"
git fetch --depth 1 origin "$BRANCH"
git reset --hard "origin/$BRANCH"

if [ ! -f .env ]; then
  echo "✗ Нет $APP_DIR/.env — без него контейнер поднимется без ключей." >&2
  echo "  Возьмите за образец .env.example и заполните на сервере." >&2
  exit 1
fi

# Хеш коммита уезжает в образ, чтобы /api/health показывал, что именно
# сейчас крутится на сервере. Без этого «я же выкатил» невозможно проверить.
GIT_COMMIT="$(git rev-parse --short HEAD)"
export GIT_COMMIT
grep -q '^GIT_COMMIT=' .env && sed -i "s/^GIT_COMMIT=.*/GIT_COMMIT=$GIT_COMMIT/" .env || echo "GIT_COMMIT=$GIT_COMMIT" >> .env

# Системные юниты ставятся отсюда, а не руками: иначе они существуют только на
# том сервере, где кто-то однажды выполнил cp, и правка таймера в репозитории
# ни на что не влияет. Шаг идемпотентный — сравнивает и трогает systemd только
# когда файл реально изменился.
install_unit() {
  local src="$APP_DIR/deploy/$1" dst="/etc/systemd/system/$1"
  [ -f "$src" ] || return 0
  if ! cmp -s "$src" "$dst"; then
    cp "$src" "$dst"
    echo "  · $1 обновлён"
    UNITS_CHANGED=1
  fi
}

UNITS_CHANGED=0
if [ -d "$APP_DIR/deploy" ] && [ "$(id -u)" = "0" ]; then
  echo "▸ Системные юниты"
  install_unit devuz-backup.service
  install_unit devuz-backup.timer
  install_unit devuz-reminders.service
  install_unit devuz-reminders.timer
  # daemon-reload нужен только когда файл юнита изменился.
  [ "$UNITS_CHANGED" = "1" ] && systemctl daemon-reload

  # А вот включение таймеров проверяется на КАЖДОЙ выкатке, а не только
  # когда изменились файлы юнитов. Раньше оно было вложено в проверку
  # UNITS_CHANGED, и получалась ловушка ровно на обычном порядке действий:
  #
  #   1. выкатка ставит юниты (UNITS_CHANGED=1), но переменной ещё нет —
  #      таймер не включается, в вывод уходит предупреждение;
  #   2. владелец дописывает переменную в .env;
  #   3. следующая выкатка не меняет файлы юнитов (UNITS_CHANGED=0) —
  #      и блок включения не выполняется вовсе.
  #
  # Итог: таймер не включается никогда, притом что переменная задана и
  # предупреждений больше нет. Бэкапы молча не делаются.
  #
  # systemctl enable --now на уже включённом активном таймере — пустая
  # операция, так что выполнять это каждый раз безопасно.

  # Без строки подключения бэкап падал бы каждую ночь и писал в journal,
  # создавая видимость работающей защиты там, где её нет.
  if grep -q '^SUPABASE_DB_URL=.\+' "$APP_DIR/.env"; then
    systemctl enable --now devuz-backup.timer >/dev/null 2>&1
    echo "  · таймер бэкапов включён"
  else
    echo "  · SUPABASE_DB_URL не задан — таймер бэкапов не включаю" >&2
  fi

  # Та же логика: без секрета свип получает 403 каждые пять минут и
  # засоряет journal, создавая видимость работающей рассылки.
  if grep -q '^REMINDER_SWEEP_SECRET=.\+' "$APP_DIR/.env"; then
    systemctl enable --now devuz-reminders.timer >/dev/null 2>&1
    echo "  · таймер напоминаний включён"
  else
    echo "  · REMINDER_SWEEP_SECRET не задан — таймер напоминаний не включаю" >&2
  fi
fi

echo "▸ Собираем и перезапускаем ($GIT_COMMIT)"
docker compose up -d --build --remove-orphans

echo "▸ Ждём, пока приложение отзовётся"
for i in $(seq 1 30); do
  if docker compose exec -T web node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "✓ Готово: $GIT_COMMIT"
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

echo "✗ Приложение не поднялось за минуту. Логи:" >&2
docker compose logs --tail 60 web >&2
exit 1
