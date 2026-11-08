#!/usr/bin/env bash
# Graphify в каждой сессии разработки (владелец, 08.11.2026: «Установи брат
# и используем всегда»). Ставит CLI, если его нет, и строит карту кода в
# graphify-out/ в фоне — сессия не ждёт (~45 с с нуля, дальше по кэшу).
# Модели нет: только разбор кода (AST). Ошибка здесь сессию не ломает.
set -u
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
GRAPHIFY_VERSION="0.9.104"

if ! command -v graphify >/dev/null 2>&1; then
  pip install -q --disable-pip-version-check "graphifyy==${GRAPHIFY_VERSION}" >/dev/null 2>&1 \
    || pip install -q --break-system-packages "graphifyy==${GRAPHIFY_VERSION}" >/dev/null 2>&1 \
    || exit 0
fi

mkdir -p graphify-out
# Карта кода, потом — отдельная карта дизайна для макетов (design-graph.sh).
nohup bash -c 'graphify update . >graphify-out/.build.log 2>&1; bash .claude/hooks/design-graph.sh build' </dev/null >/dev/null 2>&1 &
exit 0
