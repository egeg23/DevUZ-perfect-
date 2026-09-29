import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Надзор» (/admin/talks): разборы переписки второй моделью.
 *
 * Переводится только интерфейс. Урок, «зацепило», возражение и «сломалось»
 * пишет модель — это данные, они остаются как есть. Исходы разговора для
 * промпта модели — по-русски в lib/talk/review.ts (OUTCOME_TEXT), здесь —
 * их подписи на панели. Язык разговора — leadLocaleDict из stats.ts.
 */
export const talksDict = defineDict({
  title: { ru: "Надзор за перепиской", uz: "Yozishmalar nazorati", pl: "Nadzór nad korespondencją" },
  intro: {
    ru: "Каждый разговор, который затих больше часа назад, читает вторая модель — не та, что его вела. Она отвечает на четыре вопроса: что в нашем письме зацепило, какое возражение прозвучало, где разговор сломался и какой отсюда урок.",
    uz: "Bir soatdan ko‘proq oldin tinib qolgan har bir suhbatni ikkinchi model o‘qiydi — uni olib borgan model emas. U to‘rt savolga javob beradi: xatimizda nima e’tiborni tortdi, qanday e’tiroz bildirildi, suhbat qayerda buzildi va bundan qanday saboq olinadi.",
    pl: "Każdą rozmowę, która ucichła ponad godzinę temu, czyta drugi model — nie ten, który ją prowadził. Odpowiada na cztery pytania: co w naszej wiadomości zaciekawiło, jaki padł zarzut, gdzie rozmowa się posypała i jaka z tego lekcja.",
  },
  tileReviewed: { ru: "разобрано переписок", uz: "tahlil qilingan yozishmalar", pl: "przeanalizowane rozmowy" },
  tileLessons: { ru: "уроков с опорой на слова", uz: "so‘zlarga tayangan saboqlar", pl: "lekcje oparte na słowach" },
  tileLessonsHint: {
    ru: "Разговоры короче двух реплик урока не дают: вывод из одной реплики — догадка.",
    uz: "Ikki replikadan qisqa suhbatlar saboq bermaydi: bitta replikadan chiqarilgan xulosa — taxmin.",
    pl: "Rozmowy krótsze niż dwie wypowiedzi nie dają lekcji: wniosek z jednej wypowiedzi to domysł.",
  },
  tileRefused: { ru: "отказов", uz: "rad etishlar", pl: "odmowy" },
  tileUzbek: { ru: "на узбекском", uz: "o‘zbek tilida", pl: "po uzbecku" },
  notYet: {
    ru: "Уроки пока только копятся и никуда не подмешиваются. Учить систему на трёх разговорах нельзя: она уверенно повторит случайность. Подмешивать их в промпт первого письма начнём, когда наберётся несколько десятков ответов, — и это будет отдельное решение, ваше.",
    uz: "Saboqlar hozircha faqat to‘planmoqda va hech qayerga qo‘shilmayapti. Tizimni uchta suhbatda o‘qitib bo‘lmaydi: u tasodifni ishonch bilan takrorlaydi. Birinchi xat promptiga ularni bir necha o‘nlab javob yig‘ilganda qo‘sha boshlaymiz — va bu alohida qaror bo‘ladi, sizning qaroringiz.",
    pl: "Lekcje na razie tylko się zbierają i nigdzie nie trafiają. Nie da się uczyć systemu na trzech rozmowach: z przekonaniem powtórzy przypadek. Do promptu pierwszej wiadomości zaczniemy je dodawać, gdy uzbiera się kilkadziesiąt odpowiedzi — i to będzie osobna decyzja, Twoja.",
  },
  empty: {
    ru: "Разобранных переписок пока нет. Появятся, как только клиент ответит и разговор затихнет на час.",
    uz: "Tahlil qilingan yozishmalar hozircha yo‘q. Mijoz javob berib, suhbat bir soatga tinib qolishi bilan paydo bo‘ladi.",
    pl: "Nie ma jeszcze przeanalizowanych rozmów. Pojawią się, gdy tylko klient odpowie, a rozmowa ucichnie na godzinę.",
  },
  turns: {
    ru: (n: number) => `${n} ${plural("ru", n, "реплика", "реплики", "реплик")} клиента`,
    uz: (n: number) => `mijozning ${n} ta replikasi`,
    pl: (n: number) => `${n} ${plural("pl", n, "wypowiedź", "wypowiedzi", "wypowiedzi")} klienta`,
  },
  weak: { ru: "разговора мало — вывод слабый", uz: "suhbat kam — xulosa zaif", pl: "za mało rozmowy — wniosek słaby" },
  lead: { ru: "лид →", uz: "lid →", pl: "lead →" },
  hook: { ru: "Зацепило", uz: "E’tiborni tortdi", pl: "Zaciekawiło" },
  objection: { ru: "Возражение", uz: "E’tiroz", pl: "Zarzut" },
  failed: { ru: "Сломалось", uz: "Buzildi", pl: "Posypało się" },
});

/** Чем кончился разговор. Ключ — `TalkOutcome` из lib/talk/review.ts. */
export const talkOutcomeDict = defineDict({
  refused: { ru: "отказался", uz: "rad etdi", pl: "odmówił" },
  asked_human: { ru: "позвал человека", uz: "odamni chaqirdi", pl: "poprosił o człowieka" },
  qualified: { ru: "первичка закрыта", uz: "dastlabki suhbat yakunlandi", pl: "wstępna rozmowa zamknięta" },
  stalled: { ru: "разговор заглох", uz: "suhbat to‘xtab qoldi", pl: "rozmowa utknęła" },
  talking: { ru: "ещё идёт", uz: "hali davom etyapti", pl: "jeszcze trwa" },
});
