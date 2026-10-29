/**
 * «Делали для» — бренды, которым студия делала сайт, макет или прототип.
 *
 * Владелец, 29.10.2026: «Крупные клиенты разработанные нами — предлагаю
 * вынести их как „делали для“ и бегущая строка с их логотипами. У нас много
 * брендов, макет же это тоже работа. Я бы прям в 2 ряда пустил бегущей
 * строкой после первой Хиро секции нашей».
 *
 * Логотип — файл в `public/clients/` с прозрачным фоном: на сайте он маска,
 * цвет даёт тема (components/sections/clients.tsx), поэтому фон-подложка
 * превратилась бы в сплошной прямоугольник. `ratio` — ширина к высоте файла,
 * тест сверяет его с самим файлом. Убрать бренд — удалить строку и файл.
 */
export type Client = {
  slug: string;
  name: string;
  logo: string;
  ratio: number;
};

const c = (slug: string, name: string, ratio: number, ext: "svg" | "png" = "svg"): Client => ({
  slug,
  name,
  logo: `/clients/${slug}.${ext}`,
  ratio,
});

/** Два ряда: верхний идёт влево, нижний навстречу. */
export const clientRows: readonly (readonly Client[])[] = [
  [],
  [],
];

/** Площадь логотипа на компьютере, px²: на телефоне — 0,78 по каждой стороне. */
const AREA = 5200;
const MIN_H = 22;
const MAX_H = 52;
const MAX_W = 200;

/**
 * Размер логотипа по его пропорциям: одна площадь на всех, поэтому широкая
 * надпись и квадратный знак весят на глаз одинаково, а не по ширине ячейки.
 */
export function logoBox(ratio: number): { width: number; height: number } {
  const height = Math.min(MAX_H, Math.max(MIN_H, Math.sqrt(AREA / ratio)));
  const width = Math.min(MAX_W, height * ratio);
  return { width: Math.round(width), height: Math.round(Math.min(height, width / ratio)) };
}

void c;
