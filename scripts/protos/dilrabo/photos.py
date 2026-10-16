# Фото макета Dilrabo Travel -> public/protos/dilrabo (WebP 1080 и 640 px,
# первый экран 1600 и 860). Все снимки взяты с их сайта dilrabotravel.com
# (страницы туров и направлений), список — SOURCES.md. Ничего не увеличиваем.
# python3 -I photos.py <каталог со скачанными файлами их сайта>
import sys, os, shutil
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/dilrabo")
os.makedirs(OUT, exist_ok=True)
PHOTOS = {
    "hero": "stp25_55509430_2.jpg",
    # направления
    "d-samarkand": "75608b0d902a2565ab87c648be2609337742f917.jpg",
    "d-bukhara": "c8v81i21xs84wsckww0o0s44w.jpg",
    "d-khiva": "25-khiva-islamkhodja-minaret-and-pakhalavan-makhmud-mausoleum-uzbekistan.jpg",
    "d-tashkent": "17086-2160w.jpg",
    "d-fergana": "17_2_163221.jpg",
    "d-asia": "85bacb8b9badf1d476f767aad9408c9d.jpg",
    # туры: по три снимка со страницы самого тура
    "t-charm-0": "hiva-uzbekistan-dostoprimechatelnosti-94-foto-89.webp", "t-charm-1": "original.jpg", "t-charm-2": "shutterstock_1007252167.jpg",
    "t-train-0": "stp25_55509431_2.jpg", "t-train-1": "stp25_55498150_2.jpg", "t-train-2": "154544.jpg",
    "t-express-0": "samarqand1.jpg", "t-express-1": "samarkand-eternal-city.jpg", "t-express-2": "c8700cb375c6cdb00ff8d5dba0d0fa0d.jpg",
    "t-ziarah-0": "uztas01e_titel_shutterstock_524042716_960248.jpg", "t-ziarah-1": "baafebb57f00010165400765819f842d_611681.jpg", "t-ziarah-2": "samarkand-blue-buildings-people.jpg",
    "t-ziarahf-0": "6649498_839152.jpg", "t-ziarahf-1": "54b12be83b704c566a824f3e31f2fe76_920638.jpg", "t-ziarahf-2": "40.jpg",
    "t-umra-0": "photo-6.jpg", "t-umra-1": "uzbekistan-009266ded79fabfcb462944021_957703.jpg", "t-umra-2": "75608b0d902a2565ab87c648be2609337742f917_284099.jpg",
    "t-gold-0": "f24d4e54c975654d3ddb85e406ada583.jpg", "t-gold-1": "336644681_1402915777140747_4749617325332761992_n.jpg", "t-gold-2": "three_country_silk_road_valley_tour_8_days.jpg",
    "t-fergana-0": "22.jpg", "t-fergana-1": "100-kukon_unarmandlari_219607.jpg", "t-fergana-2": "9_817450.jpg",
    "t-horses-0": "img_7867-1024x683.jpg", "t-horses-1": "img_2398-1024x683.jpg", "t-horses-2": "vodiy_tulporlar44.jpg",
}
for name, f in PHOTOS.items():
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    widths = [1600, 860] if name == "hero" else [1080, 640]
    for k, w in enumerate(widths):
        w = min(w, im.width)
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(os.path.join(OUT, f"{name}{'' if k == 0 else '-s'}.webp"), "WEBP", quality=76, method=6)
    print(name, im.size)
