/**
 * Бизнес-модели прототипов и ниши внутри них.
 *
 * Устройство, к которому мы пришли, отвечает на вопрос владельца: «под
 * каждую нишу свой мастер-промпт и свой готовый сайт?». Нет. Ниш в
 * Узбекистане сотни, и сто отдельных сайтов мы будем чинить сто раз.
 *
 * Уровней три, и каждый следующий меньше предыдущего:
 *
 *   1. Каркас — один на всё. Шапка, скролл, кнопка под большим пальцем,
 *      выключатель анимации, подвал. Правится один раз для всех.
 *   2. Бизнес-модель — их пять-шесть на весь рынок. «Запись на время»
 *      закрывает шиномонтаж, СТО, барбершоп, салон красоты, автомойку,
 *      детейлинг, ногтевую студию: у всех одна и та же работа страницы —
 *      человек выбирает время и приходит. Меняется слово в заголовке, а
 *      не устройство.
 *   3. Фирменный трюк — вот он уже на нишу. У модели есть свой трюк по
 *      умолчанию (циферблат со свободным временем), а ниша может его
 *      перебить: у шиномонтажа вместо циферблата крутится колесо.
 *
 * То есть «мастер-промпт на нишу» превращается в «мастер-промпт на модель
 * плюс двадцать строк на нишу». Новая ниша заводится строчкой в списке
 * ниже, а не новым сайтом.
 *
 * Палитра тоже лежит здесь. Прототип не должен выглядеть как наш сайт:
 * владелец смотрит на него, чтобы узнать свой бизнес, а не нашу студию.
 */

export type ProtoModel = "booking";

export type ProtoLocale = "ru" | "uz";

export type ProtoTone = "dark" | "light";

export type ProtoPalette = {
  ink: string;
  surface: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  /** Цвет текста на акцентной кнопке: на жёлтой кнопке белые буквы не видно. */
  accentInk: string;
};

export type ProtoNiche = {
  key: string;
  model: ProtoModel;
  /** Как называем занятие: «шиномонтаж». */
  ru: string;
  uz: string;
  /** Винительный, для «Запись в …»: «шиномонтаж», «барбершоп». */
  ruTo: string;
  uzTo: string;
  /** Трюк ниши. `null` — берётся трюк модели. */
  trick: string | null;
  tone: ProtoTone;
  palette: ProtoPalette;
  /**
   * Вопросы для первички, а не текст страницы.
   *
   * Соблазн велик: подставить «правка дисков» в услуги шиномонтажа, раз уж
   * его делают почти все. Но прототип уходит с именем живой компании, и
   * услуга, которой у неё нет, — это враньё о ней, а не украшение. Поэтому
   * список ниже никогда не рендерится: по нему менеджер спрашивает, а в
   * страницу попадает только ответ.
   */
  ask: readonly string[];
};

const DARK: ProtoPalette = {
  ink: "#07080b",
  surface: "#0e1117",
  line: "#1d222c",
  text: "#f2f5f9",
  muted: "#98a1b0",
  accent: "#ffb020",
  accentInk: "#0a0b0e",
};

const NIGHT_BLUE: ProtoPalette = {
  ink: "#070a12",
  surface: "#0d121d",
  line: "#1c2434",
  text: "#eef3fa",
  muted: "#8e9bb0",
  accent: "#4f8cff",
  accentInk: "#060911",
};

const WARM_LIGHT: ProtoPalette = {
  ink: "#fbf8f4",
  surface: "#ffffff",
  line: "#e7ded2",
  text: "#1b1713",
  muted: "#6f6559",
  accent: "#b4553a",
  accentInk: "#ffffff",
};

const COOL_LIGHT: ProtoPalette = {
  ink: "#f7f7fa",
  surface: "#ffffff",
  line: "#e3e3ea",
  text: "#14161c",
  muted: "#666c78",
  accent: "#7a4bd6",
  accentInk: "#ffffff",
};

/**
 * Ниши модели «запись на время».
 *
 * Владелец: «тут же и салоны красоты и сто и тд. Большая ниша». Отсюда и
 * порядок — сначала то, где прототип легче всего продать: шиномонтаж
 * сезонный, владелец считает деньги в неделю и решение принимает сам.
 */
export const PROTO_NICHES: readonly ProtoNiche[] = [
  {
    key: "shinomontazh",
    model: "booking",
    ru: "Шиномонтаж",
    uz: "Shinamontaj",
    ruTo: "шиномонтаж",
    uzTo: "shinamontajga",
    trick: "wheel",
    tone: "dark",
    palette: DARK,
    ask: ["Сезонное хранение шин", "Правка дисков", "Балансировка", "Ремонт проколов", "Выезд к клиенту"],
  },
  {
    key: "avtoservis",
    model: "booking",
    ru: "Автосервис",
    uz: "Avtoservis",
    ruTo: "автосервис",
    uzTo: "avtoservisga",
    trick: null,
    tone: "dark",
    palette: NIGHT_BLUE,
    ask: [
      "Регулярное ТО",
      "Замена фильтров",
      "Кузовные работы",
      "Компьютерная диагностика",
      "Ремонт двигателя",
      "Ходовая часть",
      "Замена масла",
    ],
  },
  {
    key: "avtomoyka",
    model: "booking",
    ru: "Автомойка",
    uz: "Avtomoyka",
    ruTo: "автомойку",
    uzTo: "avtomoykaga",
    trick: null,
    tone: "dark",
    palette: NIGHT_BLUE,
    ask: ["Мойка кузова", "Химчистка салона", "Полировка", "Мойка двигателя"],
  },
  {
    key: "barbershop",
    model: "booking",
    ru: "Барбершоп",
    uz: "Barbershop",
    ruTo: "барбершоп",
    uzTo: "barbershopga",
    trick: null,
    tone: "dark",
    palette: DARK,
    ask: ["Стрижка", "Борода", "Бритьё опасной бритвой", "Детская стрижка"],
  },
  {
    key: "salon-krasoty",
    model: "booking",
    ru: "Салон красоты",
    uz: "Go‘zallik saloni",
    ruTo: "салон красоты",
    uzTo: "go‘zallik saloniga",
    trick: null,
    tone: "light",
    palette: WARM_LIGHT,
    ask: ["Стрижка и укладка", "Окрашивание", "Уход за волосами", "Макияж", "Брови и ресницы"],
  },
  {
    key: "nogtevaya-studiya",
    model: "booking",
    ru: "Ногтевая студия",
    uz: "Tirnoq studiyasi",
    ruTo: "ногтевую студию",
    uzTo: "tirnoq studiyasiga",
    trick: null,
    tone: "light",
    palette: COOL_LIGHT,
    ask: ["Маникюр", "Педикюр", "Покрытие", "Наращивание", "Дизайн"],
  },
  {
    key: "detailing",
    model: "booking",
    ru: "Детейлинг",
    uz: "Detailing",
    ruTo: "детейлинг",
    uzTo: "detailingga",
    trick: null,
    tone: "dark",
    palette: DARK,
    ask: ["Полировка кузова", "Защитное покрытие", "Химчистка", "Оклейка плёнкой"],
  },
];

export function protoNicheByKey(key: string): ProtoNiche | null {
  return PROTO_NICHES.find((niche) => niche.key === key) ?? null;
}

/** Трюк по умолчанию для модели — если у ниши своего нет. */
export const MODEL_TRICK: Record<ProtoModel, string> = {
  booking: "clock",
};

export function trickFor(niche: ProtoNiche): string {
  return niche.trick ?? MODEL_TRICK[niche.model];
}
