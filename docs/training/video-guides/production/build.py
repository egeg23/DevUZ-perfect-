"""Собирает проект HyperFrames для одного блока курса.

python3 build.py 1  ->  projects/b01/index.html (+ ассеты, звук)
Вход: сценарий (ru), субтитры (uz), audio/bNN.json (озвучка по предложениям),
visuals.py (что на экране в каждой сцене).
"""
import html, json, os, re, shutil, subprocess, sys, wave

HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(HERE)
RU = "/home/user/DevUZ-perfect-/docs/training/video-guides/scenarios.md"
UZ = "/home/user/DevUZ-perfect-/docs/training/video-guides/scenarios.uz.md"
ASSETS = os.path.join(SP, "assets")
EXTRA = os.path.join(HERE, "art")
AUDIO = os.path.join(HERE, "audio")
GSAP = os.path.join(SP, "hf/node_modules/gsap/dist/gsap.min.js")
LOGO = "/home/user/DevUZ-perfect-/public/brand/logo-square-alpha.svg"

SENT_GAP = 0.32   # пауза между предложениями
SCENE_TAIL = 0.7  # пауза в конце сцены
PAUSE_CARD = 8.0  # карточка «поставьте на паузу» после задания
RATE = 22050

sys.path.insert(0, HERE)
from visuals import VISUALS  # noqa: E402


def esc(s):
    return html.escape(s, quote=True)


def split_blocks(path, head_re):
    s = open(path).read()
    parts = re.split(r"\n(?=## )", s)
    out = {}
    for p in parts:
        m = re.match(head_re, p)
        if m:
            out[int(m.group(1))] = p
    return out


def scene_table(block):
    rows = re.findall(r"^\| (\w+) \| \d+:\d\d \| (.*?) \| (.*?) \|\s*$", block, re.M)
    return {k: (screen, cap.strip().strip("«»")) for k, screen, cap in rows}


def paragraphs(block):
    m = re.search(r"\*\*(?:Текст диктора|Diktor matni[^*]*)\*\*\n(.*?)\n(?=\*\*)", block, re.S)
    out = {}
    for key, txt in re.findall(r"^\[([^\]]+)\] (.*)$", m.group(1), re.M):
        key = {"Mashq": "Упражнение", "Tahlil": "Разбор"}.get(key, key)
        out[key] = txt
    return out


def remember(block):
    m = re.search(r"\*\*(?:Что запомнить|Nimani eslab qolish kerak)\*\*\n\n(.*?)(?:\n\n---|\Z)", block, re.S)
    return [re.sub(r"^\d\.\s*", "", x).strip() for x in m.group(1).strip().split("\n") if x.strip()]


def title_of(block):
    return re.match(r"## \w+ \d+\. (.*?) \(\d+ \w+\)", block).group(1)


def task_of(block):
    m = re.search(r"\*\*(?:Задание для печатной памятки|Bosma eslatma uchun topshiriq)[^*]*\*\*\s*(.*)", block)
    return m.group(1).strip() if m else ""


def chunks(text, limit=92):
    """Субтитр: куски не длиннее двух строк, режем по предложениям, потом по запятым."""
    sents = re.split(r"(?<=[.!?])\s+", text.strip())
    out = []
    for s in sents:
        while len(s) > limit:
            cut = max(s.rfind(", ", 0, limit), s.rfind(": ", 0, limit))
            if cut < limit * 0.4:
                cut = s.rfind(" ", 0, limit)
            out.append(s[: cut + 1].strip())
            s = s[cut + 1:].strip()
        if s:
            out.append(s)
    return out


def wav_concat(files_with_gaps, dest):
    """[(wav|None, seconds_of_silence_after)] -> один wav."""
    frames = []
    for f, gap in files_with_gaps:
        if f:
            w = wave.open(f)
            assert w.getframerate() == RATE, (f, w.getframerate())
            frames.append(w.readframes(w.getnframes()))
            w.close()
        frames.append(b"\x00\x00" * int(RATE * gap))
    out = wave.open(dest, "wb")
    out.setnchannels(1)
    out.setsampwidth(2)
    out.setframerate(RATE)
    out.writeframes(b"".join(frames))
    out.close()


