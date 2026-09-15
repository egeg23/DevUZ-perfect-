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

# Прокси из .env — для приложения, а не для выкатки.
#
# В контейнер он попадает через docker-compose, который читает тот же .env
# сам; скрипту он не нужен и только мешает. GitHub, реестр npm и Docker Hub
# с этого сервера открываются напрямую, а через внешний прокси GitHub
# отвечает 403 — и выкатка падает на первой же строке, сообщая про доступ к
# репозиторию.
#
# Ловушка срабатывает не всегда, а только когда скрипт запускают руками:
# Action заходит по ssh в чистую оболочку, а человек перед этим выполняет
# «set -a; . /opt/devuz/.env; set +a», чтобы поработать со скаутом, — и те
# же переменные достаются git. Отсюда «у меня падает, а из Action едет».
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY https_proxy http_proxy all_proxy

# Скрипт обновляет сам себя, и без перезапуска это ломается двумя способами.
#
# Первый заметили на выкатке админки. GitHub Action запускает
# /opt/devuz/scripts/vps-deploy.sh — тот, что уже лежит на сервере. Он
# забирает новый код, но продолжает выполнять СВОЮ, старую логику. То есть
# любое изменение самого скрипта применяется только со следующей выкатки, и
# понять это по логу невозможно: он выглядит успешным. Так и вышло — новые
# юниты systemd не установились, потому что старая версия про них не знала.
#
# Второй хуже и до сих пор не выстрелил только по везению. bash читает скрипт
# не целиком, а по мере выполнения, запоминая смещение в файле. git reset
# --hard подменяет файл под ним, и дальше bash читает со старого смещения в
# новом содержимом — то есть с середины произвольной строки.
#
# Поэтому: забрали код и сразу передали управление свежей копии. Переменная
# не даёт зациклиться.
if [ -z "${DEVUZ_DEPLOY_REEXEC:-}" ]; then
  echo "▸ Забираем $BRANCH"
  git fetch --depth 1 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"

  export DEVUZ_DEPLOY_REEXEC=1
  exec bash "$APP_DIR/scripts/vps-deploy.sh"
fi

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
  install_unit devuz-scout.service
  install_unit devuz-bot.service
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

  # Скаут — долгоживущий слушатель, а не задача по расписанию. Включается
  # только когда есть и строка сессии, и список чатов: без любого из двух он
  # падал бы каждые тридцать секунд и засорял journal.
  #
  # Зависимости ставятся здесь же: у скаута свой package.json, чтобы сайту
  # не достались его пакеты.
  if grep -q '^SCOUT_SESSION=.\+' "$APP_DIR/.env" && grep -q '^SCOUT_CHATS=.\+' "$APP_DIR/.env"; then
    SCOUT_READY=1

    if [ -d "$APP_DIR/scout" ]; then
      ( cd "$APP_DIR/scout" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 ) \
        || { echo "  · зависимости скаута не поставились" >&2; SCOUT_READY=0; }
    fi

    # И зависимости сайта — на хост, а не только в образ.
    #
    # Скаут берёт отсев, разбор и запись из lib/, то есть из кода сайта, а тот
    # импортирует @anthropic-ai/sdk и @supabase/supabase-js. Node ищет пакет
    # от файла, который его импортирует: для /opt/devuz/lib/… это
    # /opt/devuz/node_modules — scout/node_modules он не увидит, сколько туда
    # ни клади. Сайт собирается внутри образа, поэтому на хосте этой папки
    # не было вовсе, и скаут падал бы на первом же импорте, уходя в
    # перезапуск каждые тридцать секунд.
    #
    # ci, а не install: воспроизводимо и не переписывает package-lock, который
    # следующая выкатка всё равно снесёт через git reset. Условие — чтобы не
    # платить полторы минуты за переустановку на каждой выкатке: lock новее
    # папки бывает только тогда, когда он изменился.
    if [ ! -d "$APP_DIR/node_modules" ] || [ "$APP_DIR/package-lock.json" -nt "$APP_DIR/node_modules" ]; then
      echo "  · ставлю зависимости сайта на хост — без них скаут не запускается"
      ( cd "$APP_DIR" && npm ci --omit=dev --no-audit --no-fund >/dev/null 2>&1 ) \
        || { echo "  · не поставились — скаут не запускаю" >&2; SCOUT_READY=0; }
    fi

    if [ "$SCOUT_READY" = "1" ]; then
      systemctl enable --now devuz-scout.service >/dev/null 2>&1
      systemctl restart devuz-scout.service >/dev/null 2>&1
      echo "  · скаут запущен"
    fi
  else
    echo "  · SCOUT_SESSION или SCOUT_CHATS не заданы — скаут не запускаю" >&2
  fi

  # Бот забирает обновления у Telegram сам, через тот же прокси, что и скаут:
  # входящие соединения от Telegram к этому серверу рвутся, и вебхук
  # доставлял /login с опозданием в минуты. Нужны токен и общий с
  # приложением секрет. Перезапуск на каждой выкатке — как у скаута.
  if grep -q '^TELEGRAM_BOT_TOKEN=.\+' "$APP_DIR/.env" && grep -q '^TELEGRAM_WEBHOOK_SECRET=.\+' "$APP_DIR/.env"; then
    systemctl enable --now devuz-bot.service >/dev/null 2>&1
    systemctl restart devuz-bot.service >/dev/null 2>&1
    echo "  · бот забирает обновления сам"
  else
    echo "  · TELEGRAM_BOT_TOKEN или TELEGRAM_WEBHOOK_SECRET не заданы — бот не запускаю" >&2
  fi
