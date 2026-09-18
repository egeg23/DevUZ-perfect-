/**
 * Что мы знаем о клиенте — и больше на странице нет ничего.
 *
 * Прототип уходит владельцу живого бизнеса с его именем в шапке. Поэтому
 * граница жёсткая: всё, что напечатано, пришло либо с его собственного
 * сайта (через наш аудитор), либо из его ответов на первичке. Ни одного
 * поля «придумай красиво».
 *
 * Отсюда устройство типа: почти всё необязательное. Не знаем адрес — блока
 * адреса нет. Не знаем цену — в карточке услуги нет строки цены. Пустое
 * место честнее выдуманного, и это не лозунг: выдуманная цена в прототипе
 * означает, что владелец при первом же звонке клиента объясняет, почему у
 * него на сайте написано не то. Второго разговора с нами не будет.
 */
import { normalizePhone } from "@/lib/audit/contacts";
import type { ProtoLocale } from "@/content/proto/models";

/** Услуга. Цена — строкой как на его сайте: «от 50 000 сум», а не числом. */
export type ProtoService = { name: string; price?: string | null };

/**
 * Картинка с размерами.
 *
 * Размеры нужны не для вёрстки, а для решений. Логотип: у малого бизнеса он
 * почти всегда широкий — надпись, а не значок; надпись 1300×330, втиснутая в
 * квадрат 34×34, читается как грязное пятно, а рядом с ней ещё и название
 * текстом, то есть имя компании дважды. Снимок для трюка: не квадратный и
 * не крупный будет крутиться эллипсом и мылом.
 */
export type ProtoImage = { url: string; width: number; height: number };

/** Широкий логотип — это надпись с названием внутри. */
export function wordmark(logo: ProtoImage | null): boolean {
  return Boolean(logo && logo.height > 0 && logo.width / logo.height >= 2);
}

/**
 * Годится ли снимок на вращающийся трюк.
 *
 * Владелец: «шину бы с диском я взял реальную, просто анимирую её. Не
 * нарисованную». Отсюда требования, и они не придирки:
 *
 * Квадрат — потому что картинка крутится вокруг своего центра. У снимка
 * 1600×900 центр кадра не совпадает с центром колеса, и оно пойдёт по
 * орбите, как несбалансированное. Допуск ±4%: кадрируют руками.
 *
 * Не мельче 1200 px — на телефоне с тройной плотностью колесо занимает
 * около 900 физических пикселей, и снимок 600×600 растянется вдвое.
 *
 * PNG или WebP — у JPEG нет прозрачности, и вокруг колеса поедет белый
 * квадрат по тёмному фону. Проверить прозрачность по заголовку нельзя,
 * поэтому проверяем формат: это ближайшее, что машина может сказать честно.
 */
export function wheelProblems(image: ProtoImage | null): string[] {
  if (!image) return [];
  const out: string[] = [];
  const ratio = image.height > 0 ? image.width / image.height : 0;
  if (ratio < 0.96 || ratio > 1.04) out.push(`снимок не квадратный (${image.width}×${image.height}) — будет крутиться эллипсом`);
  if (image.width < WHEEL_MIN_WIDTH) out.push(`снимок мельче ${WHEEL_MIN_WIDTH} px (${image.width}) — на телефоне будет мылом`);
  if (!/\.(png|webp)($|\?)/i.test(image.url)) out.push("нужен PNG или WebP с прозрачным фоном: у JPEG вокруг колеса поедет квадрат");
  return out;
}

export type ProtoFacts = {
  /** Как компания называет себя сама. Без него прототип бессмыслен. */
  name: string;
  /** Ключ ниши из `PROTO_NICHES`. */
  niche: string;
  locale: ProtoLocale;
  /** Город — как он написан у него на сайте. */
  city: string | null;
  /** Одна строка о себе, взятая с его сайта. Не наш пересказ. */
  about: string | null;
  services: readonly ProtoService[];
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  /** Часы работы дословно с его сайта: «Пн–Сб 9:00–19:00». */
  hours: string | null;
  /** Логотип с его сайта. Размеры — чтобы понять, значок это или надпись. */
  logo: ProtoImage | null;
  /**
   * Снимок для фирменного трюка: настоящее колесо вместо нарисованного.
   *
   * Не найден на сайте и не подставляется сам — ставится руками, потому что
   * это единственное поле, где право на картинку решает человек. Пусто —
   * крутится рисунок, собранный кодом.
   */
  wheel: ProtoImage | null;
  /** Его собственные фотографии. Мелкие сюда не попадают, см. `PHOTO_MIN_WIDTH`. */
  photos: readonly string[];
  /** Откуда всё взято. Печатается в подвале прототипа. */
  source: string;
};