def build(n):
    ru = split_blocks(RU, r"## Блок (\d+)\.")[n]
    uz = split_blocks(UZ, r"## Blok (\d+)\.")[n]
    meta = json.load(open(os.path.join(AUDIO, f"b{n:02d}.json")))
    rem_meta = json.load(open(os.path.join(AUDIO, f"b{n:02d}-rem.json")))
    tab_ru, tab_uz = scene_table(ru), scene_table(uz)
    uz_tab_keys = list(tab_uz.keys())
    ru_tab_keys = list(tab_ru.keys())
    uzmap = dict(zip(ru_tab_keys, uz_tab_keys))
    p_uz = paragraphs(uz)
    proj = os.path.join(HERE, "projects", f"b{n:02d}")
    shutil.rmtree(proj, ignore_errors=True)
    os.makedirs(proj)
    shutil.copy(GSAP, proj)
    shutil.copy(LOGO, os.path.join(proj, "logo.svg"))

    t = 0.0
    audio_parts = []
    scenes_html = []
    subs = []      # (start, end, text)
    anim = []      # строки JS
    used = set()

    def use(asset):
        if not asset or asset in used:
            return
        src = os.path.join(EXTRA, asset) if os.path.exists(os.path.join(EXTRA, asset)) else os.path.join(ASSETS, asset)
        shutil.copy(src, os.path.join(proj, asset))
        used.add(asset)

    def place_subs(start, ru_items, uz_text):
        """Узбекский текст по времени русской речи: доля символов -> доля времени."""
        if not uz_text:
            return
        # опорные точки речи: (доля символов ru, время)
        total_ru = sum(len(x["text"]) for x in ru_items) or 1
        pts = [(0.0, start)]
        acc, tt = 0, start
        for x in ru_items:
            acc += len(x["text"])
            tt += x["dur"]
            pts.append((acc / total_ru, tt))
            tt += SENT_GAP
        def at(frac):
            for (f0, t0), (f1, t1) in zip(pts, pts[1:]):
                if frac <= f1:
                    return t0 + (t1 - t0) * ((frac - f0) / (f1 - f0 or 1))
            return pts[-1][1]
        cs = chunks(uz_text)
        total = sum(len(c) for c in cs) or 1
        a = 0
        for c in cs:
            s0 = at(a / total)
            a += len(c)
            s1 = at(a / total)
            subs.append((s0, max(s1, s0 + 1.2), c))

    # 1. Заставка блока: голос читает название
    title_ru = title_of(ru)
    title_uz = title_of(uz)
    intro = rem_meta["title"]
    audio_parts.append((None, 0.6))
    audio_parts.append((os.path.join(AUDIO, intro["file"]), 1.2))
    dur = 0.6 + intro["dur"] + 1.2
    scenes_html.append(render_title(0, n, title_ru, title_uz, t, dur))
    anim += title_anim(0, t, dur)
    t += dur

    for i, sc in enumerate(meta):
        key = sc["key"]
        items = sc["sentences"]
        start = t
        for j, x in enumerate(items):
            audio_parts.append((os.path.join(AUDIO, x["file"]), SENT_GAP if j < len(items) - 1 else SCENE_TAIL))
        dur = sum(x["dur"] for x in items) + SENT_GAP * (len(items) - 1) + SCENE_TAIL
        tkey = {"Упражнение": "У", "Разбор": "Р"}.get(key, key)
        cap_ru = tab_ru.get(tkey, ("", ""))[1]
        cap_uz = tab_uz.get(uzmap.get(tkey, ""), ("", ""))[1]
        vis = VISUALS.get((n, key)) or {"type": "card", "lines": [cap_ru]}
        sid = f"s{i + 1}"
        if key == "Упражнение":
            vis = dict(vis, type="task", text=task_of(ru), text_uz=task_of(uz))
        for a in vis_assets(vis):
            use(a)
        scenes_html.append(render_scene(sid, vis, cap_ru, cap_uz, start, dur))
        anim += scene_anim(sid, vis, start, dur, items)
        place_subs(start, items, p_uz.get(key, ""))
        t += dur
        if key == "Упражнение":
            audio_parts.append((None, PAUSE_CARD))
            pid = f"s{i + 1}p"
            scenes_html.append(render_pause(pid, t, PAUSE_CARD))
            anim += pause_anim(pid, t, PAUSE_CARD)
            t += PAUSE_CARD

    # Финал: «Что запомнить», голос читает пункты
    rem_ru, rem_uz = remember(ru), remember(uz)
    items = rem_meta["items"]
    start = t
    audio_parts.append((None, 0.3))
    for j, x in enumerate(items):
        audio_parts.append((os.path.join(AUDIO, x["file"]), 0.5))
    dur = 0.3 + sum(x["dur"] for x in items) + 0.5 * len(items) + 2.0
    audio_parts.append((None, 2.0))
    scenes_html.append(render_remember("rem", rem_ru, rem_uz, start, dur))
    tt = start + 0.3
    marks = []
    for x in items:
        marks.append(tt)
        tt += x["dur"] + 0.5
    anim += remember_anim("rem", start, dur, marks)
    t += dur

    raw = os.path.join(proj, "narration-raw.wav")
    wav_concat(audio_parts, raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100",
                    os.path.join(proj, "narration.wav")], check=True)
    os.remove(raw)
    total = round(t, 2)
    subs_html = "\n".join(
        f'<div class="sub" id="c{k}"><span>{esc(txt)}</span></div>' for k, (_, _, txt) in enumerate(subs)
    )
    for k, (s0, s1, _) in enumerate(subs):
        anim.append(f'tl.set("#c{k}",{{opacity:1}},{s0:.2f}).set("#c{k}",{{opacity:0}},{s1:.2f});')
    page = (TEMPLATE.replace("__TOTAL__", str(total)).replace("__SCENES__", "\n".join(scenes_html))
            .replace("__SUBS__", subs_html).replace("__ANIM__", "\n".join(anim)))
    open(os.path.join(proj, "index.html"), "w").write(page)
    json.dump({"block": n, "duration": total, "subs": len(subs)}, open(os.path.join(proj, "info.json"), "w"))
    print(f"b{n:02d}: {total:.1f}s, сцен {len(meta)}, субтитров {len(subs)}")


