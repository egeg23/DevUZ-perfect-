// Цены в конструкторе лечения — не цены Asmo Clinic: на их сайте цен нет.
// Это середина рынка Ташкента по клиникам той же специализации и
// агрегаторам (docs/research/asmo.md, снято 13.10.2026), округлённо. На
// странице они подписаны как ориентир по рынку, свою цену клиника ставит в
// панели. Процедуры — только те, что названы на asmoclinic.uz.
//
// [id, направление, ru, uz, цена в сумах, за что ru, за что uz, сколько сеансов по умолчанию, максимум]
export const CATS = [
  ["diag", "Диагностика", "Diagnostika"],
  ["derm", "Дерматология", "Dermatologiya"],
  ["cosm", "Косметология", "Kosmetologiya"],
  ["phys", "Физиотерапия", "Fizioterapiya"],
];

export const ITEMS = [
  ["consult", "diag", "Приём дерматолога", "Dermatolog qabuli", 200000, "приём", "qabul", 1, 3],
  ["dscope", "diag", "Дерматоскопия, 1-3 образования", "Dermatoskopiya, 1-3 o‘sma", 100000, "осмотр", "ko‘rik", 0, 3],
  ["tscope", "diag", "Трихоскопия", "Trixoskopiya", 200000, "осмотр", "ko‘rik", 0, 2],
  ["mole", "derm", "Удаление родинки до 0,5 см", "0,5 sm gacha xolni olib tashlash", 250000, "шт.", "dona", 0, 10],
  ["papil", "derm", "Удаление папилломы", "Papillomani olib tashlash", 50000, "шт.", "dona", 0, 30],
  ["wart", "derm", "Удаление бородавки", "So‘galni olib tashlash", 150000, "шт.", "dona", 0, 20],
  ["acne", "derm", "Процедура при акне", "Akne uchun muolaja", 600000, "процедура", "muolaja", 0, 6],
  ["stac", "derm", "Сутки в стационаре", "Statsionarda bir kun", 600000, "сутки", "kun", 0, 14],
  ["peel", "cosm", "Химический пилинг", "Kimyoviy piling", 400000, "сеанс", "seans", 0, 6],
  ["meso", "cosm", "Мезотерапия лица", "Yuz mezoterapiyasi", 500000, "сеанс", "seans", 0, 6],
  ["epil", "cosm", "Эпиляция подмышек", "Qo‘ltiq epilyatsiyasi", 300000, "сеанс", "seans", 0, 10],
  ["cryo", "cosm", "Криотерапия", "Kriyoterapiya", 100000, "элемент", "element", 0, 10],
  ["ozone", "phys", "Озонотерапия, капельница", "Ozon terapiyasi, tomchilatgich", 100000, "сеанс", "seans", 0, 10],
  ["ilbi", "phys", "ИЛБИ", "ILBI", 80000, "сеанс", "seans", 0, 10],
  ["puva", "phys", "ПУВА-терапия", "PUVA terapiyasi", 100000, "сеанс", "seans", 0, 20],
  ["uv", "phys", "УФ-терапия, местная", "UV terapiyasi, mahalliy", 60000, "сеанс", "seans", 0, 20],
  ["dars", "phys", "Дарсонваль", "Darsonval", 40000, "сеанс", "seans", 0, 10],
];
