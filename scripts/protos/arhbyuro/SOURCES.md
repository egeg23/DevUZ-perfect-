# Источники графики

## Рендеры: свои, Blender

Все кадры (первый экран, пролёт, галерея четырёх проектов) — рендер сцены
`scripts/blender/arhbyuro`, собранной кодом, Cycles на процессоре в GitHub
Actions. Геометрия зданий, мебель-диваны, столы, скамьи — наши.

## Poly Haven, CC0

https://polyhaven.com/license — можно в коммерческом проекте, без указания
автора. Список — `scripts/blender/arhbyuro/assets.py`:

- небо: `kloofendal_38d_partly_cloudy_puresky`;
- материалы: `concrete_slab_wall`, `marble_01`, `grey_oak_veneer_01`,
  `oak_veneer_01`, `white_plaster_02`, `concrete_wall_008`, `leafy_grass`,
  `gravel_floor`, `rough_linen`, `poly_wool_herringbone`,
  `long_white_tiles`, `white_sandstone_blocks_02`;
- модели: `mid_century_lounge_chair`, `modern_ceiling_lamp_01`,
  `ceramic_vase_01`, `ceramic_vase_03`, `pachira_aquatica_01`,
  `potted_plant_02`, `jacaranda_tree`, `island_tree_02`, `shrub_02`,
  `shrub_04`.

## Карта

Natural Earth 1:110m land, общественное достояние
(https://www.naturalearthdata.com/about/terms-of-use/), `worldmap.py`.

## ProxyAPI

Не использовался: **0 ₽ из 200 ₽**. Ключа ProxyAPI в этой сессии нет, а
всё нужное для фотореализма (небо, материалы, мебель, деревья) нашлось на
Poly Haven под CC0 — это лучше сгенерированных текстур: у них настоящие
карты шероховатости и нормалей.

## Шрифты

Google Fonts: Cormorant Garamond (400) и Inter Tight (400, 700), обе с
кириллицей, лицензия OFL.
