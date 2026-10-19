#!/usr/bin/env bash
# REA (Reverse Engineer Anything) — разбор программ в сессии Claude Code.
#
# REA (github.com/morluto/rea, MIT) — один MCP-сервер для обратной
# разработки: программы и библиотеки (через Ghidra), JavaScript и Electron,
# .NET, Android, прошивки, сайты, сетевые записи. Каждый вывод — с
# доказательствами и ограничениями.
#
# Запуск: bash scripts/rea/install.sh — можно звать сколько угодно раз,
# готовое пропускается. Инструменты REA появляются в сессии, которая
# началась после установки: в облаке — строкой в Setup script окружения
# (см. README рядом). Ставится в контейнер сессии, не на боевой сервер.
set -euo pipefail

REA_VERSION="6.7.0"
GHIDRA_VERSION="12.1.3"
GHIDRA_DATE="20260817"
GHIDRA_DIR="${GHIDRA_DIR:-/opt/ghidra_${GHIDRA_VERSION}_PUBLIC}"
GHIDRA_ZIP_URL="https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/ghidra_${GHIDRA_VERSION}_PUBLIC_${GHIDRA_DATE}.zip"

say() { printf '· %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "нет $1 — $2" >&2; exit 1; }; }

need node "нужен Node.js 22.19+, 24.11+ или 26+"
need npm "нужен npm"
need java "нужен JDK 21+ (для Ghidra)"
need unzip "нужен unzip"
need ps "нужен ps из procps: без него REA не запускает Ghidra"
need claude "нужен Claude Code CLI"

# 1. Ghidra — движок разбора программ (~570 МБ архив, ~900 МБ на диске).
# REA принимает Ghidra 12.1.x.
if [ -x "$GHIDRA_DIR/support/analyzeHeadless" ]; then
  say "Ghidra $GHIDRA_VERSION уже стоит: $GHIDRA_DIR"
else
  say "Ghidra $GHIDRA_VERSION: скачиваю"
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT
  curl -fsSL --retry 3 --max-time 1200 -o "$work/ghidra.zip" "$GHIDRA_ZIP_URL"
  unzip -q "$work/ghidra.zip" -d "$(dirname "$GHIDRA_DIR")"
fi

# 2. REA — версия закреплена: REA меняется быстро, обновлять осознанно.
if command -v rea >/dev/null 2>&1 && [ "$(rea --version 2>/dev/null | tail -1)" = "$REA_VERSION" ]; then
  say "REA $REA_VERSION уже стоит"
else
  say "REA $REA_VERSION: ставлю"
  npm install --global --silent "rea-agents@$REA_VERSION"
fi

# 3. Подключить к Claude Code и поставить навык. Setup сам записывает в
# регистрацию найденные GHIDRA_INSTALL_DIR и JAVA_HOME.
export GHIDRA_INSTALL_DIR="$GHIDRA_DIR"
rea setup --client claude_code --yes --json >/dev/null
say "REA подключён к Claude Code, навык reverse-engineer-anything на месте"

# 4. Проверка без модели: Claude Code видит сервер, Ghidra принята.
claude mcp get rea | grep -q "Connected" || { echo "REA не отвечает: claude mcp get rea" >&2; exit 1; }
rea doctor --json | node -e '
  let s = ""; process.stdin.on("data", (c) => (s += c)).on("end", () => {
    const d = JSON.parse(s);
    const ghidra = (d.checks || []).find((c) => c.name === "ghidra");
    if (!ghidra || !ghidra.ok) { console.error("Ghidra не принята: rea doctor --json"); process.exit(1); }
  });'
say "Готово: Ghidra принята. Инструменты REA — в следующей сессии."
