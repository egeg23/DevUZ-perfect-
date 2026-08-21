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
