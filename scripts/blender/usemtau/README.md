# Кадры для макета Юсем Тау

Сцены собраны только кодом, руками в Blender ничего не делается.

| Кадр | Что | Где на сайте |
|---|---|---|
| `aisle` | проход металлобазы: консольные стеллажи, пакеты арматуры (торцы с синей меткой), балок, швеллера, труб, профильной трубы и листа, кран-балка, дымка и полосы света | первый экран (горизонтальный и вертикальный кадр), контакты |
| `product --kind …` | один вид проката на светлом бесшовном фоне: armatura, balka, truba, profil, shveller, ugolok, list, krug | каталог индексом, поиск, калькулятор, заявка |

Сечения по ГОСТ: арматура d16, балка 30Ш1, швеллер 16П, труба 108×4,
профильная 80×80×4, уголок 63×5, лист 8 мм. Это визуализация, не их склад:
на макете так и подписано («фото вашего склада встанет сюда»).

Ассеты Poly Haven, CC0: HDRI `empty_warehouse_01`, бетон `concrete_floor_worn_001`
(`assets.py` качает и сверяет md5).

```sh
python3 scripts/blender/usemtau/assets.py /tmp/ph-usemtau
blender -b --factory-startup -P scripts/blender/usemtau/scene.py -- \
  --assets /tmp/ph-usemtau --shot aisle --out /tmp/u/aisle-h.png --samples 96
blender -b --factory-startup -P scripts/blender/usemtau/scene.py -- \
  --assets /tmp/ph-usemtau --shot aisle --vertical --out /tmp/u/aisle-v.png --samples 96
for k in armatura balka truba profil shveller ugolok list krug; do
  blender -b --factory-startup -P scripts/blender/usemtau/scene.py -- \
    --assets /tmp/ph-usemtau --shot product --kind $k --out /tmp/u/p-$k.png --size 1000 --samples 64
done
python3 -I scripts/blender/usemtau/pack.py /tmp/u     # → public/protos/usemtau/*.webp
```

Blender 4.5.14 LTS, Cycles на процессоре: на 4 ядрах снимок проката около
2 минут, кадр склада 1920×1080 около 10 минут. Рендерили в контейнере сессии
разработки; на боевой сервер рендер не отправлять (CLAUDE.md, «Сервер не
собирает сайт»). PNG в репозиторий не кладём, только WebP из `pack.py`.
