/* Регистрационные удостоверения и разрешения Минздрава Узбекистана на
   препараты портфеля. Компания прислала сканы в общий чат, 28.11.2026
   (владелец: «они там сегодня накидали сертификатов… сделай»). Файлы —
   public/protos/chechfarm/certs/<file>.pdf, сжатые сканы (120 dpi).

   `keys` — препараты из catalog.mjs, к которым документ относится: в окне
   препарата — кнопка «Регистрационное удостоверение». Документ без
   препарата в каталоге (Нервогил, Мемантин-Бест, Спермотренд, L-аргинин)
   есть в общем списке на странице «Наши продукты». Новое удостоверение —
   файл и строка здесь. */
export const CERTS = [
  { file: "atoksa", name: ["Атокса", "Atoxa"], keys: ["atoksa"] },
  { file: "artkyur", name: ["Арткюр", "Artcure"], keys: ["artkyur"] },
  { file: "gution", name: ["Гутион", "Guthione"], keys: ["gution"] },
  { file: "geparigen", name: ["Гепариген", "Heparigen"], keys: ["geparigen"] },
  { file: "dilargo-caps", name: ["Диларго, капсулы", "Dilargo, capsules"], keys: ["dilargo-caps"] },
  { file: "dilargo-sol", name: ["Диларго, раствор", "Dilargo, solution"], keys: ["dilargo-sol"] },
  { file: "duinum", name: ["Дуинум", "Duinum"], keys: ["duinum"] },
  { file: "zidena", name: ["Зидена", "Zidena"], keys: ["zidena"] },
  { file: "kabrineks", name: ["Кабринекс", "Cabrinex"], keys: ["kabrineks"] },
  { file: "kamalafil", name: ["Камалафил", "Kamalafil"], keys: ["kamalafil"] },
  { file: "memantin-best", name: ["Мемантин-Бест", "Memantin-Best"], keys: [] },
  { file: "miotir", name: ["Миотир", "Miotir"], keys: ["miotir"] },
  { file: "neirodeks", name: ["Нейродекс", "Neurodex"], keys: ["neirodeks"] },
  { file: "nervogil", name: ["Нервогил", "Nervogil"], keys: [] },
  { file: "orni", name: ["Орни", "Orni"], keys: ["orni"] },
  { file: "renalof-spermotrend", name: ["Реналоф, Спермотренд", "Renalof, Spermotrend"], keys: ["renalof"] },
  { file: "somatop", name: ["Соматоп", "Somatop"], keys: ["somatop"] },
  { file: "tenozum", name: ["Тенозум", "Tenozum"], keys: ["tenozum"] },
  { file: "ticoten", name: ["Тикотен", "Ticoten"], keys: ["ticoten"] },
  { file: "femaris", name: ["Фемарис плюс", "Femaris plus"], keys: ["femaris"] },
  { file: "follitop", name: ["Фоллитоп", "Follitop"], keys: ["follitop"] },
  { file: "windmill-bad", name: ["Глюкофлекс, L-аргинин, Холестерол Контрол, Мелатонин", "Glucoflex, L-Arginine, Cholesterol Control, Melatonin"], keys: ["glucoflex", "cholesterol", "melatonin"] },
  { file: "ellezium", name: ["Эллезиум", "Ellezium"], keys: ["ellezium"] },
  { file: "elstar", name: ["Эльстар", "Elstar"], keys: ["elstar"] },
];

export const CERT_DIR = "/protos/chechfarm/certs";

/* Ключ препарата → адрес удостоверения. */
export const CERT_OF = Object.fromEntries(CERTS.flatMap((c) => c.keys.map((k) => [k, `${CERT_DIR}/${c.file}.pdf`])));
