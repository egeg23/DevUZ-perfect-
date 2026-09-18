/**
 * Шкалы и шрифты прототипа: решения, принятые один раз.
 *
 * Разведка по десяти чужим сайтам (`.claude/skills/proto-master/recon.md`)
 * назвала причину, по которой наша страница выглядела самодельной, и причина
 * оказалась не в анимации и не в размере заголовка.
 *
 * Девять из десяти поставили собственную гарнитуру — у нас стоял системный
 * шрифт телефона. У них два веса — у нас было шесть. Размеры мы выбирали на
 * глаз: 74, 44, 33, 23, 19, 17, 15, 13. Заголовок при этом у нас был крупнее
 * всех относительно текста — 4,35 против максимум 3,57, — и это доказывает,
 * что «сделать больше» не лечение: мы опирались на кегль сильнее всех и всё
 * равно проигрывали.
 *
 * Отсюда этот файл. Значения берутся из списков ниже и не придумываются на
 * месте — именно ad hoc значения и есть главная причина самодельного вида.
 * Что шкалы соблюдены, проверяет машина: `protoProblems` сверяет каждый
 * `font-size` в готовой странице с `TYPE`.
 */

/**
 * Размеры шрифта.
 *
 * Не модульная шкала из отношения: дробные пиксели округляются в разных
 * браузерах по-разному. Соседи различаются не меньше чем на четверть — иначе
 * выбор между ними невозможен, и начинается «а может, 34?».
 */
export const TYPE = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72] as const;

/** Отступы и размеры: плотно в мелком конце, вразлёт в крупном. */
export const SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256] as const;

/**
 * Веса: два, и всё.
 *
 * Шесть весов — это не богатство, а отсутствие решения. Ослаблять надо
 * цветом, а не весом: текст весом 300 на телефоне в солнечный день исчезает.
 */
export const WEIGHT = { text: 400, strong: 700 } as const;

/**
 * Тени — пять ступеней, выбор по высоте над страницей, а не «какая красивее».
 *
 * У прототипа их не было вовсе: всё лежало на границе в один пиксель, и
 * поэтому страница читалась как таблица, а не как страница.
 */
export const SHADOW = {
  /** Кнопка: чуть приподнята. */
  raised: "0 1px 3px hsla(0,0%,0%,.24)",
  /** Карточка. */
  card: "0 4px 6px hsla(0,0%,0%,.22)",
  /** Карточка под курсором или в фокусе сцены. */
  lifted: "0 10px 24px hsla(0,0%,0%,.28)",
} as const;

/** Один радиус на всю страницу. Смешение острых и круглых углов всегда хуже. */
export const RADIUS = 14;

/**
 * Плавный размер между двумя соседями шкалы — и только между ними.
 *
 * Правило, которое мы раньше нарушали: крупное обязано уменьшаться быстрее
 * мелкого. Заголовок `clamp(34px, 8.4vw, 74px)` на узком экране превращался
 * в 34 px при тексте 17 — то есть в полтора раза крупнее текста, тогда как
 * на широком он был крупнее в четыре. Одна и та же страница на телефоне и на
 * компьютере выглядела двумя разными.
 */
export function fluid(min: number, max: number): string {
  const lo = TYPE.indexOf(min as (typeof TYPE)[number]);
  const hi = TYPE.indexOf(max as (typeof TYPE)[number]);
  if (lo < 0 || hi < 0 || hi <= lo) throw new Error(`Размеры ${min} и ${max} должны быть из TYPE, и min меньше max`);
  // Наклон считается по ширине от 380 до 1240 px: ниже 380 экранов почти нет,
  // выше 1240 заголовку расти незачем.
  const slope = ((max - min) / (1240 - 380)) * 100;
  const base = min - (slope * 380) / 100;
  return `clamp(${min}px, ${base.toFixed(2)}px + ${slope.toFixed(3)}vw, ${max}px)`;
}

/**
 * Серый ряд — один на все ниши.
 *
 * Серым занята почти вся страница: текст, фоны, панели, границы. Трёх
 * оттенков всегда не хватает, поэтому их девять. Ниши отличаются не серым, а
 * акцентом и гарнитурой — ровно так это устроено у всех десяти разобранных
 * сайтов.
 *
 * Записаны в HSL, а не в hex: `hsl(220 14% 12%)` и `hsl(220 10% 62%)` видно,
 * что родственники, а `#1a1d22` и `#8f96a3` — нет.
 */
export const DARK = {
  900: "hsl(222 22% 5%)",
  800: "hsl(222 20% 8%)",
  700: "hsl(221 18% 12%)",
  600: "hsl(220 16% 17%)",
  500: "hsl(220 13% 26%)",
  400: "hsl(220 11% 42%)",
  300: "hsl(220 12% 62%)",
  200: "hsl(220 16% 80%)",
  100: "hsl(220 24% 94%)",
} as const;

