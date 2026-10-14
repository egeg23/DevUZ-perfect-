import re, json, sys, wave, time, os
sys.path.insert(0, os.path.dirname(__file__))
from norm import norm
from vosk_tts import Model, Synth
SRC = "/home/user/DevUZ-perfect-/docs/training/video-guides/scenarios.md"
OUT = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(OUT, exist_ok=True)
s = open(SRC).read()
blocks = re.split(r'\n(?=## Блок )', s)[1:]
model = Model(model_path=os.path.join(os.path.dirname(__file__), "../tts/vosk-models/vosk-model-tts-ru-0.9-multi"))
synth = Synth(model)
only = set(sys.argv[1:])
for b in blocks:
    n = int(re.match(r'## Блок (\d+)', b).group(1))
    if only and str(n) not in only: continue
    narr = re.search(r'\*\*Текст диктора\*\*\n(.*?)\n(?=\*\*Задание|\*\*Что запомнить)', b, re.S).group(1)
    scenes = re.findall(r'^\[([^\]]+)\] (.*)$', narr, re.M)
    meta = []
    for key, text in scenes:
        sents = [x.strip() for x in re.split(r'(?<=[.!?])\s+(?=[А-ЯЁA-Z«])', text) if x.strip()]
        items = []
        for i, sent in enumerate(sents):
            fn = f"b{n:02d}-{key}-{i:02d}.wav"
            path = os.path.join(OUT, fn)
            if not os.path.exists(path):
                synth.synth(norm(sent), path, speaker_id=3)
            w = wave.open(path); dur = w.getnframes() / w.getframerate(); w.close()
            items.append({"file": fn, "text": sent, "dur": round(dur, 3)})
        meta.append({"key": key, "sentences": items})
        print(n, key, round(sum(x["dur"] for x in items), 1), flush=True)
    json.dump(meta, open(os.path.join(OUT, f"b{n:02d}.json"), "w"), ensure_ascii=False, indent=1)
