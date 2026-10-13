# Как собраны видео-гайды

Всё считается в рабочем контейнере, не на сервере. Рабочая папка `VG_WORK`:

- `prod/`: эти файлы. `norm.py` превращает текст диктора в текст для голоса (числа словами, латиница по-русски), `tts_all.py` и `tts_rem.py` озвучивают сцены, названия и «Что запомнить» голосом Vosk TTS 0.9-multi, диктор 3, `visuals.py` описывает, что на экране в каждой сцене, `build.py` с `template.html` собирают проект HyperFrames на блок, `render_all.sh` рендерит блоки по порядку.
- `assets/`: снимки и записи прокрутки страниц, их снимают `cap.js`, `extra.js`, `asmo.js` (Playwright, Chromium из `/opt/pw-browsers`).
- `hf/`: `npm i hyperframes@0.8.154 gsap@3.14.2`.
- `tts/`: venv с `vosk-tts` и модель `vosk-model-tts-ru-0.9-multi` (см. `../voice-samples/README.md`).
- `out/`: готовые mp4.

Правка текста: меняете `scenarios.md` и `scenarios.uz.md`, стираете озвучку изменённого блока в `prod/audio/`, запускаете `tts_all.py <блок>`, `tts_rem.py`, затем `render_all.sh <блок>`.