export const LIGHT = {
  900: "hsl(25 18% 10%)",
  800: "hsl(25 14% 18%)",
  700: "hsl(25 11% 32%)",
  600: "hsl(25 9% 45%)",
  500: "hsl(25 10% 58%)",
  400: "hsl(28 14% 74%)",
  300: "hsl(30 20% 86%)",
  200: "hsl(32 30% 93%)",
  100: "hsl(36 40% 97%)",
} as const;

/** Акцент ниши: сам цвет, приглушённый для крупных полей и цвет текста на нём. */
export type Accent = { base: string; soft: string; ink: string };

export type FontPair = {
  /** Заголовочная гарнитура. Обязана иметь кириллицу, см. `FONTS`. */
  display: string;
  text: string;
  /** Вес заголовка: у Unbounded и Oswald своя «чёрнота». */
  displayWeight: number;
  /** Набирать ли заголовок заглавными. У узких гротесков так и задумано. */
  caps: boolean;
  /** Трекинг заголовка: у широких гарнитур отрицательный вредит. */
  tracking: string;
  /** Что грузить с Google Fonts. */
  href: string;
};

const font = (
  display: string,
  text: string,
  displayWeight: number,
  caps: boolean,
  tracking: string,
  href: string,
): FontPair => ({ display, text, displayWeight, caps, tracking, href });

const g = (query: string) => `https://fonts.googleapis.com/css2?${query}&display=swap`;

/**
 * Гарнитуры по нишам — и все с кириллицей.
 *
 * Это не придирка, а условие. `ui-ux-pro-max` на запрос про автосервис
 * предлагает Syncopate, Space Mono, Barlow Condensed, Archivo Black — и ни у
 * одной из них кириллицы нет. Прототип на русском с такой парой ломается
 * посреди заголовка: половина слова набрана фирменным шрифтом, половина
 * системным. Выглядит это хуже, чем системный шрифт целиком.
 *
 * Проверено по данным самого навыка (`data/google-fonts.csv`, колонка
 * подмножеств), а не по памяти.
 */
export const FONTS: Record<string, FontPair> = {
  shinomontazh: font(
    "Unbounded",
    "Inter",
    800,
    true,
    "-0.01em",
    g("family=Unbounded:wght@600;800&family=Inter:wght@400;700"),
  ),
  avtoservis: font(
    "Oswald",
    "Inter",
    700,
    true,
    "0.01em",
    g("family=Oswald:wght@500;700&family=Inter:wght@400;700"),
  ),
  avtomoyka: font(
    "Russo One",
    "Manrope",
    400,
    true,
    "0.01em",
    g("family=Russo+One&family=Manrope:wght@400;700"),
  ),
  barbershop: font(
    "Oswald",
    "Manrope",
    700,
    true,
    "0.02em",
    g("family=Oswald:wght@500;700&family=Manrope:wght@400;700"),
  ),
  detailing: font(
    "Unbounded",
    "Manrope",
    700,
    true,
    "-0.01em",
    g("family=Unbounded:wght@500;700&family=Manrope:wght@400;700"),
  ),
  "salon-krasoty": font(
    "Playfair Display",
    "Montserrat",
    700,
    false,
    "-0.01em",
    g("family=Playfair+Display:wght@500;700&family=Montserrat:wght@400;700"),
  ),
  "nogtevaya-studiya": font(
    "Cormorant",
    "Montserrat",
    700,
    false,
    "0em",
    g("family=Cormorant:wght@500;700&family=Montserrat:wght@400;700"),
  ),
};

/** Пара для ниши, которой своей не завели. Inter есть кириллица, и он нейтрален. */
export const FALLBACK_FONT = font(
  "Inter",
  "Inter",
  700,
  false,
  "-0.01em",
  g("family=Inter:wght@400;700;800"),
);

export function fontsFor(niche: string): FontPair {
  return FONTS[niche] ?? FALLBACK_FONT;
}

/**
 * Готовые роли цвета для страницы.
 *
 * В вёрстке ссылаются на роли, а не на ступени ряда: `--text` и `--surface`,
 * а не `--grey-300`. Иначе светлая ниша потребует переписать каждое правило,
 * а не одну эту таблицу.
 *
 * `faint` — только для крупного и для украшений: на тёмном ряду это 42%
 * светлоты, и для строки текста в солнечный день на телефоне этого мало.
 */
export type Skin = {
  ink: string;
  surface: string;
  surface2: string;
  line: string;
  lineStrong: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
};

export function skinFor(tone: "dark" | "light", accent: Accent): Skin {
  if (tone === "dark") {
    return {
      ink: DARK[900],
      surface: DARK[800],
      surface2: DARK[700],
      line: DARK[600],
      lineStrong: DARK[500],
      text: DARK[100],
      muted: DARK[300],
      faint: DARK[400],
      accent: accent.base,
      accentSoft: accent.soft,
      accentInk: accent.ink,
    };
  }
  return {
    ink: LIGHT[100],
    surface: "hsl(0 0% 100%)",
    surface2: LIGHT[200],
    line: LIGHT[300],
    lineStrong: LIGHT[400],
    text: LIGHT[900],
    muted: LIGHT[700],
    faint: LIGHT[600],
    accent: accent.base,
    accentSoft: accent.soft,
    accentInk: accent.ink,
  };
}
