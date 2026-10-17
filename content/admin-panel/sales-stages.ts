import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Ступени продажи (lib/admin/sales-stages.ts): блок на «Главной» владельца и
 * руководителя, «Мои ступени» менеджера, список ступени, отметки «Есть
 * интерес», «Показал макет», «Назвал цену».
 *
 * Термины — по content/admin-panel/GLOSSARY.md. Узбекский — латиницей,
 * польский — как в польских CRM.
 */

const ru = (n: number, one: string, few: string, many: string) => `${n} ${plural("ru", n, one, few, many)}`;
const pl = (n: number, one: string, few: string, many: string) => `${n} ${plural("pl", n, one, few, many)}`;

export const salesStagesDict = defineDict({
  title: { ru: "Ступени продажи", uz: "Sotuv bosqichlari", pl: "Etapy sprzedaży" },
  lead: {
    ru: "Сколько компаний дошли до каждой ступени — по фактам из базы. Каждое число открывает список.",
    uz: "Har bir bosqichga nechta kompaniya yetib keldi — bazadagi faktlar bo‘yicha. Har bir raqam ro‘yxatni ochadi.",
    pl: "Ile firm doszło do każdego etapu — według faktów z bazy. Każda liczba otwiera listę.",
  },

  // Ступени.
  written: { ru: "написали", uz: "yozdik", pl: "napisaliśmy" },
  replied: { ru: "ответили", uz: "javob berdi", pl: "odpisali" },
  interest: { ru: "интерес", uz: "qiziqish", pl: "zainteresowanie" },
  mockup: { ru: "макет ушёл", uz: "maket yuborildi", pl: "makieta wysłana" },
  shown: { ru: "показали макет", uz: "maket ko‘rsatildi", pl: "makieta pokazana" },
  priced: { ru: "цена названа", uz: "narx aytildi", pl: "cena podana" },
  paid: { ru: "оплата", uz: "to‘lov", pl: "płatność" },

  col7: { ru: "7 дней", uz: "7 kun", pl: "7 dni" },
  col30: { ru: "30 дней", uz: "30 kun", pl: "30 dni" },
  stageCol: { ru: "Ступень", uz: "Bosqich", pl: "Etap" },

  stepsTitle: { ru: "Где отваливаются — за 30 дней", uz: "Qayerda tushib qoladi — 30 kunda", pl: "Gdzie odpadają — w 30 dni" },
  step_written: {
    ru: (b: number, r: number) => `из ${ru(b, "компании", "компаний", "компаний")}, которым написали, ответили ${r}`,
    uz: (b: number, r: number) => `yozilgan ${b} kompaniyadan ${r} tasi javob berdi`,
    pl: (b: number, r: number) => `z ${pl(b, "firmy", "firm", "firm")}, do których napisaliśmy, odpisało ${r}`,
  },
  step_replied: {
    ru: (b: number, r: number) => `из ${b} ответивших интерес проявили ${r}`,
    uz: (b: number, r: number) => `javob bergan ${b} tadan ${r} tasi qiziqish bildirdi`,
    pl: (b: number, r: number) => `z ${b}, którzy odpisali, zainteresowanie wyraziło ${r}`,
  },
  step_interest: {
    ru: (b: number, r: number) => `из ${b} с интересом макет получили ${r}`,
    uz: (b: number, r: number) => `qiziqish bildirgan ${b} tadan ${r} tasi maket oldi`,
    pl: (b: number, r: number) => `z ${b} zainteresowanych makietę dostało ${r}`,
  },
  step_mockup: {
    ru: (b: number, r: number) => `из ${b} с макетом показ был у ${r}`,
    uz: (b: number, r: number) => `maket olgan ${b} tadan ${r} tasiga ko‘rsatildi`,
    pl: (b: number, r: number) => `z ${b} z makietą pokaz miało ${r}`,
  },
  step_shown: {
    ru: (b: number, r: number) => `из ${b} после показа цену назвали ${r}`,
    uz: (b: number, r: number) => `ko‘rsatilgan ${b} tadan ${r} tasiga narx aytildi`,
    pl: (b: number, r: number) => `z ${b} po pokazie cenę podano ${r}`,
  },
  step_priced: {
    ru: (b: number, r: number) => `из ${b} с названной ценой оплатили ${r}`,
    uz: (b: number, r: number) => `narx aytilgan ${b} tadan ${r} tasi to‘ladi`,
    pl: (b: number, r: number) => `z ${b} z podaną ceną zapłaciło ${r}`,
  },
  dropped: {
    ru: (n: number) => `отвалились ${n}`,
    uz: (n: number) => `${n} ta tushib qoldi`,
    pl: (n: number) => `odpadło ${n}`,
  },
  noBase: { ru: "за 30 дней никого", uz: "30 kunda hech kim yo‘q", pl: "w 30 dni nikogo" },
  paidMoney: {
    ru: (usd: string) => `поступило по ним ${usd}`,
    uz: (usd: string) => `ular bo‘yicha ${usd} tushdi`,
    pl: (usd: string) => `wpłynęło od nich ${usd}`,
  },
  honest: {
    ru: "«Лиды в работе» — по большей части компании, которым написали: лидом становилось почти каждое касание. До продажи дошли те, что в «Ступенях продажи».",
    uz: "«Ishdagi lidlar» — asosan biz yozgan kompaniyalar: deyarli har bir aloqa lidga aylanardi. Sotuvga yaqinlashganlar — «Sotuv bosqichlari»da.",
    pl: "„Leady w toku” to głównie firmy, do których napisaliśmy: leadem stawał się prawie każdy kontakt. Bliżej sprzedaży są ci w „Etapach sprzedaży”.",
  },
  leadsCaption: {
    ru: "в работе — компании, которым написали",
    uz: "ishda — biz yozgan kompaniyalar",
    pl: "w toku — firmy, do których napisaliśmy",
  },

  // Список ступени.
  listTitle: {
    ru: (stage: string) => `Ступень «${stage}»`,
    uz: (stage: string) => `«${stage}» bosqichi`,
    pl: (stage: string) => `Etap „${stage}”`,
  },
  back: { ru: "← На главную", uz: "← Bosh sahifaga", pl: "← Na pulpit" },
  p7: { ru: "за 7 дней", uz: "7 kunda", pl: "w 7 dni" },
  pprev7: { ru: "7 дней до них", uz: "undan oldingi 7 kun", pl: "7 dni wcześniej" },
  p30: { ru: "за 30 дней", uz: "30 kunda", pl: "w 30 dni" },
  pweek: { ru: "с понедельника", uz: "dushanbadan beri", pl: "od poniedziałku" },
  colOwner: { ru: "Чей", uz: "Kimniki", pl: "Czyj" },
  listNone: {
    ru: "На этой ступени за этот период никого.",
    uz: "Bu davrda bu bosqichda hech kim yo‘q.",
    pl: "Na tym etapie w tym okresie nikogo nie ma.",
  },
  listMine: {
    ru: "Здесь только ваши компании и лиды.",
    uz: "Bu yerda faqat sizning kompaniya va lidlaringiz.",
    pl: "Tu tylko Twoje firmy i leady.",
  },
  listMore: {
    ru: (n: number) => `и ещё ${n} — сузьте период`,
    uz: (n: number) => `yana ${n} ta — davrni qisqartiring`,
    pl: (n: number) => `i jeszcze ${n} — zawęź okres`,
  },
  nobody: { ru: "ничей", uz: "egasiz", pl: "niczyj" },
  notYet: { ru: "ещё нет", uz: "hali yo‘q", pl: "jeszcze nie" },

  // «Главная» менеджера.
  myTitle: { ru: "Мои ступени за неделю", uz: "Haftalik bosqichlarim", pl: "Moje etapy w tym tygodniu" },
  myLead: {
    ru: "С понедельника: ваши компании и лиды.",
    uz: "Dushanbadan beri: sizning kompaniya va lidlaringiz.",
    pl: "Od poniedziałku: Twoje firmy i leady.",
  },
  norm: {
    ru: (done: number, target: number) => `Показы макета: ${done} из ${target} за неделю`,
    uz: (done: number, target: number) => `Maket ko‘rsatish: haftada ${target} tadan ${done}`,
    pl: (done: number, target: number) => `Pokazy makiety: ${done} z ${target} w tygodniu`,
  },
  normHot: {
    ru: "Пятница, а показов нет — покажите макет хотя бы одному клиенту, по видео или вживую.",
    uz: "Juma, lekin ko‘rsatish yo‘q — maketni kamida bitta mijozga video orqali yoki yuzma-yuz ko‘rsating.",
    pl: "Piątek, a pokazów brak — pokaż makietę choć jednemu klientowi, na wideo lub na żywo.",
  },
  normDone: { ru: "Норма показов на неделю сделана.", uz: "Haftalik ko‘rsatish me’yori bajarildi.", pl: "Norma pokazów na tydzień wykonana." },
  normLeft: {
    ru: (n: number) => `осталось ${ru(n, "показ", "показа", "показов")}`,
    uz: (n: number) => `yana ${n} ta ko‘rsatish qoldi`,
    pl: (n: number) => `zostało ${pl(n, "pokaz", "pokazy", "pokazów")}`,
  },

  // Отметки.
  marksTitle: { ru: "Ступени продажи", uz: "Sotuv bosqichlari", pl: "Etapy sprzedaży" },
  markShown: { ru: "Показал макет", uz: "Maketni ko‘rsatdim", pl: "Pokazałem makietę" },
  viaVideo: { ru: "по видео", uz: "video orqali", pl: "na wideo" },
  viaLive: { ru: "вживую", uz: "yuzma-yuz", pl: "na żywo" },
  markPriced: { ru: "Назвал цену", uz: "Narxni aytdim", pl: "Podałem cenę" },
  amount: { ru: "Сумма, $", uz: "Summa, $", pl: "Kwota, $" },
  markInterest: { ru: "Есть интерес", uz: "Qiziqish bor", pl: "Jest zainteresowanie" },
  saving: { ru: "Сохраняю…", uz: "Saqlanmoqda…", pl: "Zapisuję…" },
  shownOn: {
    ru: (when: string) => `показан ${when}`,
    uz: (when: string) => `${when} ko‘rsatildi`,
    pl: (when: string) => `pokazana ${when}`,
  },
  reached: {
    ru: (when: string) => `с ${when}`,
    uz: (when: string) => `${when} dan`,
    pl: (when: string) => `od ${when}`,
  },
  markedBy: {
    ru: (who: string, when: string) => `${who}, ${when}`,
    uz: (who: string, when: string) => `${who}, ${when}`,
    pl: (who: string, when: string) => `${who}, ${when}`,
  },
  rOk: { ru: "Отмечено.", uz: "Belgilandi.", pl: "Zaznaczono." },
  rForbidden: {
    ru: "Это не ваш лид — отметить может тот, у кого он, руководитель или владелец.",
    uz: "Bu sizning lidingiz emas — uni lid kimda bo‘lsa o‘sha xodim, rahbar yoki egasi belgilashi mumkin.",
    pl: "To nie Twój lead — zaznaczyć może jego opiekun, kierownik lub właściciel.",
  },
  rBad: {
    ru: "Не хватает данных: выберите, как показали, или впишите сумму в долларах.",
    uz: "Ma’lumot yetarli emas: qanday ko‘rsatilganini tanlang yoki summani dollarda yozing.",
    pl: "Brakuje danych: wybierz, jak pokazano, albo wpisz kwotę w dolarach.",
  },
  rGone: { ru: "Лид или касание не найдены.", uz: "Lid yoki aloqa topilmadi.", pl: "Nie znaleziono leada ani kontaktu." },
  rFailed: {
    ru: "Не сохранилось — попробуйте ещё раз через минуту.",
    uz: "Saqlanmadi — bir daqiqadan keyin qayta urinib ko‘ring.",
    pl: "Nie zapisało się — spróbuj ponownie za minutę.",
  },

  // Карточки людей на «Главной».
  personShown: {
    ru: (done: number, target: number) => `показы ${done} из ${target}`,
    uz: (done: number, target: number) => `ko‘rsatish ${target} tadan ${done}`,
    pl: (done: number, target: number) => `pokazy ${done} z ${target}`,
  },
  personSales: {
    ru: (shown: number, priced: number, paid: number) => `С понедельника: показов ${shown}, названо цен ${priced}, оплат ${paid}`,
    uz: (shown: number, priced: number, paid: number) => `Dushanbadan: ko‘rsatish ${shown}, aytilgan narx ${priced}, to‘lov ${paid}`,
    pl: (shown: number, priced: number, paid: number) => `Od poniedziałku: pokazów ${shown}, podanych cen ${priced}, płatności ${paid}`,
  },
  personToday: {
    ru: (shown: number, priced: number, paid: number) => `Сегодня: показов ${shown}, названо цен ${priced}, оплат ${paid}`,
    uz: (shown: number, priced: number, paid: number) => `Bugun: ko‘rsatish ${shown}, aytilgan narx ${priced}, to‘lov ${paid}`,
    pl: (shown: number, priced: number, paid: number) => `Dziś: pokazów ${shown}, podanych cen ${priced}, płatności ${paid}`,
  },
});
