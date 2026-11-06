import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Обучение по «Рынкам» (components/admin/markets-tour.tsx). Владелец,
 * 06.11.2026: «краткий туториал для менеджеров по новым странам разделу
 * сделай, прям очень простыми словами, подсвети нужные моменты в дашборде».
 * Кнопки «Дальше», «Назад», «Пропустить» — общие, из tourDict.
 * Названия в «ёлочках» — ровно как на экране, на языке панели.
 */
export const marketsTourDict = defineDict({
  label: { ru: "Как пользоваться «Рынками»", uz: "«Bozorlar»dan qanday foydalanish", pl: "Jak korzystać z „Rynków”" },
  again: { ru: "Показать на экране, как пользоваться «Рынками»", uz: "Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish", pl: "Pokaż na ekranie, jak korzystać z „Rynków”" },
  done: { ru: "Понятно, иду искать", uz: "Tushunarli, qidirishga", pl: "Jasne, idę szukać" },

  m1_title: { ru: "Новое: раздел «Рынки»", uz: "Yangi: «Bozorlar» bo‘limi", pl: "Nowość: dział „Rynki”" },
  m1_body: {
    ru: "Теперь мы ищем клиентов не только в Узбекистане, но и в России, Казахстане, США и других странах. В «Рынках» собрано, где в каждой стране люди ищут, кто сделает им сайт, и как там работать. Покажем за минуту.",
    uz: "Endi mijozlarni faqat O‘zbekistonda emas, Rossiya, Qozog‘iston, AQSh va boshqa mamlakatlarda ham qidiramiz. «Bozorlar»da har bir mamlakatda odamlar sayt qiladigan odamni qayerdan qidirishi va u yerda qanday ishlash kerakligi yig‘ilgan. Bir daqiqada ko‘rsatamiz.",
    pl: "Teraz szukamy klientów nie tylko w Uzbekistanie, ale też w Rosji, Kazachstanie, USA i innych krajach. W „Rynkach” zebrano, gdzie w każdym kraju ludzie szukają kogoś, kto zrobi im stronę, i jak tam pracować. Pokażemy w minutę.",
  },
  m1_countries: {
    ru: (n: number) => `${n} ${plural("ru", n, "страна", "страны", "стран")}`,
    uz: (n: number) => `${n} ta mamlakat`,
    pl: (n: number) => `${n} ${plural("pl", n, "kraj", "kraje", "krajów")}`,
  },
  m1_places: {
    ru: (n: number) => `${n} ${plural("ru", n, "площадка", "площадки", "площадок")} со ссылками`,
    uz: (n: number) => `havolali ${n} ta maydon`,
    pl: (n: number) => `${n} ${plural("pl", n, "platforma", "platformy", "platform")} z linkami`,
  },
  m1_easy: { ru: "Всё по шагам", uz: "Hammasi qadamma-qadam", pl: "Wszystko krok po kroku" },

  m2_title: { ru: "Где он лежит", uz: "U qayerda", pl: "Gdzie to jest" },
  m2_body: {
    ru: "Откройте «Холодные касания» — «Рынки» там вкладкой, рядом с «Сигналы скаута». Всё про поиск клиентов теперь в одном месте.",
    uz: "«Sovuq aloqalar»ni oching — «Bozorlar» u yerda vkladka bo‘lib, «Skaut signallari» yonida turibdi. Mijoz qidirishga oid hamma narsa endi bir joyda.",
    pl: "Otwórz „Zimne kontakty” — „Rynki” są tam zakładką, obok „Sygnały skauta”. Wszystko o szukaniu klientów jest teraz w jednym miejscu.",
  },

  m3_title: { ru: "Начните с главных стран", uz: "Asosiy mamlakatlardan boshlang", pl: "Zacznij od głównych krajów" },
  m3_body: {
    ru: "Зелёная метка «главный рынок» — Россия, Казахстан и США: начинайте с них. «пробуем» — тоже можно. «по случаю» — только если клиент пришёл сам. Нажмите на страну, чтобы открыть её.",
    uz: "Yashil «asosiy bozor» belgisi — Rossiya, Qozog‘iston va AQSh: ulardan boshlang. «sinab ko‘ramiz» — ham bo‘ladi. «imkon bo‘lganda» — faqat mijoz o‘zi kelsa. Mamlakatni ochish uchun ustiga bosing.",
    pl: "Zielona etykieta „rynek główny” — Rosja, Kazachstan i USA: zaczynaj od nich. „próbujemy” — też można. „przy okazji” — tylko gdy klient przyszedł sam. Kliknij kraj, żeby go otworzyć.",
  },

  m4_title: { ru: "Как там ищут", uz: "U yerda qanday qidirishadi", pl: "Jak tam szukają" },
  m4_body: {
    ru: "Наверху страны — коротко: где там ищут разработчика, на каком языке писать и какая разница во времени. Прочитайте один раз.",
    uz: "Mamlakat sahifasi tepasida — qisqacha: u yerda dasturchini qayerdan qidirishadi, qaysi tilda yozish kerak va vaqt farqi qancha. Bir marta o‘qib chiqing.",
    pl: "Na górze strony kraju — krótko: gdzie tam szuka się wykonawcy, w jakim języku pisać i jaka jest różnica czasu. Przeczytaj raz.",
  },

  m5_title: { ru: "«С чего начать» — ваш план", uz: "«Nimadan boshlash kerak» — sizning rejangiz", pl: "„Od czego zacząć” — twój plan" },
  m5_body: {
    ru: "Здесь несколько шагов по порядку. Просто делайте их один за другим — это и есть работа с новой страной.",
    uz: "Bu yerda tartib bilan bir necha qadam bor. Ularni birin-ketin bajaring — yangi mamlakat bilan ishlash shu.",
    pl: "Tu jest kilka kroków po kolei. Po prostu rób je jeden po drugim — to właśnie praca z nowym krajem.",
  },

  m6_title: { ru: "Площадка — одна карточка", uz: "Maydon — bitta kartochka", pl: "Platforma — jedna karta" },
  m6_body: {
    ru: "Карточка — одно место, где ищут исполнителей. Название — ссылка: нажмите, и сайт откроется. Ниже — что это и как там работать. Метка справа: «бесплатно» или «платно»; платить — только после согласования с руководителем.",
    uz: "Kartochka — ijrochilar qidiriladigan bitta joy. Nomi — havola: bosing, sayt ochiladi. Pastda — bu nima va u yerda qanday ishlash kerak. O‘ngdagi belgi: «bepul» yoki «pullik»; to‘lash — faqat rahbar bilan kelishgandan keyin.",
    pl: "Karta — jedno miejsce, gdzie szuka się wykonawców. Nazwa to link: kliknij, a strona się otworzy. Niżej — co to jest i jak tam pracować. Etykieta po prawej: „bezpłatnie” albo „płatne”; płacić — tylko po uzgodnieniu z kierownikiem.",
  },

  m7_title: { ru: "Telegram-группы — скауту", uz: "Telegram guruhlar — skautga", pl: "Grupy w Telegramie — do skauta" },
  m7_body: {
    ru: "У Telegram-групп есть кнопка «Скауту». Нажмите — скаут сам вступит в группу (до 10 в день) и будет приносить оттуда заказы в «Сигналы скаута». Вступать самим не нужно.",
    uz: "Telegram guruhlarida «Skautga» tugmasi bor. Bosing — skaut o‘zi guruhga qo‘shiladi (kuniga 10 tagacha) va u yerdan buyurtmalarni «Skaut signallari»ga olib keladi. O‘zingiz qo‘shilishingiz shart emas.",
    pl: "Grupy w Telegramie mają przycisk „Do skauta”. Kliknij — skaut sam dołączy do grupy (do 10 dziennie) i będzie przynosić stamtąd zlecenia do „Sygnały skauta”. Nie musisz dołączać sam.",
  },

  m8_title: { ru: "Главное — в четырёх строках", uz: "Eng muhimi — to‘rt qatorda", pl: "Najważniejsze — w czterech linijkach" },
  m8_1: { ru: "Откройте страну с меткой «главный рынок».", uz: "«asosiy bozor» belgisi bor mamlakatni oching.", pl: "Otwórz kraj z etykietą „rynek główny”." },
  m8_2: { ru: "Сделайте шаги из «С чего начать».", uz: "«Nimadan boshlash kerak»dagi qadamlarni bajaring.", pl: "Zrób kroki z „Od czego zacząć”." },
  m8_3: {
    ru: "Нашли заказ — пишите коротко и про задачу клиента, как в касаниях.",
    uz: "Buyurtma topdingizmi — qisqa va mijoz vazifasi haqida yozing, aloqalardagidek.",
    pl: "Znalazłeś zlecenie — pisz krótko i o zadaniu klienta, jak w kontaktach.",
  },
  m8_4: { ru: "Telegram-группы — кнопкой «Скауту».", uz: "Telegram guruhlar — «Skautga» tugmasi bilan.", pl: "Grupy w Telegramie — przyciskiem „Do skauta”." },
  m8_ask: { ru: "Что-то непонятно — спросите руководителя.", uz: "Nimadir tushunarsiz bo‘lsa — rahbardan so‘rang.", pl: "Coś niejasne — zapytaj kierownika." },
});
