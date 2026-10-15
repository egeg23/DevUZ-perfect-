"""Кадры для экранов мониторов: тёмный редактор, в котором «печатают» код.

Запускается обычным Python с Pillow, до Blender:

    python3 scripts/blender/devuz-studio/screens.py OUT_DIR [--frames 600]

На каждый файл из snippets.py — папка OUT_DIR/seq_N с кадрами 0001.png …
Рядом — надписи шрифтом сайта: неон на стене и подпись devuz.studio.
Один кадр картинки — один кадр ролика (30 к/с): за кадр набирается один
знак, курсор мигает, текст сам прокручивается, когда дошёл до низа.
Редактор нарочно ничей: тёмное поле, вкладки, номера строк, дерево файлов —
без чужих логотипов и узнаваемого интерфейса.
"""

import argparse
import os
import re
import sys
from multiprocessing import Pool
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from snippets import SNIPPETS  # noqa: E402

ROOT = HERE.parents[2]
MONO = ROOT / "app" / "fonts" / "jetbrains-mono.woff2"
DISPLAY = ROOT / "app" / "fonts" / "unbounded.woff2"

W, H = 1152, 648
FONT_PX = 19
LINE_H = 27
TOP = 64            # вкладки + путь
BOTTOM = 26         # строка состояния
SIDEBAR = 196
GUTTER = 58

BG = (16, 20, 30)
PANEL = (12, 15, 23)
TAB_ON = (22, 27, 40)
LINE_ON = (26, 32, 47)
TEXT = (214, 220, 232)
DIM = (92, 104, 128)
ACCENT = (59, 130, 246)
GREEN = (34, 240, 160)

COLORS = {
    "kw": (199, 146, 234),
    "str": (165, 224, 117),
    "num": (247, 140, 108),
    "com": (98, 112, 140),
    "fn": (127, 178, 255),
    "type": (255, 203, 107),
    "punct": (137, 221, 255),
    "plain": TEXT,
}

KEYWORDS = {
    "ts": set(
        "import from export const let var function return async await if else for "
        "while new type interface extends as of in typeof default try catch throw "
        "class null undefined true false void use client".split()
    ),
    "py": set(
        "import from def return async await if elif else for while in not and or "
        "class with as try except raise None True False is lambda pass yield".split()
    ),
}

TOKEN = re.compile(
    r"(?P<com>//.*|#.*)"
    r"|(?P<str>`[^`]*`?|\"[^\"]*\"?|'[^']*'?)"
    r"|(?P<num>\b\d+(?:\.\d+)?\b)"
    r"|(?P<word>[A-Za-z_@][A-Za-z0-9_]*)"
    r"|(?P<punct>=>|[{}()\[\];:.,<>=+\-*/!?&|%])"
    r"|(?P<space>\s+)"
    r"|(?P<other>.)"
)


def tokens(line: str, lang: str):
    """Разбивает строку на куски с цветом. Простая подсветка, без парсера."""
    out = []
    for m in TOKEN.finditer(line):
        kind = m.lastgroup
        text = m.group()
        if kind == "com":
            if lang == "ts" and text.startswith("#"):
                kind = "plain"
            elif lang == "py" and text.startswith("//"):
                kind = "plain"
        if kind == "word":
            after = line[m.end():m.end() + 1]
            if text in KEYWORDS[lang]:
                kind = "kw"
            elif text.startswith("@"):
                kind = "fn"
            elif after == "(":
                kind = "fn"
            elif text[0].isupper():
                kind = "type"
            else:
                kind = "plain"
        elif kind in ("space", "other"):
            kind = "plain"
        out.append((text, COLORS[kind]))
    return out


def tree(draw: ImageDraw.ImageDraw, font, small, active: str):
    draw.rectangle([0, 0, SIDEBAR, H], fill=PANEL)
    draw.text((16, 14), "PROJECT", font=small, fill=DIM)
    files = [
        ("app", 0, True), ("api", 1, True), ("leads", 2, True), ("route.ts", 3, False),
        ("components", 0, True), ("hero.tsx", 1, False), ("lib", 0, True),
        ("booking", 1, True), ("slots.ts", 2, False), ("seo", 1, True),
        ("sitemap.ts", 2, False), ("bot", 0, True), ("handlers.py", 1, False),
        ("scripts", 0, True), ("report.py", 1, False), ("package.json", 0, False),
        ("tsconfig.json", 0, False),
    ]
    y = 46
    name = active.split("/")[-1]
    for label, depth, folder in files:
        x = 14 + depth * 14
        if label == name:
            draw.rectangle([0, y - 3, SIDEBAR, y + 19], fill=LINE_ON)
        mark = "▾ " if folder else "  "
        color = DIM if folder else ((214, 220, 232) if label == name else (150, 160, 182))
        draw.text((x, y), mark + label, font=small, fill=color)
        y += 24


