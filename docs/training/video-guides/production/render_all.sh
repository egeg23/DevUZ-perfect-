#!/bin/bash
# Блоки по порядку: ждём озвучку блока, собираем, рендерим.
P="${VG_WORK:?укажите рабочую папку VG_WORK}"
cd $P/hf
for n in "$@"; do
  nn=$(printf "%02d" $n)
  until [ -f $P/prod/audio/b$nn.json ] && [ -f $P/prod/audio/b$nn-rem.json ]; do sleep 20; done
  python3 $P/prod/build.py $n >> $P/out/build.log 2>&1 || { echo "b$nn BUILD FAILED"; continue; }
  HYPERFRAMES_RENDER_DETACHED=1 npx hyperframes render $P/prod/projects/b$nn -o $P/out/b$nn.mp4 -q standard -f 30 < /dev/null > $P/out/b$nn.log 2>&1
  if [ -f $P/out/b$nn.mp4 ]; then echo "b$nn DONE $(grep -o 'rendered in [^·]*' $P/out/b$nn.log | head -1)"; else echo "b$nn RENDER FAILED"; fi
done
echo ALL_DONE