# ───────────────────────── визуальные блоки ─────────────────────────

def clip_len(name):
    p = os.path.join(ASSETS, name)
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout.strip() or 0)


def vis_assets(v):
    out = []
    for k in ("src", "left", "right", "poster"):
        if v.get(k):
            out.append(v[k])
    return out


def browser(src_html, url, cls=""):
    return (f'<div class="browser {cls}"><div class="bar"><i></i><i></i><i></i>'
            f'<div class="url">{esc(url)}</div></div><div class="view">{src_html}</div></div>')


def render_title(i, n, ru, uz, start, dur):
    return f'''<div class="scene title clip" id="t{i}" data-start="{start:.2f}" data-duration="{dur:.2f}">
  <img class="logo" src="logo.svg"><div class="kicker">Видео-гайд для менеджеров DevUz · Блок {n}</div>
  <h1>{esc(ru)}</h1><h2>{esc(uz)}</h2></div>'''


def title_anim(i, start, dur):
    return [f'tl.fromTo("#t{i}",{{opacity:0}},{{opacity:1,duration:.5}},{start:.2f});',
            f'tl.fromTo("#t{i} h1",{{y:30,opacity:0}},{{y:0,opacity:1,duration:.7}},{start + .2:.2f});',
            f'tl.fromTo("#t{i} h2",{{y:20,opacity:0}},{{y:0,opacity:1,duration:.7}},{start + .5:.2f});',
            f'tl.to("#t{i}",{{opacity:0,duration:.4}},{start + dur - .4:.2f});']


def labels(cap_ru, cap_uz):
    if not cap_ru:
        return ""
    return f'<div class="label"><b>{esc(cap_ru)}</b><span>{esc(cap_uz)}</span></div>'


