/**
 * «Делали для» — бренды, которым студия делала сайт, макет или прототип.
 *
 * Владелец, 29.10.2026: «Крупные клиенты разработанные нами — предлагаю
 * вынести их как „делали для“ и бегущая строка с их логотипами. У нас много
 * брендов, макет же это тоже работа. Я бы прям в 2 ряда пустил бегущей
 * строкой после первой Хиро секции нашей».
 *
 * Логотип — файл в `public/clients/logos/` с прозрачным фоном: на сайте он
 * маска, цвет даёт тема (components/sections/clients.tsx), поэтому
 * фон-подложка превратилась бы в сплошной прямоугольник. Растровые — WebP
 * без потерь не выше 160 точек: на экране логотип не выше 52. `ratio` —
 * ширина к высоте файла, тест сверяет его с самим файлом. Убрать бренд —
 * удалить строку и файл.
 */
export type Client = {
  slug: string;
  name: string;
  logo: string;
  ratio: number;
};

const c = (slug: string, name: string, ratio: number, ext: "svg" | "webp" = "svg"): Client => ({
  slug,
  name,
  logo: `/clients/logos/${slug}.${ext}`,
  ratio,
});

/** Два ряда: верхний идёт влево, нижний навстречу. */
export const clientRows: readonly (readonly Client[])[] = [
  [
    c("samauto", "SamAuto", 9.375, "webp"),
    c("baldinini", "Baldinini", 8.617),
    c("transtelecom", "Transtelecom", 1.96),
    c("tranio", "Tranio", 2.757),
    c("shox", "Shox International Hospital", 3.932),
    c("engelberg", "Engelberg", 4.027, "webp"),
    c("golden-house", "Golden House", 7.226),
    c("greenwell", "Greenwell", 7.145),
    c("neoline", "Neoline", 5.134),
    c("czechfarm", "CZECHFARM", 2.737, "webp"),
    c("tovar", "tovar.uz", 3.494, "webp"),
    c("soffice", "Soffice", 4.52, "webp"),
    c("global-export", "Global Export", 3.038, "webp"),
    c("foodmaxx", "FOODMAXX", 4.762, "webp"),
    c("medikor", "Medikor", 2.675, "webp"),
    c("cosmoworld", "Cosmo World", 3.441),
    c("karomat", "Karomat", 1.694, "webp"),
  ],
  [
    c("apollo", "Apollo Travel", 3.15, "webp"),
    c("akbar-rich", "Akbar Rich", 1.006, "webp"),
    c("comfort-mebel", "Comfort Mebel", 1.387, "webp"),
    c("shahar", "ShahaR.Uz", 3.081, "webp"),
    c("fintax", "FinTax", 3.663, "webp"),
    c("domtut", "DomTut", 3.259),
    c("sia", "SIA", 2.25, "webp"),
    c("webname", "Arsenal D", 4.824, "webp"),
    c("asmo", "Asmo Clinic", 3.929),
    c("automechanic", "AUTOMECHANIC", 14.771, "webp"),
    c("gazmetprod", "GAZMETPROD SERVIS", 3.448, "webp"),
    c("vtashkente", "vTashkente", 4.478, "webp"),
    c("invis", "Invis", 0.938, "webp"),
    c("medacademy", "MedAcademy", 1.5, "webp"),
    c("delta", "Delta IT-School", 1.012, "webp"),
    c("lider-prof", "LIDER PROF PROEKT", 3.862, "webp"),
    c("jiguli", "Жигули", 1.512, "webp"),
  ],
];

/** Площадь логотипа на компьютере, px²: на телефоне — 0,78 по каждой стороне. */
const AREA = 5200;
const MIN_H = 22;
const MAX_H = 52;
const MAX_W = 220;

/**
 * Размер логотипа по его пропорциям: одна площадь на всех, поэтому широкая
 * надпись и квадратный знак весят на глаз одинаково, а не по ширине ячейки.
 */
export function logoBox(ratio: number): { width: number; height: number } {
  const height = Math.min(MAX_H, Math.max(MIN_H, Math.sqrt(AREA / ratio)));
  const width = Math.min(MAX_W, height * ratio);
  return { width: Math.round(width), height: Math.round(Math.min(height, width / ratio)) };
}

