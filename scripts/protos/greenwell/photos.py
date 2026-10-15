"""Фото товаров Greenwell: их собственные снимки с их витрины на Uzum Market
(магазин Greenwell, https://uzum.uz/ru/shop/greenwell), не хотлинком.

  python3 -I scripts/protos/greenwell/photos.py [папка-кэша]

- лицо банки (`p-<товар>.webp`, `p-<товар>-s.webp`): банка вырезана из белого
  фона, прозрачный фон, 900 и 440 px по высоте (у Q10 банка с greenwell.uz,
  на Uzum нет снимка на белом);
- галерея (`g-<товар>-<n>.webp`): инфографика, этикетка с составом, снимки
  в интерьере, 760 px по ширине;
- заключение санэпидслужбы (`c-<товар>.webp`), где магазин его выложил.

Источники и номера снимков — SOURCES.md.
"""
import os, sys, urllib.request
from PIL import Image, ImageFilter, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "../../../public/protos/greenwell"))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out", "src")
os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

# товар: (лицо банки, [галерея], заключение)
P = {
    "mgc":   ("d396mbl2llnbilepif30", ["dakcgkdkiblcbcb6ns7g", "dakcgkfvj3hq80c1cc10", "d396mbl2llnbilepif3g"], "dapmnrqh5m4nem28k8h0"),
    "mgb":   ("d396lpt2llnbilepieug", ["da8mudnac9cc164l0sbg", "d396lpo9oh640qb7pb00"], None),
    "sleep": ("d396jrg9oh640qb7pal0", ["d8251521146tv06vs3rg", "d396jrniub30vbrv8tug"], "d3ag7jd2lln52upudt2g"),
    "se":    ("d38edsviub30vbrv1r70", ["d396ta34eu2s0bgjcmtg"], None),
    "q10":   ("site:tild3566-3835-4039-b461-623762386638/0_17.png", ["d3kfpc0n274rv9ipjr7g", "da8musafa6ro5o4nbll0", "d824trs9g1ktqmlmc850", "d396h5fiub30vbrv8t3g"], None),
    "om":    ("d396nib4eu2s0bgjckt0", ["d396nib4eu2sajck5nb0", "d396ni89oh640qb7pbgg"], "d3aiktq1146g78h3mvdg"),
    "multi": ("d396kvfiub30vbrv8ucg", ["d8250ebsv8vo2t0e9c40", "d396kvfiub30vbrv8ud0"], None),
    "zinc":  ("d396j3viub30vbrv8tqg", ["d824u9k9g1ktqmlmc8h0", "d396j3t2llnbilepie5g"], None),
    "glu":   ("d396hhj4eu2s0bgjcj7g", ["da8mv4he6phbsqqld8l0", "d824tb3sv8vo2t0e99i0", "d396hhj4eu2sajck5lpg"], "d39ud9a1146g78h3h5l0"),
    "wl":    ("d396i809oh640qb7paa0", ["d824sursv8vo2t0e9970", "d396i87iub30vbrv8tg0"], "d39umrlr1spqpknjdoig"),
    "d3":    ("d396pqq298hfmibv7lq0", ["d824utk9g1ktqmlmc920", "d396pqo9oh640qb7pc5g"], "d3aiq521146g78h3n220"),
    "vc":    ("d4dg0utsp2tr82i4vf20", ["da8mv91e6phbsqqld8q0", "d4emq9mj76ooegrlp5q0", "d824ul49g1ktqmlmc8o0", "d4eoa7lv2sjnqk4hktrg", "d4dg0v6j76ooegrlce90"], None),
    "nails": ("d396ipr4eu2s0bgjcjgg", ["d8253fjsv8vo2t0e9er0", "d396iq2298hfmibv7jog"], "d3acscdr1spqpknjgf30"),
}

def get(i):
    if i.startswith("site:"):
        # На Uzum у Q10 нет снимка на белом: банка с их сайта, уже без фона.
        f = os.path.join(CACHE, "site-" + i.split("/")[-1])
        if not os.path.exists(f):
            urllib.request.urlretrieve("https://static.tildacdn.net/" + i[5:], f)
        return Image.open(f).convert("RGBA")
    f = os.path.join(CACHE, i + ".jpg")
    if not os.path.exists(f):
        urllib.request.urlretrieve(f"https://images.uzum.uz/{i}/t_product_high.jpg", f)
    return Image.open(f).convert("RGB")

def cutout(im):
    """Белый фон вокруг банки — прозрачный: заливка от краёв по почти белому."""
    w, h = im.size
    mask = Image.new("L", (w + 2, h + 2), 0)
    big = Image.new("RGB", (w + 2, h + 2), (255, 255, 255)); big.paste(im, (1, 1))
    ImageDraw.floodfill(big, (0, 0), (255, 0, 255), thresh=34)
    px = big.load(); m = mask.load()
    for y in range(h + 2):
        for x in range(w + 2):
            if px[x, y] == (255, 0, 255): m[x, y] = 0
            else: m[x, y] = 255
    mask = mask.crop((1, 1, w + 1, h + 1)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
    rgba = im.convert("RGBA"); rgba.putalpha(mask)
    box = mask.point(lambda v: 255 if v > 24 else 0).getbbox()
    return rgba.crop(box)

def fit_h(im, h):
    k = h / im.height
    return im.resize((max(1, round(im.width * k)), h), Image.LANCZOS) if k < 1 else im

def fit_w(im, w):
    k = w / im.width
    return im.resize((w, round(im.height * k)), Image.LANCZOS) if k < 1 else im

for key, (front, gal, cert) in P.items():
    src = get(front)
    c = src.crop(src.getchannel("A").getbbox()) if src.mode == "RGBA" else cutout(src)
    fit_h(c, 900).save(os.path.join(OUT, f"p-{key}.webp"), "WEBP", quality=82, method=6)
    fit_h(c, 440).save(os.path.join(OUT, f"p-{key}-s.webp"), "WEBP", quality=80, method=6)
    for n, g in enumerate(gal):
        fit_w(get(g), 760).save(os.path.join(OUT, f"g-{key}-{n}.webp"), "WEBP", quality=74, method=6)
    if cert:
        fit_w(get(cert), 760).save(os.path.join(OUT, f"c-{key}.webp"), "WEBP", quality=70, method=6)
    print(key, c.size, len(gal), bool(cert))