def render_scene(sid, v, cap_ru, cap_uz, start, dur):
    ty = v["type"]
    body = ""
    if ty == "image":
        body = browser(f'<img class="pan" src="{v["src"]}">', v.get("url", ""))
    elif ty == "phone":
        body = f'<div class="phone"><div class="notch"></div><div class="pview"><img class="pan" src="{v["src"]}"></div></div>'
        if v.get("side"):
            body += f'<div class="side">{"".join(f"<p>{esc(x)}</p>" for x in v["side"])}</div>'
    elif ty == "video":
        clip = clip_len(v["src"]) - v.get("from", 0) - 0.2
        vd = min(dur, clip)
        body = browser(f'<img class="pan" src="{v["poster"]}"><video src="{v["src"]}" muted playsinline data-start="{start:.2f}" '
                       f'data-duration="{vd:.2f}" data-media-start="{v.get("from", 0)}"></video>', v.get("url", ""))
    elif ty == "split":
        body = (f'<div class="split"><figure><img src="{v["left"]}"><figcaption>{esc(v.get("lcap", ""))}</figcaption></figure>'
                f'<figure><img src="{v["right"]}"><figcaption>{esc(v.get("rcap", ""))}</figcaption></figure></div>')
    elif ty == "chat":
        msgs = []
        for k, m in enumerate(v["msgs"]):
            who, kind = m.get("who", "me"), m.get("kind", "text")
            if kind == "circle":
                inner = '<div class="circle"><img src="logo.svg"></div>'
            elif kind == "voice":
                inner = '<div class="voice"><b>▶</b><i></i><em>0:14</em></div>'
            else:
                inner = esc(m["text"])
            msgs.append(f'<div class="msg {who} {kind}" id="{sid}m{k}">{inner}</div>')
        name = esc(v.get("name", "Клиент"))
        body = (f'<div class="tg"><div class="tghead"><div class="ava">{name[:1]}</div><div><b>{name}</b>'
                f'<span>был(а) недавно</span></div></div><div class="tgbody">{"".join(msgs)}</div></div>')
        if v.get("side"):
            body += f'<div class="side">{"".join(f"<p>{esc(x)}</p>" for x in v["side"])}</div>'
    elif ty == "card":
        lines = "".join(f'<li id="{sid}l{k}">{esc(x)}</li>' for k, x in enumerate(v["lines"]))
        big = f'<div class="emoji">{v["emoji"]}</div>' if v.get("emoji") else ""
        body = f'<div class="card">{big}<ul class="{"one" if len(v["lines"]) == 1 else ("many" if len(v["lines"]) > 5 else "")}">{lines}</ul></div>'
    elif ty == "flow":
        steps = "".join(f'<div class="step {"on" if k in v.get("on", range(99)) else "off"}" id="{sid}f{k}">{esc(x)}</div>'
                        for k, x in enumerate(v["steps"]))
        body = f'<div class="flow">{steps}</div>'
    elif ty == "task":
        body = (f'<div class="task"><div class="tk">Задание · Topshiriq</div><p>{esc(v["text"])}</p>'
                f'<p class="uz">{esc(v.get("text_uz", ""))}</p></div>')
    return (f'<div class="scene clip" id="{sid}" data-start="{start:.2f}" data-duration="{dur:.2f}">'
            f'{labels(cap_ru, cap_uz)}<div class="stage">{body}</div></div>')