def frame(snippet: dict, typed: int, blink: bool, font, small, scroll_state: dict):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    tree(d, font, small, snippet["name"])

    # Вкладки и путь к файлу.
    d.rectangle([SIDEBAR, 0, W, 36], fill=PANEL)
    tab_name = snippet["name"].split("/")[-1]
    d.rectangle([SIDEBAR, 0, SIDEBAR + 190, 36], fill=TAB_ON)
    d.rectangle([SIDEBAR, 0, SIDEBAR + 190, 2], fill=ACCENT)
    d.text((SIDEBAR + 16, 9), tab_name, font=small, fill=TEXT)
    d.text((SIDEBAR + 214, 9), "README.md", font=small, fill=DIM)
    d.text((SIDEBAR + 16, 42), " › ".join(snippet["name"].split("/")), font=small, fill=DIM)

    code = snippet["code"][:typed]
    lines = code.split("\n")
    cur_line = len(lines) - 1
    cur_col = len(lines[-1])

    rows = (H - TOP - BOTTOM) // LINE_H
    first = scroll_state.get("first", 0)
    if cur_line - first > rows - 4:
        first = cur_line - (rows - 4)
    scroll_state["first"] = first

    x0 = SIDEBAR + GUTTER + 14
    char_w = font.getlength("M")
    for row in range(rows):
        n = first + row
        if n >= len(lines):
            break
        y = TOP + row * LINE_H
        if n == cur_line:
            d.rectangle([SIDEBAR, y - 2, W, y + LINE_H - 4], fill=LINE_ON)
        d.text((SIDEBAR + GUTTER - 8, y), str(n + 1), font=font, fill=DIM if n != cur_line else TEXT, anchor="ra")
        x = x0
        for text, color in tokens(lines[n], snippet["lang"]):
            d.text((x, y), text, font=font, fill=color)
            x += font.getlength(text)
        if n == cur_line and blink:
            cx = x0 + cur_col * char_w
            d.rectangle([cx, y, cx + 2, y + FONT_PX + 4], fill=(240, 244, 255))

    # Строка состояния.
    d.rectangle([0, H - BOTTOM, W, H], fill=PANEL)
    d.rectangle([0, H - BOTTOM, W, H - BOTTOM], fill=LINE_ON)
    d.ellipse([14, H - BOTTOM + 9, 22, H - BOTTOM + 17], fill=GREEN)
    d.text((30, H - BOTTOM + 4), "main", font=small, fill=(150, 160, 182))
    d.text((96, H - BOTTOM + 4), "0 problems", font=small, fill=(150, 160, 182))
    status = f"Ln {cur_line + 1}, Col {cur_col + 1}   UTF-8   {'TypeScript' if snippet['lang'] == 'ts' else 'Python'}"
    d.text((W - 14, H - BOTTOM + 4), status, font=small, fill=(150, 160, 182), anchor="ra")
    return img


def sequence(job):
    k, out, frames = job
    snippet = SNIPPETS[k]
    font = ImageFont.truetype(str(MONO), FONT_PX)
    small = ImageFont.truetype(str(MONO), 14)
    folder = Path(out) / f"seq_{k}"
    folder.mkdir(parents=True, exist_ok=True)
    code = snippet["code"]
    # Экран не пустой с первого кадра: часть файла уже набрана.
    typed = int(len(code) * (0.25 + 0.08 * k))
    speed = 1.0 + 0.35 * (k % 3)   # знаков за кадр — у каждого свой темп
    acc = 0.0
    scroll = {}
    for f in range(1, frames + 1):
        acc += speed
        # Пауза на перевод строки — как у живого человека.
        while acc >= 1 and typed < len(code):
            typed += 1
            acc -= 1 if code[typed - 1] != "\n" else 4
        if typed >= len(code):
            typed = int(len(code) * 0.2)
            scroll = {}
        blink = (f // 16) % 2 == 0
        frame(snippet, typed, blink, font, small, scroll).save(folder / f"{f:04d}.png", optimize=False, compress_level=1)
    return f"seq_{k}: {snippet['name']} — {frames} кадров"


def label(path: Path, text: str, px: int, weight: int):
    """Надпись шрифтом сайта (Unbounded) на прозрачном фоне.

    Шрифт вариативный: у его букв контуры перекрываются, и текстовый объект
    Blender заливает их с дырами. FreeType в Pillow рисует правильно, поэтому
    надписи сцены — картинками отсюда.
    """
    font = ImageFont.truetype(str(DISPLAY), px)
    font.set_variation_by_axes([weight])
    x0, y0, x1, y1 = font.getbbox(text)
    pad = px // 4
    img = Image.new("RGBA", (x1 - x0 + 2 * pad, y1 - y0 + 2 * pad), (255, 255, 255, 0))
    ImageDraw.Draw(img).text((pad - x0, pad - y0), text, font=font, fill=(255, 255, 255, 255))
    img.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--frames", type=int, default=600)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    label(out / "label_studio.png", "devuz.studio", 200, 500)
    label(out / "neon_devuz.png", "DevUz", 260, 600)
    label(out / "neon_studio.png", "Studio", 200, 400)
    jobs = [(k, args.out, args.frames) for k in range(len(SNIPPETS))]
    with Pool(min(len(jobs), os.cpu_count() or 1)) as pool:
        for line in pool.map(sequence, jobs):
            print(line)


if __name__ == "__main__":
    main()
