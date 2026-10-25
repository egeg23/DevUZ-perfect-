import { defineDict } from "@/lib/admin/i18n";

/** «Настройки» (app/admin/settings, lib/admin/settings.ts) — на языке сотрудника. */
export const settingsDict = defineDict({
  title: { ru: "Настройки", uz: "Sozlamalar", pl: "Ustawienia" },
  lead: {
    ru: "Всё, что в панели настраивают, на одной странице. Своё меняется прямо здесь, остальное открывается там, где оно живёт: кнопки и права там прежние.",
    uz: "Panelda sozlanadigan hamma narsa bitta sahifada. O‘zingizniki shu yerning o‘zida o‘zgaradi, qolgani o‘z joyida ochiladi: tugmalar va huquqlar o‘sha yerda avvalgidek.",
    pl: "Wszystko, co się ustawia w panelu, na jednej stronie. Swoje zmieniasz od razu tutaj, resztę otwierasz tam, gdzie mieszka: przyciski i uprawnienia są tam jak dotąd.",
  },

  mine: { ru: "Моё", uz: "Meniki", pl: "Moje" },
  mineNote: {
    ru: "Только вам и на всех ваших устройствах: коллег это не касается.",
    uz: "Faqat sizga va barcha qurilmalaringizda: hamkasblarga ta’sir qilmaydi.",
    pl: "Tylko dla ciebie i na wszystkich twoich urządzeniach: współpracowników to nie dotyczy.",
  },
  langTitle: { ru: "Язык панели и инструкции", uz: "Panel va yo‘riqnoma tili", pl: "Język panelu i instrukcji" },
  langNote: {
    ru: "RU, UZ или PL. Тот же переключатель стоит в шапке. Сообщения бота пока по-русски.",
    uz: "RU, UZ yoki PL. Xuddi shu almashtirgich sarlavhada ham bor. Bot xabarlari hozircha ruscha.",
    pl: "RU, UZ albo PL. Ten sam przełącznik jest w nagłówku. Wiadomości bota na razie po rosyjsku.",
  },
  menuTitle: { ru: "Вид меню", uz: "Menyu ko‘rinishi", pl: "Wygląd menu" },
  menuNote: {
    ru: "Включено — группы, вкладки и поиск раздела. Выключено — все разделы одной строкой, как раньше.",
    uz: "Yoqilgan — guruhlar, yorliqlar va bo‘lim qidiruvi. O‘chirilgan — barcha bo‘limlar bir qatorda, avvalgidek.",
    pl: "Włączone — grupy, karty i wyszukiwanie sekcji. Wyłączone — wszystkie sekcje w jednym wierszu, jak dawniej.",
  },
  phoneTitle: { ru: "Уведомления на этом устройстве", uz: "Shu qurilmadagi bildirishnomalar", pl: "Powiadomienia na tym urządzeniu" },
  phoneNote: {
    ru: "Пуш приходит с тем же текстом, что бот пишет вам в Telegram. Включается на каждом телефоне и компьютере отдельно.",
    uz: "Push bot sizga Telegramda yozadigan matn bilan keladi. Har bir telefon va kompyuterda alohida yoqiladi.",
    pl: "Push przychodzi z tym samym tekstem, który bot pisze ci w Telegramie. Włącza się osobno na każdym telefonie i komputerze.",
  },
  botTitle: { ru: "Что бот присылает мне", uz: "Bot menga nimalarni yuboradi", pl: "Co bot mi wysyła" },
  botSummary: {
    ru: (summary: string) => `Сейчас: ${summary}.`,
    uz: (summary: string) => `Hozir: ${summary}.`,
    pl: (summary: string) => `Teraz: ${summary}.`,
  },
  botUnknown: {
    ru: "База не ответила: не знаю, что вам сейчас приходит.",
    uz: "Baza javob bermadi: sizga hozir nima kelayotganini bilmayman.",
    pl: "Baza nie odpowiedziała: nie wiem, co teraz do ciebie przychodzi.",
  },
  botByHead: {
    ru: "Галочки ставит руководитель или владелец в «Команде». Попросите, если что-то лишнее или не хватает.",
    uz: "Belgilarni rahbar yoki egasi «Jamoa»da qo‘yadi. Ortiqcha yoki yetishmayotgan narsa bo‘lsa, so‘rang.",
    pl: "Zaznaczenia ustawia kierownik albo właściciel w «Zespół». Poproś, jeśli czegoś jest za dużo albo brakuje.",
  },
  botEdit: { ru: "Изменить в «Команде»", uz: "«Jamoa»da o‘zgartirish", pl: "Zmień w «Zespół»" },

  touch: { ru: "Касания", uz: "Aloqalar", pl: "Kontakty" },
  team: { ru: "Команда и доступ", uz: "Jamoa va kirish", pl: "Zespół i dostęp" },
  open: { ru: "Открыть", uz: "Ochish", pl: "Otwórz" },

  t_texts: { ru: "Тексты писем и A/B", uz: "Xat matnlari va A/B", pl: "Teksty wiadomości i A/B" },
  n_texts: {
    ru: "Ваши тексты письма о сайте (до двух — это A/B), общие тексты команды и счёт, какой текст чаще получает ответ.",
    uz: "Sayt haqidagi xatingiz matnlari (ikkitagacha — bu A/B), jamoaning umumiy matnlari va qaysi matn ko‘proq javob olishi hisobi.",
    pl: "Twoje teksty wiadomości o stronie (do dwóch — to A/B), wspólne teksty zespołu i licznik, który tekst częściej dostaje odpowiedź.",
  },
  t_hello: { ru: "Первое сообщение", uz: "Birinchi xabar", pl: "Pierwsza wiadomość" },
  n_hello: {
    ru: "Приветствие, которое уходит первым с рабочего аккаунта: русское и узбекское отдельно.",
    uz: "Ishchi akkauntdan birinchi ketadigan salomlashuv: ruscha va o‘zbekcha alohida.",
    pl: "Powitanie, które idzie jako pierwsze z konta roboczego: rosyjskie i uzbeckie osobno.",
  },
  t_autopilot: { ru: "Автопрогон касаний", uz: "Avtomatik aloqalar", pl: "Automatyczne kontakty" },
  n_autopilot: {
    ru: "Норма в день, сколько ушло и ответило сегодня. Включает и выключает владелец.",
    uz: "Kunlik me’yor, bugun qanchasi ketdi va javob berdi. Egasi yoqadi va o‘chiradi.",
    pl: "Norma dzienna, ile dziś poszło i ile odpowiedziało. Włącza i wyłącza właściciel.",
  },
  t_circles: { ru: "Кружки по нишам", uz: "Sohalar bo‘yicha dumaloq videolar", pl: "Kółka według branż" },
  n_circles: {
    ru: "Кружки после ответа на «Здравствуйте»: общий русский и узбекский и свои для ниш.",
    uz: "«Assalomu alaykum»ga javobdan keyingi dumaloq videolar: umumiy ruscha va o‘zbekcha hamda sohalar uchun alohida.",
    pl: "Kółka po odpowiedzi na powitanie: ogólne rosyjskie i uzbeckie oraz osobne dla branż.",
  },
  t_accounts: { ru: "Рабочие аккаунты", uz: "Ishchi akkauntlar", pl: "Konta robocze" },
  n_accounts: {
    ru: "Номера Telegram, с которых уходят касания: подключить, проверить ограничения, выключить.",
    uz: "Aloqalar ketadigan Telegram raqamlari: ulash, cheklovlarni tekshirish, o‘chirish.",
    pl: "Numery Telegrama, z których idą kontakty: podłączyć, sprawdzić ograniczenia, wyłączyć.",
  },
  t_notices: { ru: "Что бот присылает команде", uz: "Bot jamoaga nimalarni yuboradi", pl: "Co bot wysyła zespołowi" },
  n_notices: {
    ru: "Галочки уведомлений у каждого сотрудника: «Уведомления» под его именем в «Команде».",
    uz: "Har bir xodimning bildirishnoma belgilari: «Jamoa»da ismi ostidagi «Bildirishnomalar».",
    pl: "Zaznaczenia powiadomień każdego pracownika: «Powiadomienia» pod jego imieniem w «Zespół».",
  },
  t_access: { ru: "Доступ к разделам", uz: "Bo‘limlarga kirish", pl: "Dostęp do sekcji" },
  n_access: {
    ru: "Открыть человеку раздел сверх роли или закрыть положенный: «Разделы» под его именем в «Команде».",
    uz: "Xodimga roldan tashqari bo‘limni ochish yoki tegishlisini yopish: «Jamoa»da ismi ostidagi «Bo‘limlar».",
    pl: "Otworzyć komuś sekcję ponad rolę albo zamknąć należną: «Działy» pod jego imieniem w «Zespół».",
  },
  t_unlimited: { ru: "Лиды без лимита", uz: "Cheklovsiz lidlar", pl: "Leady bez limitu" },
  n_unlimited: {
    ru: "Снять или вернуть ночной потолок по числу лидов: «Снять лимит» у человека в «Команде».",
    uz: "Lidlar soni bo‘yicha tungi chegarani olib tashlash yoki qaytarish: «Jamoa»da xodim yonidagi «Cheklovni olib tashlash».",
    pl: "Zdjąć albo przywrócić nocny limit liczby leadów: «Zdejmij limit» przy osobie w «Zespół».",
  },
  t_learn: { ru: "Обучение для команды", uz: "Jamoa uchun ta’lim", pl: "Szkolenia dla zespołu" },
  n_learn: {
    ru: "Пока выключено, раздел «Обучение» видите только вы. Включается одной кнопкой там же.",
    uz: "O‘chirilgan ekan, «Ta’lim» bo‘limini faqat siz ko‘rasiz. U yerning o‘zida bitta tugma bilan yoqiladi.",
    pl: "Dopóki wyłączone, sekcję «Szkolenia» widzisz tylko ty. Włącza się jednym przyciskiem tamże.",
  },
});
