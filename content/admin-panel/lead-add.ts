import { defineDict } from "@/lib/admin/i18n";

/**
 * «Добавить лид вручную» над списком лидов (components/admin/lead-add.tsx).
 * Владелец, 05.10.2026: «чтобы мы могли добавлять клиентов руками не в
 * проект, а в лидах».
 */
export const leadAddDict = defineDict({
  open: { ru: "Добавить лид вручную", uz: "Lidni qo‘lda qo‘shish", pl: "Dodaj leada ręcznie" },
  help: { ru: "Как добавить лид вручную", uz: "Lidni qo‘lda qanday qo‘shish", pl: "Jak dodać leada ręcznie" },
  leadSelf: {
    ru: "Клиент пришёл мимо сайта и бота — позвонил, пришёл по рекомендации, встретились лично. Запишите его здесь: лид сразу в работе у вас, с номером заявки и напоминанием через 4 часа «что дальше?».",
    uz: "Mijoz sayt va botni chetlab keldi — qo‘ng‘iroq qildi, tavsiya bo‘yicha keldi yoki shaxsan uchrashdingiz. Uni shu yerda yozib qo‘ying: lid darhol sizda ishda bo‘ladi, ariza raqami va 4 soatdan keyin «keyin nima?» eslatmasi bilan.",
    pl: "Klient przyszedł z pominięciem strony i bota — zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście. Zapisz go tutaj: lead od razu jest w Twojej pracy, z numerem zgłoszenia i przypomnieniem za 4 godziny „co dalej?”.",
  },
  leadAssign: {
    ru: "Клиент пришёл мимо сайта и бота — позвонил, пришёл по рекомендации, встретились лично. Запишите его здесь: лид сразу в работе у того, кого выберете, с номером заявки и напоминанием через 4 часа «что дальше?». Отдали другому — ему сразу придёт сообщение в Telegram.",
    uz: "Mijoz sayt va botni chetlab keldi — qo‘ng‘iroq qildi, tavsiya bo‘yicha keldi yoki shaxsan uchrashdingiz. Uni shu yerda yozib qo‘ying: lid darhol siz tanlagan odamda ishda bo‘ladi, ariza raqami va 4 soatdan keyin «keyin nima?» eslatmasi bilan. Boshqaga bersangiz — unga darhol Telegramga xabar keladi.",
    pl: "Klient przyszedł z pominięciem strony i bota — zadzwonił, przyszedł z polecenia albo spotkaliście się osobiście. Zapisz go tutaj: lead od razu jest w pracy u osoby, którą wybierzesz, z numerem zgłoszenia i przypomnieniem za 4 godziny „co dalej?”. Jeśli przekażesz go komuś innemu, ta osoba od razu dostanie wiadomość w Telegramie.",
  },
  name: { ru: "Имя клиента", uz: "Mijoz ismi", pl: "Imię klienta" },
  namePlaceholder: { ru: "Как к нему обращаться", uz: "Unga qanday murojaat qilish", pl: "Jak się do niego zwracać" },
  company: { ru: "Компания", uz: "Kompaniya", pl: "Firma" },
  optional: { ru: "необязательно", uz: "ixtiyoriy", pl: "opcjonalnie" },
  contact: { ru: "Телефон, Telegram или почта", uz: "Telefon, Telegram yoki pochta", pl: "Telefon, Telegram lub e-mail" },
  contactPlaceholder: { ru: "+998 90 123-45-67 или @ivan", uz: "+998 90 123-45-67 yoki @ivan", pl: "+998 90 123-45-67 lub @ivan" },
  need: { ru: "Что нужно клиенту", uz: "Mijozga nima kerak", pl: "Czego potrzebuje klient" },
  needPlaceholder: {
    ru: "Сайт для клиники, сроки, бюджет — всё, что успели узнать",
    uz: "Klinika uchun sayt, muddatlar, byudjet — bilib olgan hamma narsa",
    pl: "Strona dla kliniki, terminy, budżet — wszystko, czego udało się dowiedzieć",
  },
  from: { ru: "Откуда клиент", uz: "Mijoz qayerdan", pl: "Skąd jest klient" },
  fromPlaceholder: { ru: "Звонок, рекомендация, выставка…", uz: "Qo‘ng‘iroq, tavsiya, ko‘rgazma…", pl: "Telefon, polecenie, targi…" },
  assignee: { ru: "Кому лид", uz: "Lid kimga", pl: "Komu lead" },
  assigneeSelf: { ru: "Себе", uz: "O‘zimga", pl: "Sobie" },
  submit: { ru: "Добавить лид", uz: "Lid qo‘shish", pl: "Dodaj leada" },
  adding: { ru: "Добавляю…", uz: "Qo‘shilmoqda…", pl: "Dodaję…" },
  e_no_name: { ru: "Напишите имя клиента.", uz: "Mijoz ismini yozing.", pl: "Wpisz imię klienta." },
  e_no_contact: {
    ru: "Нужен контакт: телефон, Telegram или почта — иначе с клиентом не связаться.",
    uz: "Kontakt kerak: telefon, Telegram yoki pochta — aks holda mijoz bilan bog‘lanib bo‘lmaydi.",
    pl: "Potrzebny jest kontakt: telefon, Telegram lub e-mail — inaczej nie da się skontaktować z klientem.",
  },
  e_assignee: {
    ru: "Этого сотрудника нет среди активных — выберите другого.",
    uz: "Bu xodim faollar orasida yo‘q — boshqasini tanlang.",
    pl: "Tego pracownika nie ma wśród aktywnych — wybierz kogoś innego.",
  },
  e_offline: {
    ru: "База недоступна — попробуйте через минуту.",
    uz: "Baza ishlamayapti — bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza jest niedostępna — spróbuj za minutę.",
  },
  e_failed: {
    ru: "Лид не сохранился. Попробуйте ещё раз; если повторится — напишите владельцу.",
    uz: "Lid saqlanmadi. Yana urinib ko‘ring; takrorlansa — egasiga yozing.",
    pl: "Lead się nie zapisał. Spróbuj ponownie; jeśli to się powtórzy, napisz do właściciela.",
  },
});
