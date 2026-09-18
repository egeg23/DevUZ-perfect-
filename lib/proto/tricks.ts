/**
 * Фирменный трюк: рисунок, который крутится под скролл.
 *
 * Здесь только картинка и то, на сколько градусов она проворачивается.
 * Сцена, карточки, запасной путь для старых браузеров — всё это общее и
 * живёт в модели. Иначе каждый новый трюк тащил бы за собой копию сцены, и
 * через пять ниш мы чинили бы одну и ту же ошибку в пяти местах.
 *
 * Рисунки собраны кодом, а не взяты из стоков. Причина практическая, а не
 * гордость: колесо из стока стоит на сайте каждого второго конкурента,
 * весит триста килобайт и не крутится. Наше весит четыре килобайта,
 * крутится видеокартой и не повторяется ни у кого.
 *
 * Цифр в рисунках нет. Циферблат с числами 1–12 выглядит очевидно, но
 * прототип проверяется машиной на числа, которых нет в фактах, и часовые
 * деления — это ровно они. Поэтому деления без подписей: так и современнее.
 */
import type { Skin } from "@/lib/proto/design";
import type { ProtoImage } from "@/lib/proto/facts";

export type Trick = {
  key: string;
  /** Разметка трюка. `spin` — класс на том, что должно вращаться. */
  html: string;
  /** На сколько провернётся за проход сцены. */
  spinDeg: number;
  /** Настоящий снимок вместо рисунка. Проверке нужно знать, что он есть. */
  photo: boolean;
};

const ring = (count: number, draw: (index: number, angle: number) => string): string =>
  Array.from({ length: count }, (_, index) => draw(index, (360 / count) * index)).join("");

/**
 * Колесо для шиномонтажа.
 *
 * Владелец: «рядовая замена шин — листаешь вниз — начинает крутиться колесо
 * выкидывая информацию». Это оно.
 */
function wheel(palette: Skin): string {
  const tread = ring(
    44,
    (_, angle) =>
      `<rect x="115.4" y="6" width="9.2" height="17" rx="3" fill="#20242c" transform="rotate(${angle.toFixed(2)} 120 120)"/>`,
  );

  // Окна между спицами. Пять «капель» остриём к ступице — между ними сами
  // собой получаются пять спиц, и рисовать их отдельно не нужно.
  const windows = ring(
    5,
    (_, angle) =>
      `<path transform="rotate(${angle} 120 120)" fill="${palette.ink}" d="M120 46c13 0 21 11 20 21l-7 26c-1 6-6 9-13 9s-12-3-13-9l-7-26c-1-10 7-21 20-21z"/>`,
  );

  const lugs = ring(
    5,
    (_, angle) =>
      `<circle cx="120" cy="107" r="4.2" fill="#0d0f13" transform="rotate(${angle} 120 120)"/>`,
  );

  return `<svg viewBox="0 0 240 240" width="240" height="240" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="wheel-rim" cx="38%" cy="30%" r="78%">
      <stop offset="0" stop-color="#e9edf3"/>
      <stop offset=".55" stop-color="#9aa3b1"/>
      <stop offset="1" stop-color="#5d6470"/>
    </radialGradient>
    <radialGradient id="wheel-hub" cx="40%" cy="32%" r="70%">
      <stop offset="0" stop-color="#cdd4de"/>
      <stop offset="1" stop-color="#6d7482"/>
    </radialGradient>
    <linearGradient id="wheel-gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/>
      <stop offset=".6" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g class="spin">
    <circle cx="120" cy="120" r="104" fill="none" stroke="#14171d" stroke-width="32"/>
    ${tread}
    <circle cx="120" cy="120" r="88" fill="none" stroke="#0a0c10" stroke-width="5"/>
    <circle cx="120" cy="120" r="84" fill="url(#wheel-rim)"/>
    ${windows}
    <circle cx="120" cy="120" r="24" fill="url(#wheel-hub)"/>
    ${lugs}
    <circle cx="120" cy="120" r="7" fill="#454b56"/>
  </g>
  <circle cx="120" cy="120" r="120" fill="url(#wheel-gloss)"/>
</svg>`;
}

/**
 * Циферблат — трюк самой модели «запись на время».
 *
 * Достаётся любой нише, у которой нет своего: барбершопу, автомойке,
 * салону. Стрелка идёт по кругу, деления подсвечиваются. Чисел на
 * циферблате нет намеренно — см. заголовок файла.
 */
function clock(palette: Skin): string {
  const ticks = ring(60, (index, angle) => {
    const big = index % 5 === 0;
    return `<rect x="${big ? 118.6 : 119.3}" y="${big ? 16 : 18}" width="${big ? 2.8 : 1.4}" height="${
      big ? 14 : 9
    }" rx=".7" fill="${big ? palette.accent : palette.muted}" opacity="${big ? 1 : 0.45}" transform="rotate(${angle} 120 120)"/>`;
  });

  return `<svg viewBox="0 0 240 240" width="240" height="240" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="clock-face" cx="42%" cy="34%" r="80%">
      <stop offset="0" stop-color="${palette.surface}"/>
      <stop offset="1" stop-color="${palette.ink}"/>
    </radialGradient>
  </defs>
  <circle cx="120" cy="120" r="112" fill="url(#clock-face)" stroke="${palette.line}" stroke-width="2"/>
  <circle cx="120" cy="120" r="98" fill="none" stroke="${palette.line}" stroke-width="1"/>
  ${ticks}
  <g class="spin">
    <rect x="117.5" y="44" width="5" height="80" rx="2.5" fill="${palette.accent}"/>
    <circle cx="120" cy="120" r="9" fill="${palette.accent}"/>
    <circle cx="120" cy="120" r="3.4" fill="${palette.ink}"/>
  </g>
</svg>`;
}

const BUILDERS: Record<string, { build: (palette: Skin) => string; spinDeg: number }> = {
  wheel: { build: wheel, spinDeg: 540 },
  clock: { build: clock, spinDeg: 720 },
};

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Настоящий снимок вместо рисунка.
 *
 * Владелец: «шину бы с диском я взял реальную, просто анимирую её. Не
 * нарисованную». Снимок крутится тем же способом, что и рисунок, — тем же
 * классом, по той же прокрутке, — поэтому подмена не трогает ни сцену, ни
 * карточки, ни запасной путь для старых браузеров.
 *
 * `alt` пустой намеренно: колесо здесь — украшение, а не сведения. Читалка
 * экрана, объявляющая «колесо», перебивает человеку заголовок, ради
 * которого он и пришёл.
 *
 * Требования к файлу живут в `wheelProblems` и проверяются до сборки:
 * квадрат, не мельче 1200 px, PNG или WebP. Кривой снимок пойдёт по орбите
 * как несбалансированное колесо, и выглядеть это будет дёшево.
 */
function photoWheel(image: ProtoImage): string {
  return `<img class="spin shot" src="${esc(image.url)}" alt="" width="${image.width}" height="${image.height}" fetchpriority="high" decoding="async">`;
}

export function trick(key: string, palette: Skin, image?: ProtoImage | null): Trick {
  if (image) return { key: "photo", html: photoWheel(image), spinDeg: BUILDERS[key]?.spinDeg ?? 540, photo: true };
  const found = BUILDERS[key] ?? BUILDERS.clock;
  return { key: BUILDERS[key] ? key : "clock", html: found.build(palette), spinDeg: found.spinDeg, photo: false };
}

export const TRICK_KEYS = Object.keys(BUILDERS);