/**
 * Снимок с его сайта, растянутый на первый экран, портит впечатление
 * сильнее, чем его отсутствие. Порог из `proto-master`.
 */
export const PHOTO_MIN_WIDTH = 1200;

/** Снимок для трюка крутится во весь экран — ему нужен тот же порог. */
export const WHEEL_MIN_WIDTH = 1200;

export function emptyFacts(name: string, niche: string, source: string): ProtoFacts {
  return {
    name,
    niche,
    locale: "ru",
    city: null,
    about: null,
    services: [],
    phone: null,
    telegram: null,
    whatsapp: null,
    instagram: null,
    address: null,
    hours: null,
    logo: null,
    wheel: null,
    photos: [],
    source,
  };
}

export type MainAction = { href: string; kind: "telegram" | "whatsapp" | "phone" | "none" };

/**
 * Текст, который уйдёт владельцу в мессенджер по нажатию кнопки.
 *
 * Он написан от лица клиента и специально неполный — «завтра после 18».
 * Смысл кнопки в прототипе не в том, чтобы записать (расписания его
 * мастеров у нас нет), а в том, чтобы владелец увидел, как ему падает
 * сообщение. Полностью заполненный текст выглядел бы как настоящая
 * запись, которой не произошло.
 */
const GREETING: Record<ProtoLocale, (name: string) => string> = {
  ru: (name) => `Здравствуйте! Хочу записаться в «${name}». Подскажите свободное время?`,
  uz: (name) => `Assalomu alaykum! «${name}» ga yozilmoqchiman. Qaysi vaqt bo‘sh?`,
};

/** Только цифры — так номер годится и для `wa.me`, и для `tel:`. */
const digits = (phone: string) => phone.replace(/\D/g, "");

const handle = (raw: string) => raw.replace(/^@/, "").trim();

/**
 * Куда ведёт главная кнопка.
 *
 * Порядок не случайный. Телеграм первым: в Узбекистане по нему пишут
 * охотнее всего и переписка остаётся у владельца. Форма не рассматривается
 * вовсе — форма, которая ничего не отправляет, обман, а форма, которая
 * отправляет нам, забирает его обращение себе.
 */
export function mainAction(facts: ProtoFacts): MainAction {
  const text = GREETING[facts.locale](facts.name);
  if (facts.telegram) {
    return { href: `https://t.me/${handle(facts.telegram)}?text=${encodeURIComponent(text)}`, kind: "telegram" };
  }
  if (facts.whatsapp) {
    const number = digits(facts.whatsapp);
    if (number) return { href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, kind: "whatsapp" };
  }
  if (facts.phone) {
    const normal = normalizePhone(facts.phone) ?? facts.phone;
    return { href: `tel:${normal.replace(/[^\d+]/g, "")}`, kind: "phone" };
  }
  return { href: "", kind: "none" };
}

/**
 * Все числа, которые прототипу разрешено напечатать.
 *
 * Тот же приём, что у разборов: сначала собираем всё, что мы честно знаем,
 * потом проверка сверяет с этим списком каждое число на странице. Без
 * такого списка «более 5000 клиентов» проскакивает — не потому, что модель
 * врёт нарочно, а потому, что так написано на каждом втором сайте, и рука
 * сама тянется.
 */
export function factPool(facts: ProtoFacts): string {
  return [
    facts.name,
    facts.city ?? "",
    facts.about ?? "",
    facts.address ?? "",
    facts.hours ?? "",
    facts.phone ?? "",
    facts.whatsapp ?? "",
    ...facts.services.map((service) => `${service.name} ${service.price ?? ""}`),
  ].join(" ");
}

/** Есть ли чем заполнить страницу. Прототип из одного названия не отправляем. */
export function enoughToBuild(facts: ProtoFacts): string[] {
  const missing: string[] = [];
  if (!facts.name.trim()) missing.push("название компании");
  if (facts.services.length < 3) missing.push("хотя бы три услуги");
  if (mainAction(facts).kind === "none") missing.push("телеграм, ватсап или телефон для кнопки");
  return missing;
}
