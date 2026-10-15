# Пролёт в виллу SIA (APx180.2606)

180 кадров для макета SIA: с долины над оливковой рощей к вилле, низко над
бассейном, через открытую створку в гостиную и разворот к окну на горы.

- `scene.py` — вся сцена кодом. Вилла — наша интерпретация по пяти рендерам
  бюро (sia88.ru, APx180.2606): три скруглённые плиты уступами, кремовые
  торцы с тёплой подсветкой снизу, стекло в пол, рифлёные травертиновые
  простенки, стеклянные ограждения с зеленью, бассейн-инфинити, каскад
  ступеней, лаванда, оливы и кипарисы. Это не рабочая модель бюро, на сайте
  так и подписано.
- `assets.py` — материалы, небо, мебель, оливы и кусты с Poly Haven (CC0).
  Кипарис и лаванда — кодом в `scene.py` (сосна Poly Haven — 17 млн
  треугольников, на раннере не помещается в память).
- `backdrop.jpg` — горы на закате для задника, сгенерированы для макета
  (gpt-image-2.5 через ProxyAPI). Светит только в камеру; свет — HDRI и солнце.

Рендер — только в Actions (`.github/workflows/blender-sia.yml`, 20 задач,
Cycles CPU + OpenImageDenoise), кадры — в ветку `renders/sia`, сжимает
`scripts/blender/arhbyuro/pack.py`. Проба локально:

    python3 scripts/blender/sia/assets.py /tmp/ph-sia
    blender -b --factory-startup -P scripts/blender/sia/scene.py -- \
        --assets /tmp/ph-sia --out /tmp/sia/f_ --frames 1,90,142,180 --samples 12 --percent 25

Похожие открытые проекты, на которые смотрели:

- [yunfanye/openhouse-3d](https://github.com/yunfanye/openhouse-3d) — дом по
  фотографиям объявления, процедурная модель в bpy, проход камерой в Cycles
  без экрана: тот же путь «фото → модель кодом → ролик».
- [atishaytuli07/frameSequenceAnimation](https://github.com/atishaytuli07/frameSequenceAnimation),
  [ChhayalPipaliya/Scrolling-image](https://github.com/ChhayalPipaliya/Scrolling-image) —
  кадры на canvas по прокрутке, как у Apple: так листается и наш пролёт.
