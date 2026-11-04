import { defineDict } from "@/lib/admin/i18n";

/**
 * Обучение по новому виду панели (components/admin/panel-tour.tsx) —
 * 7 шагов при первом заходе. Главное в каждом шаге: поменялся вид, а
 * кнопки, права и данные — те же.
 */
export const tourDict = defineDict({
  label: { ru: "Знакомство с новой панелью", uz: "Yangi panel bilan tanishuv", pl: "Poznaj nowy panel" },
  step: {
    ru: (n: number, of: number) => `Шаг ${n} из ${of}`,
    uz: (n: number, of: number) => `${of} dan ${n}-qadam`,
    pl: (n: number, of: number) => `Krok ${n} z ${of}`,
  },
  next: { ru: "Дальше", uz: "Keyingi", pl: "Dalej" },
  back: { ru: "Назад", uz: "Orqaga", pl: "Wstecz" },
  skip: { ru: "Пропустить", uz: "O‘tkazib yuborish", pl: "Pomiń" },
  done: { ru: "Понятно, к работе", uz: "Tushunarli, ishga", pl: "Jasne, do pracy" },
  again: { ru: "Показать знакомство с панелью ещё раз", uz: "Panel bilan tanishuvni yana ko‘rsatish", pl: "Pokaż jeszcze raz poznawanie panelu" },

  s1_title: { ru: "Панель обновилась", uz: "Panel yangilandi", pl: "Panel się odświeżył" },
  s1_body: {
    ru: "Новый вид — проще и понятнее. Всё, что вы умели, работает как раньше: те же кнопки, права, лиды, касания и бот. Покажем за минуту, где что теперь лежит.",
    uz: "Yangi ko‘rinish — soddaroq va tushunarliroq. Bilgan hamma narsangiz avvalgidek ishlaydi: o‘sha tugmalar, huquqlar, lidlar, aloqalar va bot. Bir daqiqada nima qayerdaligini ko‘rsatamiz.",
    pl: "Nowy wygląd — prościej i czytelniej. Wszystko, co umiałeś, działa jak dawniej: te same przyciski, uprawnienia, leady, kontakty i bot. W minutę pokażemy, gdzie co teraz jest.",
  },
  s1_same: { ru: "Функции не менялись", uz: "Funksiyalar o‘zgarmadi", pl: "Funkcje bez zmian" },
  s1_new: { ru: "Новый вид", uz: "Yangi ko‘rinish", pl: "Nowy wygląd" },
  s1_easy: { ru: "Меньше кликов", uz: "Kamroq bosish", pl: "Mniej klikania" },

  s2_title: { ru: "Каждый день — в полосе значков", uz: "Har kuni — belgilar qatorida", pl: "Na co dzień — pasek ikon" },
  s2_body: {
    ru: "Главная, Входящие, Лиды, Задачи, Холодные касания и Макеты — одним нажатием. Наведите мышь — всплывёт название, открытый раздел светится зелёным, на «Задачах» — число ваших открытых. На телефоне эта полоса — внизу экрана.",
    uz: "Bosh sahifa, Kiruvchi, Lidlar, Vazifalar, Sovuq aloqalar va Maketlar — bitta bosishda. Sichqonchani olib boring — nomi chiqadi, ochiq bo‘lim yashil yonadi, «Vazifalar»da — ochiq vazifalaringiz soni. Telefonda bu qator ekran pastida.",
    pl: "Pulpit, Skrzynka, Leady, Zadania, Zimne kontakty i Makiety — jednym kliknięciem. Najedź myszą — pokaże się nazwa, otwarta sekcja świeci na zielono, na «Zadania» — liczba twoich otwartych. Na telefonie ten pasek jest na dole ekranu.",
  },
  s3_title: { ru: "Остальное — под «Ещё»", uz: "Qolgani — «Yana» ostida", pl: "Reszta — pod «Więcej»" },
  s3_body: {
    ru: "Деньги, Маркетинг, Команда, Отчёты и Инструкции — те же разделы, что были в меню сверху, просто собраны в одном месте. Видите вы ровно то же, что и раньше.",
    uz: "Pul, Marketing, Jamoa, Hisobotlar va Yo‘riqnoma — tepadagi menyuda bo‘lgan o‘sha bo‘limlar, faqat bir joyga yig‘ilgan. Siz avvalgidek aynan o‘sha narsani ko‘rasiz.",
    pl: "Pieniądze, Marketing, Zespół, Raporty i Instrukcje — te same sekcje, co w górnym menu, tylko zebrane w jednym miejscu. Widzisz dokładnie to samo co wcześniej.",
  },
  s4_title: { ru: "Найти что угодно", uz: "Istalgan narsani topish", pl: "Znajdź cokolwiek" },
  s4_body: {
    ru: "Поиск сверху: раздел, компания, лид, номер заявки, телефон или @ник. С компьютера — Ctrl+K из любого места панели.",
    uz: "Tepada qidiruv: bo‘lim, kompaniya, lid, ariza raqami, telefon yoki @nik. Kompyuterdan — panelning istalgan joyidan Ctrl+K.",
    pl: "Wyszukiwanie na górze: sekcja, firma, lead, numer zgłoszenia, telefon lub @nick. Z komputera — Ctrl+K z dowolnego miejsca panelu.",
  },
  s5_title: { ru: "Входящие — как мессенджер", uz: "Kiruvchi — messenjer kabi", pl: "Skrzynka — jak komunikator" },
  s5_body: {
    ru: "Слева — кто ждёт ответа, посередине — переписка и поле ответа, справа — клиент и ход сделки. На «дорого», «что за сайт?» панель сама подскажет готовый ответ — вставьте, поправьте, отправьте.",
    uz: "Chapda — kim javob kutmoqda, o‘rtada — yozishma va javob maydoni, o‘ngda — mijoz va bitim bosqichlari. «Qimmat», «qanaqa sayt?» deganda panel o‘zi tayyor javob taklif qiladi — qo‘ying, tuzating, yuboring.",
    pl: "Po lewej — kto czeka na odpowiedź, pośrodku — wątek i pole odpowiedzi, po prawej — klient i przebieg transakcji. Na «drogo», «jaka strona?» panel sam podpowie gotową odpowiedź — wstaw, popraw, wyślij.",
  },
  s6_title: { ru: "Лиды разбираются по одному", uz: "Lidlar bittadan saralanadi", pl: "Leady rozpatruje się po jednym" },
  s6_body: {
    ru: "В «Лидах» — кнопка «Разобрать лиды»: скопившиеся лиды по одному, решение в одно нажатие, сразу следующий. Спам и проверки — «🗑 В мусор», чтобы не висели в общей очереди.",
    uz: "«Lidlar»da — «Lidlarni saralash» tugmasi: to‘plangan lidlar bittadan, qaror bitta bosishda, darhol keyingisi. Spam va sinovlar — umumiy navbatda osilib turmasligi uchun «🗑 Axlatga».",
    pl: "W «Leady» — przycisk «Rozpatrz leady»: zaległe leady po jednym, decyzja jednym kliknięciem, od razu następny. Spam i testy — «🗑 Do śmieci», żeby nie wisiały w kolejce ogólnej.",
  },
  s7_title: { ru: "Вы, язык и выход — под кружком", uz: "Siz, til va chiqish — doira ostida", pl: "Ty, język i wylogowanie — pod kółkiem" },
  s7_body: {
    ru: "Кружок с вашей буквой — имя, роль, язык панели и «Выйти». И ещё: после любого нажатия экран больше не прыгает наверх, а результат — «Готово» или что пошло не так — на пару секунд всплывает сверху.",
    uz: "Harfingiz bilan doira — ism, rol, panel tili va «Chiqish». Yana: har qanday bosishdan keyin ekran endi tepaga sakramaydi, natija esa — tayyor yoki nima noto‘g‘ri ketgani — bir necha soniyaga tepada chiqadi.",
    pl: "Kółko z twoją literą — imię, rola, język panelu i «Wyloguj». I jeszcze: po każdym kliknięciu ekran nie skacze już na górę, a wynik — gotowe albo co poszło nie tak — na parę sekund pojawia się na górze.",
  },
});
