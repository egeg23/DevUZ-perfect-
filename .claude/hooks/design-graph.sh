#!/usr/bin/env bash
# Карта дизайна для макетов — отдельно от карты кода (владелец, 08.11.2026:
# «делаем отдельно по дизайну, при создании макета обращаемся к ней»).
#
# В неё идут: дизайн-скилы (свои и загруженные), эталоны proto-master,
# README/SOURCES/21ST/plan прошлых макетов и разведки docs/research — то,
# что нужно, чтобы по «макет для …» сразу понять, что делать.
#
#   bash .claude/hooks/design-graph.sh build            — собрать (фоном из хука старта)
#   bash .claude/hooks/design-graph.sh query "вопрос"   — спросить карту
#   bash .claude/hooks/design-graph.sh explain "узел"   — объяснить узел
#
# Карта лежит вне репозитория ($HOME/.cache/devuz-design): в git не идёт,
# корневой .graphifyignore (он режет .claude/ и scripts/protos/) её не трогает.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
BASE="${DEVUZ_DESIGN_GRAPH:-$HOME/.cache/devuz-design}"
CORPUS="$BASE/corpus"
GRAPH="$CORPUS/graphify-out/graph.json"

# Новый дизайн-скил — строкой сюда (шаблон папки в .claude/skills).
SKILLS=(
  mockup proto-master
  taste-skill hallmark impeccable refactoring-ui ui-ux-pro-max design-md superdesign
  scroll-world marketing-cro
  "emil-*" "gsap-*" "od-*"
)

build() {
  command -v graphify >/dev/null 2>&1 || exit 0
  rm -rf "$CORPUS.new" && mkdir -p "$CORPUS.new/skills" "$CORPUS.new/protos" "$CORPUS.new/research"
  cd "$ROOT/.claude/skills" || exit 0
  for pat in "${SKILLS[@]}"; do
    for d in $pat; do [ -d "$d" ] && cp -r "$d" "$CORPUS.new/skills/"; done
  done
  cd "$ROOT/scripts/protos" || exit 0
  for d in */; do
    d="${d%/}"
    for f in README.md SOURCES.md 21ST.md BEFORE.md plan.mjs; do
      [ -f "$d/$f" ] && mkdir -p "$CORPUS.new/protos/$d" && cp "$d/$f" "$CORPUS.new/protos/$d/"
    done
  done
  cp "$ROOT"/docs/research/*.md "$CORPUS.new/research/" 2>/dev/null
  # Старую карту не стираем, пока новая не собралась: кэш graphify переносим.
  [ -d "$CORPUS/graphify-out" ] && cp -r "$CORPUS/graphify-out" "$CORPUS.new/"
  (cd "$CORPUS.new" && graphify update . >"$BASE/build.log" 2>&1) || exit 0
  rm -rf "$CORPUS" && mv "$CORPUS.new" "$CORPUS"
}

case "${1:-build}" in
  build) mkdir -p "$BASE"; build ;;
  query|explain|path)
    cmd="$1"; shift
    if [ ! -f "$GRAPH" ]; then
      echo "Карты дизайна ещё нет (сборка: $BASE/build.log). Читай .claude/skills/mockup/SKILL.md напрямую."
      exit 0
    fi
    graphify "$cmd" "$@" --graph "$GRAPH" ;;
  *) echo "build | query \"вопрос\" | explain \"узел\" | path \"A\" \"B\""; exit 1 ;;
esac
