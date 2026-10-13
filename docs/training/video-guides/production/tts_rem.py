import json, os, sys, wave, re
sys.path.insert(0, os.path.dirname(__file__))
from norm import norm
import importlib.util
spec = importlib.util.spec_from_file_location("b", os.path.join(os.path.dirname(__file__), "build.py"))
from vosk_tts import Model, Synth
src = open("/home/user/DevUZ-perfect-/docs/training/video-guides/scenarios.md").read()
blocks = {int(m.group(1)): p for p in re.split(r"\n(?=## )", src) for m in [re.match(r"## Блок (\d+)\.", p)] if m}
def title_of(b): return re.match(r"## \w+ \d+\. (.*?) \(\d+ \w+\)", b).group(1)
def remember(b):
    m = re.search(r"\*\*Что запомнить\*\*\n\n(.*?)(?:\n\n---|\Z)", b, re.S)
    return [re.sub(r"^\d\.\s*", "", x).strip() for x in m.group(1).strip().split("\n") if x.strip()]
OUT = os.path.join(os.path.dirname(__file__), "audio")
model = Model(model_path=os.path.join(os.path.dirname(__file__), "../tts/vosk-models/vosk-model-tts-ru-0.9-multi")); synth = Synth(model)
def say(text, fn):
    p = os.path.join(OUT, fn)
    if not os.path.exists(p): synth.synth(norm(text), p, speaker_id=3)
    w = wave.open(p); d = w.getnframes() / w.getframerate(); w.close()
    return {"file": fn, "text": text, "dur": round(d, 3)}
ORD = ["Первое", "Второе", "Третье"]
for n, b in sorted(blocks.items()):
    t = say(f"Блок {['','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать'][n]}. {title_of(b)}.", f"b{n:02d}-title.wav")
    items = []
    for k, x in enumerate(remember(b)):
        pre = "Что запомнить. Первое. " if k == 0 else ORD[k] + ". "
        items.append(say(pre + x, f"b{n:02d}-rem-{k}.wav"))
    json.dump({"title": t, "items": items}, open(os.path.join(OUT, f"b{n:02d}-rem.json"), "w"), ensure_ascii=False, indent=1)
    print(n, "ok", flush=True)
