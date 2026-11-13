import { defineDict } from "@/lib/admin/i18n";

/**
 * Плашка результата сверху экрана (components/admin/keep-place.tsx): что
 * ответило действие, по коду `?done=` в адресе. Коды на `fail` и `no_` —
 * жёлтой плашкой, остальные — зелёной.
 */
export const toastDict = defineDict({
  done_ok: { ru: "Сохранили", uz: "Saqlandi", pl: "Zapisano" },
  done_lead_kinds: {
    ru: "Сохранили: бот и очередь присылают только отмеченные виды лидов",
    uz: "Saqlandi: bot va navbat faqat belgilangan turdagi lidlarni yuboradi",
    pl: "Zapisano: bot i kolejka wysyłają tylko zaznaczone rodzaje leadów",
  },
  done_fail_lead_kinds: {
    ru: "Не сохранилось: база не ответила, попробуйте ещё раз",
    uz: "Saqlanmadi: baza javob bermadi, yana urinib ko‘ring",
    pl: "Nie zapisano: baza nie odpowiedziała, spróbuj ponownie",
  },
  done_taken: { ru: "Лид ваш — он в работе", uz: "Lid sizniki — ishda", pl: "Lead jest twój — w toku" },
  done_trashed: { ru: "Удалён как мусор, из очереди убран", uz: "Axlat sifatida o‘chirildi, navbatdan olindi", pl: "Usunięty jako śmieć, zdjęty z kolejki" },
  done_won: { ru: "Отмечено: выиграли", uz: "Belgilandi: yutdik", pl: "Zaznaczono: wygrane" },
  done_lost: { ru: "Отмечено: проиграли", uz: "Belgilandi: yutqazdik", pl: "Zaznaczono: przegrane" },
  done_term: { ru: "Задача «Связаться» поставлена", uz: "«Bog‘lanish» vazifasi qo‘yildi", pl: "Zadanie «Skontaktuj się» ustawione" },
  done_undone: { ru: "Ступень снята", uz: "Bosqich olib tashlandi", pl: "Etap zdjęty" },
  done_skipped: { ru: "Пропустили — вернётся позже", uz: "O‘tkazib yuborildi — keyin qaytadi", pl: "Pominięto — wróci później" },
  done_no_yours: {
    ru: "Этот лид уже ведёт другой менеджер",
    uz: "Bu lidni boshqa menejer olib bormoqda",
    pl: "Tego leada prowadzi już inny menedżer",
  },
  done_no_gone: { ru: "Лида уже нет — его разобрали", uz: "Lid endi yo‘q — uni hal qilishgan", pl: "Leada już nie ma — ktoś go rozpatrzył" },
  done_no_queued: {
    ru: "Не ваша очередь: лид сейчас предложен другому на 30 минут",
    uz: "Navbat sizniki emas: lid hozir 30 daqiqaga boshqa xodimga taklif qilingan",
    pl: "To nie twoja kolej: lead jest teraz zaproponowany komuś innemu na 30 minut",
  },
  done_no_share: {
    ru: "Ваша доля за месяц взята, а на месте коллега, у которого меньше. Через 10 минут сможете взять сами",
    uz: "Oylik ulushingiz olingan, joyida esa kamroq olgan hamkasb bor. 10 daqiqadan keyin o‘zingiz olishingiz mumkin",
    pl: "Twoja część na ten miesiąc jest wykorzystana, a na miejscu jest kolega, który ma mniej. Za 10 minut możesz wziąć sam",
  },
  done_no_wait: {
    ru: "Третий раз «ещё в работе» нельзя — выберите «Выиграли» или «Проиграли»",
    uz: "Uchinchi marta «hali ishda» mumkin emas — «Yutdik» yoki «Yutqazdik»ni tanlang",
    pl: "Trzeci raz «nadal w toku» nie można — wybierz «Wygrane» albo «Przegrane»",
  },
  done_fail: { ru: "Не получилось — попробуйте ещё раз", uz: "Bo‘lmadi — yana urinib ko‘ring", pl: "Nie udało się — spróbuj ponownie" },
});
