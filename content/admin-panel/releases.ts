import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Релизы» (/admin/releases): файлы продуктов витрины.
 *
 * Имена переменных окружения, команды и пути (DOWNLOAD_SIGNING_SECRET,
 * openssl, shasum, бакет Supabase) — IT-термины, не переводятся.
 * Названия продуктов берутся из каталога на языке панели.
 */

/**
 * Ответ действия: `?r=код`, в `e` — только данные (слаг, путь, ответ
 * хранилища). Коды — из lib/store/releases.ts (ReleaseFailure).
 */
export const releaseResultDict = defineDict({
  ok: { ru: () => "Релиз выложен.", uz: () => "Reliz joylandi.", pl: () => "Wydanie opublikowane." },
  product: {
    ru: (slug: string) => `В каталоге нет продукта «${slug}».`,
    uz: (slug: string) => `Katalogda «${slug}» mahsuloti yo‘q.`,
    pl: (slug: string) => `W katalogu nie ma produktu „${slug}”.`,
  },
  fields: {
    ru: () => "Заполните версию, бакет и путь.",
    uz: () => "Versiya, bucket va yo‘lni to‘ldiring.",
    pl: () => "Uzupełnij wersję, bucket i ścieżkę.",
  },
  sha: {
    ru: () => "Контрольная сумма должна быть sha256 в hex, 64 знака.",
    uz: () => "Nazorat summasi hex ko‘rinishidagi sha256 bo‘lishi kerak, 64 belgi.",
    pl: () => "Suma kontrolna musi być sha256 w hex, 64 znaki.",
  },
  offline: {
    ru: () => "База недоступна.",
    uz: () => "Bazaga ulanib bo‘lmadi.",
    pl: () => "Baza danych jest niedostępna.",
  },
  storage: {
    ru: (answer: string) => `Хранилище ответило: ${answer}`,
    uz: (answer: string) => `Xotira javobi: ${answer}`,
    pl: (answer: string) => `Magazyn odpowiedział: ${answer}`,
  },
  missing: {
    ru: (object: string) => `В бакете нет объекта «${object}».`,
    uz: (object: string) => `Bucketda «${object}» obyekti yo‘q.`,
    pl: (object: string) => `W buckecie nie ma obiektu „${object}”.`,
  },
  failed: {
    ru: (error: string) => (error ? `Не записалось: ${error}` : "Не получилось."),
    uz: (error: string) => (error ? `Saqlab bo‘lmadi: ${error}` : "Bo‘lmadi."),
    pl: (error: string) => (error ? `Nie zapisano: ${error}` : "Nie udało się."),
  },
});

