# Иллюстрации Giftora

Все подарки и боксы — свои, сгенерированы gpt-image-1.5 (через ProxyAPI,
`quality: medium`, 1024×1024, `background: transparent`), 12.10.2026.
Чужих логотипов, подарков Telegram и картинок Epic Gift нет.

Общая часть промпта:

> A 2x2 grid of four separate premium 3D collectible gift icons for a top
> mobile game, consistent style. Each object sits alone in its own quadrant,
> centered, front three-quarter view, fully visible, with wide empty padding.
> Soft studio lighting, gentle rim light, rich saturated colors, smooth glossy
> materials, very high detail, crisp clean edges. Fully transparent
> background, no floor, no cast shadows, no text.

Листы (по порядку клеток атласа, `ORDER` в `atlas.py` и `ATL` в `app.js`):

1. леденец, торт со свечой, свеча, синее пламя;
2. клевер, персик, золотая звезда, плюшевый мишка;
3. лампа джинна, роза, лягушка-принц в короне, кубок;
4. зелье, синий кристалл, кольцо с бриллиантом, часы;
5. рыцарский шлем, фуражка капитана, корона, медальон-сердце;
6. плюшевый кот, боксы FREE24 (зелёный), «Стартовый» (синий), «Сладкий» (розовый);
7. FARM BOX (лаймовый с ростком), «Удача» (фиолетовый), «Ночной» (графит), «Легенда» (золотой).

Исходные листы в репозиторий не кладём (по 1,5 МБ): атлас пересобирается
`python3 atlas.py <каталог с s1.png…s7.png>`.
