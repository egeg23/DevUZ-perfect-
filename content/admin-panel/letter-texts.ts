import { defineDict } from "@/lib/admin/i18n";

/**
 * «Тексты писем и A/B» (/admin/prospect/texts): свои тексты менеджера, общие
 * тексты команды и заходы автопрогона (lib/admin/letter-texts.ts).
 *
 * Сами тексты — это то, что уходит клиенту, они не переводятся вместе с
 * панелью. Подстановки в узбекской и польской подсказке — латиницей
 * ({tezislar}), в русской — по-русски ({тезисы}); работают обе.
 */
export const letterTextsDict = defineDict({
  link: { ru: "Тексты писем и A/B", uz: "Xat matnlari va A/B", pl: "Teksty wiadomości i A/B" },
  title: { ru: "Тексты писем и A/B", uz: "Xat matnlari va A/B", pl: "Teksty wiadomości i A/B" },
  intro: {
    ru: "Письмо о сайте уходит клиенту после его ответа на «Здравствуйте» — по вашему тексту. Факты о его сайте бот подставит сам, двумя-тремя тезисами: что не так и сколько он на этом теряет, и, если у нас есть проект в его нише, что мы это уже сделали. Два текста — это A/B: касания делятся между ними поровну, а ниже видно, на какой отвечают чаще.",
    uz: "Sayt haqidagi xat mijozga uning «Assalomu alaykum»ga javobidan keyin sizning matningiz bilan yuboriladi. Uning sayti haqidagi faktlarni bot o‘zi ikki-uch tezis bilan qo‘yadi: nima noto‘g‘ri va shu sababli qancha yo‘qotadi, agar uning nishasida loyihamiz bo‘lsa, buni allaqachon qilganimiz. Ikki matn bu A/B: aloqalar ular orasida teng bo‘linadi, pastda qaysi biriga ko‘proq javob berishlari ko‘rinadi.",
    pl: "Wiadomość o stronie trafia do klienta po jego odpowiedzi na «Dzień dobry» — z twoim tekstem. Fakty o jego stronie bot wstawi sam, w dwóch-trzech tezach: co jest nie tak i ile na tym traci, a jeśli mamy projekt w jego branży, że już to zrobiliśmy. Dwa teksty to test A/B: kontakty dzielą się po równo, a niżej widać, na który odpowiadają częściej.",
  },
  placeholders: { ru: "Подстановки", uz: "Qo‘yiladigan joylar", pl: "Wstawki" },
  phTheses: {
    ru: "{тезисы} — факты о его сайте, обязательно",
    uz: "{tezislar} — uning sayti haqidagi faktlar, majburiy",
    pl: "{tezislar} — fakty o jego stronie, obowiązkowo",
  },
  phSite: { ru: "{сайт} — его домен", uz: "{sayt} — uning domeni", pl: "{sayt} — jego domena" },
  phCompany: {
    ru: "{компания} — название, а нет его — домен",
    uz: "{kompaniya} — nomi, bo‘lmasa domen",
    pl: "{kompaniya} — nazwa, a jeśli jej brak, domena",
  },
  phName: { ru: "{имя} — ваше имя", uz: "{ism} — sizning ismingiz", pl: "{ism} — twoje imię" },
  phWho: {
    ru: "{кто} — «Это ваше имя из студии DevUz (devuz.studio)»",
    uz: "{kim} — ismingiz va studiya bilan tanishtiruv jumlasi",
    pl: "{kim} — zdanie przedstawiające: Twoje imię i studio DevUz",
  },
  phPrototype: {
    ru: "{прототип} — фраза про бесплатный прототип за 12 часов",
    uz: "{prototip} — 12 soatda bepul prototip haqidagi jumla",
    pl: "{prototip} — zdanie o darmowym prototypie w 12 godzin",
  },
  rules: {
    ru: "Без «Здравствуйте» в начале — оно уже ушло. Без технических слов, процентов, обещаний «в топ» и чисел от себя: числа — только из тезисов и «12 часов». До 100 слов вместе с тезисами.",
    uz: "Boshida salomlashmang — u allaqachon ketgan. Texnik so‘zlarsiz, foizlarsiz, «topga chiqaramiz» va’dalarisiz hamda o‘zingizdan raqamlarsiz: raqamlar faqat tezislardan va «12 soat». Tezislar bilan birga 100 so‘zgacha.",
    pl: "Bez powitania na początku — już poszło. Bez słów technicznych, procentów, obietnic «do topu» i liczb od siebie: liczby tylko z tez i «12 godzin». Do 100 słów razem z tezami.",
  },
  mine: { ru: "Мои тексты", uz: "Mening matnlarim", pl: "Moje teksty" },
  mineEmpty: {
    ru: "Своих текстов пока нет — ваши письма идут по общим текстам команды, а если их нет — по заходам автопрогона.",
    uz: "Hozircha o‘z matnlaringiz yo‘q — xatlaringiz jamoaning umumiy matnlari bilan, ular bo‘lmasa avtoyurish yondashuvlari bilan ketadi.",
    pl: "Nie masz jeszcze swoich tekstów — twoje wiadomości idą według wspólnych tekstów zespołu, a jeśli ich nie ma — według podejść autopilota.",
  },
  common: { ru: "Общие тексты команды", uz: "Jamoaning umumiy matnlari", pl: "Wspólne teksty zespołu" },
  commonNote: {
    ru: "Ими пишут те, у кого нет своих текстов. Задают руководитель и владелец.",
    uz: "Ular bilan o‘z matni yo‘qlar yozadi. Rahbar va egasi belgilaydi.",
    pl: "Piszą nimi ci, którzy nie mają własnych tekstów. Ustala je kierownik i właściciel.",
  },
  commonEmpty: { ru: "Общих текстов нет.", uz: "Umumiy matnlar yo‘q.", pl: "Brak wspólnych tekstów." },
  managers: { ru: "Тексты менеджеров", uz: "Menejerlar matnlari", pl: "Teksty menedżerów" },
  managersEmpty: {
    ru: "Своих текстов пока не завёл никто.",
    uz: "Hozircha hech kim o‘z matnini kiritmagan.",
    pl: "Nikt jeszcze nie dodał własnych tekstów.",
  },
  auto: { ru: "Заходы автопрогона", uz: "Avtoyurish yondashuvlari", pl: "Podejścia autopilota" },
  autoNote: {
    ru: "Тексты автопрогона — приёмы из курсов продаж. Ими же пишут менеджеры, у которых нет своих текстов и нет общих.",
    uz: "Avtoyurish matnlari — sotuv kurslaridan olingan usullar. Ular bilan o‘z matni ham, umumiy matn ham yo‘q menejerlar ham yozadi.",
    pl: "Teksty autopilota to techniki z kursów sprzedaży. Piszą nimi też menedżerowie, którzy nie mają własnych ani wspólnych tekstów.",
  },
  armPain: { ru: "Боль и решение", uz: "Og‘riq va yechim", pl: "Problem i rozwiązanie" },
  armPainHow: {
    ru: "PAS: что не так → чем это ему грозит → решение и один лёгкий вопрос.",
    uz: "PAS: nima noto‘g‘ri → bu unga nima bilan tahdid soladi → yechim va bitta oson savol.",
    pl: "PAS: co jest nie tak → czym mu to grozi → rozwiązanie i jedno łatwe pytanie.",
  },
  armQuestion: { ru: "Вопрос", uz: "Savol", pl: "Pytanie" },
  armQuestionHow: {
    ru: "Из SPIN: начинаем с вопроса о его потерях, потом факты, потом предложение.",
    uz: "SPIN’dan: uning yo‘qotishlari haqidagi savoldan boshlaymiz, keyin faktlar, keyin taklif.",
    pl: "Ze SPIN: zaczynamy od pytania o jego straty, potem fakty, potem propozycja.",
  },
  armRival: { ru: "Свои в нише", uz: "Nishadagi tajriba", pl: "Swoi w branży" },
  armRivalHow: {
    ru: "Социальное доказательство: первой строкой — что мы работаем в его нише. Только если такой проект у нас есть.",
    uz: "Ijtimoiy isbot: birinchi qatorda — uning nishasida ishlashimiz. Faqat bunday loyihamiz bo‘lsa.",
    pl: "Społeczny dowód: w pierwszym zdaniu, że pracujemy w jego branży. Tylko jeśli mamy taki projekt.",
  },
  slotA: { ru: "Текст 1", uz: "1-matn", pl: "Tekst 1" },
  slotB: { ru: "Текст 2", uz: "2-matn", pl: "Tekst 2" },
  slotEmpty: { ru: "Пусто.", uz: "Bo‘sh.", pl: "Pusto." },
  bodyLabel: { ru: "Текст по-русски", uz: "Ruscha matn", pl: "Tekst po rosyjsku" },
  uzLabel: {
    ru: "Свой вариант на узбекском (необязательно — иначе переведёт модель)",
    uz: "O‘zbekcha o‘z variantingiz (ixtiyoriy — aks holda model tarjima qiladi)",
    pl: "Własna wersja po uzbecku (opcjonalnie — inaczej przetłumaczy model)",
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  saving: { ru: "Сохраняем…", uz: "Saqlanmoqda…", pl: "Zapisujemy…" },
  remove: { ru: "Убрать", uz: "Olib tashlash", pl: "Usuń" },
  keep: { ru: "Оставить этот, второй убрать", uz: "Shuni qoldirish, ikkinchisini olib tashlash", pl: "Zostaw ten, drugi usuń" },
  makeCommonA: { ru: "Сделать общим текстом 1", uz: "Umumiy 1-matn qilish", pl: "Ustaw jako wspólny tekst 1" },
  makeCommonB: { ru: "Сделать общим текстом 2", uz: "Umumiy 2-matn qilish", pl: "Ustaw jako wspólny tekst 2" },
  preview: { ru: "Так увидит клиент (на примере):", uz: "Mijoz shunday ko‘radi (misolda):", pl: "Tak zobaczy klient (na przykładzie):" },
  stats: {
    ru: (sent: number, replied: number, wanted: number, deals: number) =>
      `Ушло писем: ${sent} · ответили: ${replied} · хотят макет: ${wanted} · сделок: ${deals}`,
    uz: (sent: number, replied: number, wanted: number, deals: number) =>
      `Yuborilgan xatlar: ${sent} · javob berdi: ${replied} · maket xohlaydi: ${wanted} · bitimlar: ${deals}`,
    pl: (sent: number, replied: number, wanted: number, deals: number) =>
      `Wysłane: ${sent} · odpowiedzieli: ${replied} · chcą makietę: ${wanted} · transakcje: ${deals}`,
  },
  early: {
    ru: (min: number) => `Рано судить: нужно хотя бы по ${min} ушедших писем на каждый текст.`,
    uz: (min: number) => `Xulosa qilishga erta: har bir matnga kamida ${min} tadan yuborilgan xat kerak.`,
    pl: (min: number) => `Za wcześnie na ocenę: potrzeba co najmniej ${min} wysłanych wiadomości na każdy tekst.`,
  },
  even: { ru: "Пока разницы не видно.", uz: "Hozircha farq ko‘rinmayapti.", pl: "Na razie nie widać różnicy." },
  leader: {
    ru: (name: string, pct: number) => `На «${name}» отвечают чаще — уверенность ${pct}%.`,
    uz: (name: string, pct: number) => `«${name}»ga ko‘proq javob berishadi — ishonch ${pct}%.`,
    pl: (name: string, pct: number) => `Na «${name}» odpowiadają częściej — pewność ${pct}%.`,
  },
  saved: { ru: "Сохранено.", uz: "Saqlandi.", pl: "Zapisano." },
  removed: { ru: "Убрано.", uz: "Olib tashlandi.", pl: "Usunięto." },
  failed: {
    ru: "Не сохранилось: база не ответила. Попробуйте ещё раз.",
    uz: "Saqlanmadi: baza javob bermadi. Yana urinib ko‘ring.",
    pl: "Nie zapisano: baza nie odpowiedziała. Spróbuj jeszcze raz.",
  },
});

/** Почему текст не сохранился — по коду проверки (lib/admin/letter-texts.ts). */
export const textProblemDict = defineDict({
  short: {
    ru: (min: number) => `Короче ${min} слов — не поместится ни факт, ни вопрос.`,
    uz: (min: number) => `${min} so‘zdan qisqa — na fakt, na savol sig‘adi.`,
    pl: (min: number) => `Krócej niż ${min} słów — nie zmieści się ani fakt, ani pytanie.`,
  },
  long: {
    ru: (max: number) => `Длиннее ${max} слов вместе с тезисами — на телефоне такое не дочитывают.`,
    uz: (max: number) => `Tezislar bilan birga ${max} so‘zdan uzun — telefonda bunday xatni oxirigacha o‘qishmaydi.`,
    pl: (max: number) => `Dłużej niż ${max} słów razem z tezami — na telefonie tego się nie doczytuje.`,
  },
  greeting: {
    ru: "Текст начинается с приветствия, а «Здравствуйте» уже ушло отдельным сообщением.",
    uz: "Matn salomlashuvdan boshlanadi, salom esa alohida xabar bilan allaqachon ketgan.",
    pl: "Tekst zaczyna się od powitania, a powitanie poszło już osobną wiadomością.",
  },
  invented: {
    ru: (n: string) => `Числа не из проверки сайта: ${n}. Числа — только в тезисах и «12 часов».`,
    uz: (n: string) => `Sayt tekshiruvidan bo‘lmagan raqamlar: ${n}. Raqamlar faqat tezislarda va «12 soat».`,
    pl: (n: string) => `Liczby spoza sprawdzenia strony: ${n}. Liczby tylko w tezach i «12 godzin».`,
  },
  foreign_script: {
    ru: (s: string) => `Знаки чужого письма: ${s}.`,
    uz: (s: string) => `Begona yozuv belgilari: ${s}.`,
    pl: (s: string) => `Znaki obcego pisma: ${s}.`,
  },
  jargon: {
    ru: (w: string) => `Технические слова: ${w}. Владелец бизнеса их не знает.`,
    uz: (w: string) => `Texnik so‘zlar: ${w}. Biznes egasi ularni bilmaydi.`,
    pl: (w: string) => `Słowa techniczne: ${w}. Właściciel firmy ich nie zna.`,
  },
  greets_sender: {
    ru: (name: string) => `Текст здоровается именем «${name}» — это имя того, кто пишет.`,
    uz: (name: string) => `Matn «${name}» ismi bilan salomlashadi — bu yozayotgan odamning ismi.`,
    pl: (name: string) => `Tekst wita imieniem «${name}» — to imię nadawcy.`,
  },
  banned: {
    ru: "Запрещённое в касании: «в топ», «гарантируем», проценты, эмодзи.",
    uz: "Aloqada taqiqlangan: «topga», «kafolat», foizlar, emoji.",
    pl: "Zakazane w kontakcie: «do topu», «gwarantujemy», procenty, emoji.",
  },
  foreign_reference: {
    ru: (names: string) => `Назван наш проект не из его ниши: ${names}. Проект подставится сам в тезисах, если он есть.`,
    uz: (names: string) => `Uning nishasiga tegishli bo‘lmagan loyihamiz aytilgan: ${names}. Loyiha bo‘lsa, tezislarda o‘zi qo‘yiladi.`,
    pl: (names: string) => `Wymieniono nasz projekt z innej branży: ${names}. Projekt wstawi się sam w tezach, jeśli istnieje.`,
  },
  unknown_placeholder: {
    ru: (names: string) => `Неизвестная подстановка: ${names}. Клиент увидит её фигурными скобками.`,
    uz: (names: string) => `Noma’lum qo‘yiladigan joy: ${names}. Mijoz uni jingalak qavslar bilan ko‘radi.`,
    pl: (names: string) => `Nieznana wstawka: ${names}. Klient zobaczy ją w nawiasach klamrowych.`,
  },
  no_theses: {
    ru: "Нет {тезисы}: без них письмо не о его сайте, и отвечать ему не на что.",
    uz: "{tezislar} yo‘q: ularsiz xat uning sayti haqida emas va javob berishga sabab yo‘q.",
    pl: "Brak {tezislar}: bez nich wiadomość nie jest o jego stronie i nie ma na co odpowiedzieć.",
  },
  unknown: {
    ru: "Проверка нашла в тексте то, что не даёт его сохранить.",
    uz: "Tekshiruv matnda uni saqlashga to‘sqinlik qiladigan narsani topdi.",
    pl: "Kontrola znalazła w tekście coś, co blokuje zapis.",
  },
});
