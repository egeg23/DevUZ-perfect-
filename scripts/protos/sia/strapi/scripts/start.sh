#!/bin/sh
# Запуск в контейнере: база и загрузки лежат в томах сервера (/app/.tmp и
# /app/public/uploads) и переживают обновление образа. Пока первое наполнение
# не дошло до конца (нет метки .seeded), база считается пустой: прерванное
# наполнение начинается заново, а не оставляет панель наполовину пустой.
set -e
mkdir -p /app/.tmp /app/public/uploads
if [ ! -f /app/.tmp/.seeded ]; then
  echo "Первый запуск: наполняю панель проектами бюро"
  rm -f "/app/$DATABASE_FILENAME"
  find /app/public/uploads -mindepth 1 ! -name .gitkeep -delete
  node scripts/seed.js
  touch /app/.tmp/.seeded
fi
exec node node_modules/@strapi/strapi/bin/strapi.js start
