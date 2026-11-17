#!/usr/bin/env bash
# Вырезка фона упаковки в панели: движок ONNX Runtime Web (MIT) и модель
# silueta из rembg (u2net, Apache-2.0). Работают в браузере менеджера, сервер
# компании только отдаёт файлы. В репозиторий не кладём (44 МБ модели и
# 14 МБ движка): сборка образа скачивает их сама и сверяет отпечатки.
# Запуск: bash deploy/cut-assets.sh [папка]  (по умолчанию admin/cut рядом с этим скриптом)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$HERE/admin/cut}"
ORT_V=1.30.0
ORT_SHA=d2228df7e4616bc3348bf504ee888f3bec43789a273f0a63f3e68d203ce3bf71
MODEL=silueta-75da6c8d.onnx
MODEL_SHA=75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT/ort-$ORT_V"

if [ ! -s "$OUT/ort-$ORT_V/ort-wasm-simd-threaded.wasm" ]; then
  curl -fsSL --retry 3 -o "$TMP/ort.tgz" "https://registry.npmjs.org/onnxruntime-web/-/onnxruntime-web-$ORT_V.tgz"
  echo "$ORT_SHA  $TMP/ort.tgz" | sha256sum -c -
  tar -xzf "$TMP/ort.tgz" -C "$TMP" package/dist/ort.wasm.min.js package/dist/ort-wasm-simd-threaded.mjs package/dist/ort-wasm-simd-threaded.wasm
  cp "$TMP"/package/dist/ort.wasm.min.js "$TMP"/package/dist/ort-wasm-simd-threaded.mjs "$TMP"/package/dist/ort-wasm-simd-threaded.wasm "$OUT/ort-$ORT_V/"
fi

if [ ! -s "$OUT/$MODEL" ]; then
  curl -fsSL --retry 3 -o "$TMP/m.onnx" "https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx"
  echo "$MODEL_SHA  $TMP/m.onnx" | sha256sum -c -
  mv "$TMP/m.onnx" "$OUT/$MODEL"
fi
du -sh "$OUT"