def scene_anim(sid, v, start, dur, items):
    a = [f'tl.fromTo("#{sid}",{{opacity:0}},{{opacity:1,duration:.45}},{start:.2f});',
         f'tl.to("#{sid}",{{opacity:0,duration:.35}},{start + dur - .35:.2f});']
    ty = v["type"]
    if ty in ("image", "phone"):
        pan = v.get("pan", 0)          # px вниз за сцену (в масштабе картинки на экране)
        zoom = v.get("zoom", 1.0)
        ox, oy = v.get("origin", (50, 30))
        sel = f"#{sid} .pan"
        a.append(f'gsap.set("{sel}",{{transformOrigin:"{ox}% {oy}%"}});')
        a.append(f'tl.fromTo("{sel}",{{y:{-v.get("y0", 0)},scale:1}},{{y:{-(v.get("y0", 0) + pan)},scale:{zoom},duration:{dur:.2f},ease:"sine.inOut"}},{start:.2f});')
    elif ty == "video":
        clip = clip_len(v["src"]) - v.get("from", 0) - 0.2
        if clip < dur:
            a.append(f'tl.to("#{sid} video",{{opacity:0,duration:.6}},{start + clip - .6:.2f});')
            a.append(f'tl.fromTo("#{sid} .pan",{{y:0}},{{y:-{v.get("after_pan", 900)},duration:{dur - clip + .6:.2f},ease:"sine.inOut"}},{start + clip - .6:.2f});')
    elif ty in ("split",):
        a.append(f'tl.fromTo("#{sid} figure",{{y:40,opacity:0}},{{y:0,opacity:1,duration:.6,stagger:.5}},{start + .2:.2f});')
    elif ty == "chat":
        n = len(v["msgs"])
        span = max(dur - 1.5, 1)
        for k in range(n):
            at = start + 0.4 + span * k / max(n, 1)
            a.append(f'tl.fromTo("#{sid}m{k}",{{y:24,opacity:0}},{{y:0,opacity:1,duration:.4}},{at:.2f});')
    elif ty == "card":
        n = len(v["lines"])
        span = max(dur - 1.5, 1)
        for k in range(n):
            at = start + 0.3 + span * k / max(n, 1)
            a.append(f'tl.fromTo("#{sid}l{k}",{{x:-30,opacity:0}},{{x:0,opacity:1,duration:.5}},{at:.2f});')
        if v.get("emoji"):
            a.append(f'tl.fromTo("#{sid} .emoji",{{scale:.6,opacity:0}},{{scale:1,opacity:1,duration:.6,ease:"back.out"}},{start + .1:.2f});')
    elif ty == "flow":
        n = len(v["steps"])
        span = max(dur - 1.5, 1) * 0.7
        for k in range(n):
            a.append(f'tl.fromTo("#{sid}f{k}",{{y:30,opacity:0}},{{y:0,opacity:1,duration:.4}},{start + 0.3 + span * k / n:.2f});')
    elif ty == "task":
        a.append(f'tl.fromTo("#{sid} .task",{{scale:.95,opacity:0}},{{scale:1,opacity:1,duration:.6}},{start + .2:.2f});')
    return a


def render_pause(pid, start, dur):
    return f'''<div class="scene clip pause" id="{pid}" data-start="{start:.2f}" data-duration="{dur:.2f}">
  <div class="ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="bg"/><circle cx="100" cy="100" r="88" class="fg" id="{pid}r"/></svg><b>⏸</b></div>
  <h3>Поставьте видео на паузу и ответьте</h3><h4>Videoni pauzaga qo‘ying va javob bering</h4></div>'''


def pause_anim(pid, start, dur):
    return [f'tl.fromTo("#{pid}",{{opacity:0}},{{opacity:1,duration:.4}},{start:.2f});',
            f'tl.fromTo("#{pid}r",{{strokeDashoffset:0}},{{strokeDashoffset:553,duration:{dur - .5:.2f},ease:"none"}},{start:.2f});',
            f'tl.to("#{pid}",{{opacity:0,duration:.3}},{start + dur - .3:.2f});']


def render_remember(rid, ru, uz, start, dur):
    lis = "".join(f'<li id="{rid}i{k}"><b>{k + 1}</b><div><p>{esc(r)}</p><p class="uz">{esc(u)}</p></div></li>'
                  for k, (r, u) in enumerate(zip(ru, uz)))
    return f'''<div class="scene clip remember" id="{rid}" data-start="{start:.2f}" data-duration="{dur:.2f}">
  <div class="rk">Что запомнить · Nimani eslab qolish kerak</div><ol>{lis}</ol></div>'''


def remember_anim(rid, start, dur, marks):
    a = [f'tl.fromTo("#{rid}",{{opacity:0}},{{opacity:1,duration:.4}},{start:.2f});']
    for k, m in enumerate(marks):
        a.append(f'tl.fromTo("#{rid}i{k}",{{x:-40,opacity:0}},{{x:0,opacity:1,duration:.5}},{m:.2f});')
    a.append(f'tl.to("#{rid}",{{opacity:0,duration:.6}},{start + dur - .6:.2f});')
    return a


TEMPLATE = open(os.path.join(HERE, "template.html")).read()

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        build(int(arg))