fi

echo "▸ Собираем образ ($GIT_COMMIT)"

# Сборка — самое тяжёлое, что здесь происходит: npm ci и next build на пару
# минут забирают весь процессор, и работающий сайт вместе с ботом отвечает
# с опозданием. Telegram ждёт от вебхука считаные секунды; не дождавшись,
# откладывает доставку на минуты — так /login «висел» после каждой выкатки,
# а в getWebhookInfo стояло «Connection timed out» ровно временем сборки.
#
# Поэтому образ собирается с пониженным приоритетом. cpu-shares действуют
# только при нехватке процессора и отдают его тому, кто уже обслуживает
# людей (у контейнера по умолчанию 1024). Компоуз такого флага не умеет —
# собираем сами, а поднимаем уже готовый образ.
#
# Аргументы сборки берутся из .env по одному, а не через source: тот же файл
# несёт HTTPS_PROXY, и docker build передал бы его внутрь сборки как
# build-arg — npm ci пошёл бы через прокси скаута.
envval() {
  grep -m1 "^$1=" "$APP_DIR/.env" | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}
docker build \
  --cpu-shares 128 \
  --build-arg "NEXT_PUBLIC_SITE_URL=$(envval NEXT_PUBLIC_SITE_URL)" \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=$(envval NEXT_PUBLIC_SUPABASE_URL)" \
  --build-arg "NEXT_PUBLIC_YANDEX_METRIKA_ID=$(envval NEXT_PUBLIC_YANDEX_METRIKA_ID)" \
  --build-arg "NEXT_PUBLIC_GA_ID=$(envval NEXT_PUBLIC_GA_ID)" \
  --build-arg "GIT_COMMIT=$GIT_COMMIT" \
  -t devuz:latest "$APP_DIR"

echo "▸ Перезапускаем ($GIT_COMMIT)"
# Без --build: образ уже собран выше. Компоуз сравнит его с тем, на котором
# работает контейнер, и пересоздаст контейнер только если образ новый.
docker compose up -d --no-build --remove-orphans

echo "▸ Ждём, пока приложение отзовётся"
for i in $(seq 1 30); do
  if docker compose exec -T web node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "✓ Готово: $GIT_COMMIT"

    # Меню команд бота — при каждой выкатке, тем же секретом, что и свип:
    # без меню человек не узнает ни про /ref, ни про /payout.
    SWEEP_SECRET="$(envval REMINDER_SWEEP_SECRET)"
    APP_PORT_VALUE="$(envval APP_PORT)"
    if [ -n "$SWEEP_SECRET" ]; then
      if curl --silent --show-error --max-time 60 -X POST \
        "http://127.0.0.1:${APP_PORT_VALUE:-3310}/api/telegram/menu" \
        -H "x-devuz-sweep: ${SWEEP_SECRET}" >/dev/null; then
        echo "  · меню бота обновлено"
      else
        echo "  · меню бота не обновилось — проверьте TELEGRAM_BOT_TOKEN" >&2
      fi

      # Пинг IndexNow — тем же секретом и с того же сервера. Зовём приложение,
      # а не скрипт на хосте: INDEXNOW_KEY лежит в окружении контейнера, и
      # тянуть его наружу ради одного запроса значило бы завести второе место,
      # где он хранится.
      #
      # Это Bing и Яндекс. Google протокол не поддерживает — туда страницы
      # попадают через sitemap.xml, который он перечитывает сам.
      #
      # Пинг не влияет на успех выкатки: сайт уже работает, и падать из-за
      # недоступного чужого сервиса ему незачем.
      #
      # Ответ печатается целиком, а не сводится к «уведомлены». Без ключа
      # маршрут отвечает успехом и ничего не отправляет — и строка про
      # уведомлённых Bing и Яндекс была бы враньём, которое некому заметить.
      # Ключа в ответе нет, печатать его безопасно.
      if INDEXNOW_OUT="$(curl --silent --show-error --max-time 90 -X POST \
        "http://127.0.0.1:${APP_PORT_VALUE:-3310}/api/indexnow" \
        -H "x-devuz-sweep: ${SWEEP_SECRET}")"; then
        case "$INDEXNOW_OUT" in
          *'"skipped"'*)
            echo "  · INDEXNOW_KEY не задан — Bing и Яндекс не уведомлены" >&2 ;;
          *)
            echo "  · IndexNow: $INDEXNOW_OUT" ;;
        esac
      else
        echo "  · IndexNow не ответил — страницы дойдут плановым обходом" >&2
      fi
    fi

    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

echo "✗ Приложение не поднялось за минуту. Логи:" >&2
docker compose logs --tail 60 web >&2
exit 1