export const releasesDict = defineDict({
  title: { ru: "Релизы продуктов", uz: "Mahsulot relizlari", pl: "Wydania produktów" },
  offBefore: { ru: "Выдача выключена: не задан", uz: "Berish o‘chirilgan:", pl: "Wydawanie wyłączone: nie ustawiono" },
  offMiddle: {
    ru: "(нужно не меньше 32 знаков,",
    uz: "berilmagan (kamida 32 belgi kerak,",
    pl: "(potrzeba co najmniej 32 znaków,",
  },
  offAfter: {
    ru: "). Релизы зарегистрируются, но скачать их покупатель не сможет.",
    uz: "). Relizlar ro‘yxatga olinadi, lekin xaridor ularni yuklab ololmaydi.",
    pl: "). Wydania się zarejestrują, ale kupujący nie będzie mógł ich pobrać.",
  },
  publishTitle: { ru: "Выложить релиз", uz: "Relizni joylash", pl: "Opublikuj wydanie" },
  publishAbout: {
    ru: "Файл заливается в приватный бакет Supabase напрямую с вашего компьютера — через сайт загрузки нет и не будет: nginx режет тело запроса на 128 килобайтах. Здесь регистрируется путь; панель сходит в хранилище и проверит, что объект по нему действительно есть.",
    uz: "Fayl Supabase’ning yopiq bucketiga to‘g‘ridan-to‘g‘ri kompyuteringizdan yuklanadi — sayt orqali yuklash yo‘q va bo‘lmaydi: nginx so‘rov tanasini 128 kilobaytda kesadi. Bu yerda faqat yo‘l ro‘yxatga olinadi; panel xotiraga murojaat qilib, shu yo‘lda obyekt haqiqatan borligini tekshiradi.",
    pl: "Plik wgrywa się do prywatnego bucketu Supabase bezpośrednio z Twojego komputera — przez stronę wysyłania nie ma i nie będzie: nginx obcina treść żądania na 128 kilobajtach. Tutaj rejestruje się ścieżkę; panel zajrzy do magazynu i sprawdzi, czy obiekt pod nią naprawdę istnieje.",
  },
  product: { ru: "Продукт", uz: "Mahsulot", pl: "Produkt" },
  version: { ru: "Версия", uz: "Versiya", pl: "Wersja" },
  bucket: { ru: "Бакет", uz: "Bucket", pl: "Bucket" },
  path: { ru: "Путь в бакете", uz: "Bucketdagi yo‘l", pl: "Ścieżka w buckecie" },
  sha: {
    ru: "sha256 архива — необязательно, но покупателю нечем иначе проверить, что скачал то же самое",
    uz: "arxivning sha256 qiymati — ixtiyoriy, lekin xaridorda xuddi shu faylni yuklab olganini tekshirishning boshqa yo‘li yo‘q",
    pl: "sha256 archiwum — opcjonalne, ale kupujący nie ma innego sposobu, by sprawdzić, że pobrał to samo",
  },
  shaPh: { ru: "shasum -a 256 архив.zip", uz: "shasum -a 256 arxiv.zip", pl: "shasum -a 256 archiwum.zip" },
  notes: { ru: "Заметка для своих", uz: "Jamoa uchun izoh", pl: "Notatka wewnętrzna" },
  publish: { ru: "Выложить", uz: "Joylash", pl: "Opublikuj" },
  current: { ru: "актуальный", uz: "joriy", pl: "aktualne" },
  mb: { ru: "МБ", uz: "MB", pl: "MB" },
  empty: {
    ru: "Релизов пока нет. Пока их нет, оплативший покупатель видит «файл готовим».",
    uz: "Hozircha relizlar yo‘q. Ular bo‘lmaguncha, to‘lov qilgan xaridor «fayl tayyorlanmoqda» yozuvini ko‘radi.",
    pl: "Na razie brak wydań. Dopóki ich nie ma, kupujący, który zapłacił, widzi „plik przygotowujemy”.",
  },
  footer: {
    ru: (total: number, daily: number) =>
      `Покупателю не отдаётся ссылка Supabase: её нельзя отозвать ничем, кроме обращения в поддержку, и она может пережить собственный срок годности в кэше CDN. Покупатель держит наш токен, права проверяются на каждый клик, подписанная ссылка на минуту выпускается заново. Лимиты: ${total} выдач всего и ${daily} в сутки на заказ; повтор по тому же файлу в течение десяти минут не считается. Отзыв доступа — кнопка на карточке заявки.`,
    uz: (total: number, daily: number) =>
      `Xaridorga Supabase havolasi berilmaydi: uni qo‘llab-quvvatlash xizmatiga murojaat qilishdan boshqa yo‘l bilan bekor qilib bo‘lmaydi va u CDN keshida o‘z muddatidan ham uzoq yashashi mumkin. Xaridorda bizning tokenimiz bo‘ladi, huquqlar har bir bosishda tekshiriladi, bir daqiqalik imzolangan havola har safar yangidan chiqariladi. Cheklovlar: buyurtmaga jami ${total} ta berish va sutkasiga ${daily} ta; o‘sha faylni o‘n daqiqa ichida qayta olish hisoblanmaydi. Kirishni bekor qilish — buyurtma kartochkasidagi tugma.`,
    pl: (total: number, daily: number) =>
      `Kupujący nie dostaje linku Supabase: nie da się go odwołać inaczej niż przez zgłoszenie do supportu, a w cache CDN może przeżyć własny termin ważności. Kupujący trzyma nasz token, uprawnienia są sprawdzane przy każdym kliknięciu, a podpisany link na minutę wystawia się od nowa. Limity: łącznie ${total} pobrań i ${daily} na dobę na zamówienie; ponowne pobranie tego samego pliku w ciągu dziesięciu minut się nie liczy. Odebranie dostępu — przycisk na karcie zamówienia.`,
  },
});
