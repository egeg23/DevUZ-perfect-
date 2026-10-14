"""Голосовые → текст: задача «Голосовые — расшифровка» (GitHub Actions).

Владелец или руководитель пересылает голосовое боту студии, бот ставит его в
очередь (lib/admin/voice-notes.ts). Здесь: спросить очередь, забрать звук
через наш сервер, расшифровать открытой моделью Whisper (faster-whisper) и
отдать текст — бот пришлёт его в тот же чат.

Журнал задачи в открытом репозитории виден всем, поэтому сюда не пишется ни
слова из расшифровки: только номер, длина и число знаков.

Запуск:
    VOICE_SITE=https://devuz.studio python scripts/voice-transcribe.py
(только внутри GitHub Actions: пропуск к серверу выдаёт GitHub, OIDC).
Необязательно: VOICE_MODEL (large-v3-turbo), VOICE_LANGUAGE (пусто — сам
узнаёт язык; клиент может говорить по-узбекски).
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import traceback
import urllib.error
import urllib.request

AUDIENCE = "devuz-voice"
EXT = {"audio/ogg": ".ogg", "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a", "audio/wav": ".wav"}


def github_token() -> str:
    """Пропуск GitHub (OIDC) для нашего сервера. Живёт минуты — просим перед каждым запросом."""
    url = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"] + "&audience=" + AUDIENCE
    req = urllib.request.Request(url, headers={"Authorization": "bearer " + os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read())["value"]


def request(site: str, path: str, body: dict | None = None, timeout: int = 120) -> bytes:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{site}{path}",
        data=data,
        method="POST" if body is not None else "GET",
        headers={
            "Authorization": "Bearer " + github_token(),
            "content-type": "application/json",
            "user-agent": "devuz-voice/1",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def paragraphs(segments) -> str:
    """Сегменты Whisper — в абзацы: пауза больше 1,2 с или длинный абзац на конце фразы."""
    out: list[str] = []
    current = ""
    last_end = None
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        gap = seg.start - last_end if last_end is not None else 0
        long_enough = len(current) >= 700 and current.rstrip()[-1:] in ".!?…"
        if current and ((gap > 1.2 and len(current) >= 200) or long_enough):
            out.append(current.strip())
            current = ""
        current = f"{current} {text}" if current else text
        last_end = seg.end
    if current.strip():
        out.append(current.strip())
    return "\n\n".join(out)


def where(error: BaseException) -> str:
    """Где упало — файл:строка функция, без значений: в открытый журнал не попадает ни слова из записи."""
    frames = traceback.extract_tb(error.__traceback__)[-4:]
    place = " ← ".join(f"{os.path.basename(f.filename)}:{f.lineno} {f.name}" for f in reversed(frames))
    return f"{type(error).__name__} в {place}"


def transcribe(model, path: str, language: str | None):
    """Звук разбираем отдельно — чтобы по журналу было видно, что не так: файл или расшифровка.

    Первый заход — с фильтром тишины и языком, который модель узнаёт сама;
    не вышло — второй, без фильтра и по-русски (клиенты обычно говорят по-русски).
    """
    from faster_whisper import decode_audio

    try:
        audio = decode_audio(path, sampling_rate=16000)
    except Exception as error:  # noqa: BLE001
        print(f"  звук не разобрался: {where(error)}")
        raise
    print(f"  звук: {len(audio) / 16000:.0f} с")
    try:
        segments, info = model.transcribe(audio, language=language, vad_filter=True, beam_size=5)
        return paragraphs(segments), info
    except Exception as error:  # noqa: BLE001
        print(f"  первый заход: {where(error)}")
    segments, info = model.transcribe(audio, language=language or "ru", vad_filter=False, beam_size=5)
    return paragraphs(segments), info


def main() -> int:
    sys.stdout.reconfigure(line_buffering=True)
    site = os.environ.get("VOICE_SITE", "https://devuz.studio").rstrip("/")
    model_name = os.environ.get("VOICE_MODEL") or "large-v3-turbo"
    language = os.environ.get("VOICE_LANGUAGE") or None
    if not os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL"):
        print("Нет пропуска GitHub: задаче нужно permissions: id-token: write", file=sys.stderr)
        return 1

    queue = json.loads(request(site, "/api/voice/queue"))
    items = queue.get("items") or []
    print(f"В очереди: {len(items)}")
    if not items:
        return 0

    from faster_whisper import WhisperModel

    model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    failed = 0
    for item in items:
        voice_id = item["id"]
        try:
            audio = request(site, f"/api/voice/{voice_id}/audio", timeout=180)
        except urllib.error.HTTPError as error:
            # 409 — голос уже забрал другой проход; 502 — Telegram не отдал файл.
            print(f"{voice_id}: звук не получен ({error.code})")
            continue
        suffix = EXT.get(item.get("mime") or "", ".ogg")
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as file:
            file.write(audio)
            path = file.name
        try:
            print(f"{voice_id}: файл {len(audio)} байт")
            text, info = transcribe(model, path, language)
            request(site, f"/api/voice/{voice_id}/text", {"text": text, "language": info.language})
            print(f"{voice_id}: {info.duration:.0f} с, язык {info.language}, {len(text)} знаков — отправлено")
        except Exception as error:  # noqa: BLE001 — любая ошибка: голос назад в очередь
            failed += 1
            print(f"{voice_id}: не расшифровалось — {where(error)}")
            try:
                request(site, f"/api/voice/{voice_id}/text", {"error": type(error).__name__})
            except Exception:  # noqa: BLE001
                pass
        finally:
            os.unlink(path)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
