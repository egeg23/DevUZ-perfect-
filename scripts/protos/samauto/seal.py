"""Шифрует сцену SamAuto: SCENE_KEY=<64 hex> python3 -I seal.py.

Владелец, 21.10.2026: «защити его, я не хочу, чтобы через консоль кто-то
смог вытащить код и украсть то, что тут есть». Кадры сцены (seq/d, seq/m),
видео телефона (seq/m.mp4) и живые сцены техники (fleet/*.mp4) и кадры стенда D-MAX (tt/<d|m>) лежат в
public только зашифрованными: AES-256-GCM, файл = 12 байт nonce + шифр.
Ключ — в хранилище секретов (`SCENE_KEY_SAMAUTO`), в репозитории его нет; макет
получает его маршрутом app/proto/[token]/promo/scene, только когда открыт
сам макет (lib/proto/promo-store). Запускать после seq.py и fleet.py: они
пишут открытые файлы, этот скрипт превращает их в .bin и открытые удаляет.
Открытыми остаются только постеры: первый кадр сцены, обложки, карточки.
"""
import os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/samauto")
KEEP = {"t1-00.webp"}  # первый кадр — постер до загрузки


def seal(path):
    nonce = os.urandom(12)
    with open(path, "rb") as f:
        data = f.read()
    with open(os.path.splitext(path)[0] + ".bin", "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))
    os.remove(path)


n = 0
for sub, ext in (("seq/d", ".webp"), ("seq/m", ".webp"), ("seq", ".mp4"), ("fleet", ".mp4"), ("tt/d", ".webp"), ("tt/m", ".webp")):
    d = os.path.join(PUB, sub)
    for f in sorted(os.listdir(d)):
        if f.endswith(ext) and f not in KEEP:
            seal(os.path.join(d, f))
            n += 1
print("зашифровано", n, file=sys.stderr)
