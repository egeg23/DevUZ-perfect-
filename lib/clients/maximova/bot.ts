import { confirmLogin, listBookings, type Booking } from "@/lib/clients/maximova/store";
import { esc, type BotConfig } from "@/lib/clients/maximova/telegram";

/**
 * Что бот Дарьи отвечает. Чистая функция от обновления: отдаёт список
 * сообщений, а отправляет их маршрут — так поведение проверяется тестом без
 * сети.
 *
 * Команды:
 * - /start login_<токен> — подтверждение входа в кабинет с сайта;
 * - /start — знакомство и ссылки на запись и кабинет;
 * - /id — показать свой Telegram ID (нужен, чтобы назначить администратора);
 * - /zayavki — последние заявки, только для Дарьи.
 */

export type Outgoing = { chatId: number; text: string };

type Update = {
  message?: {
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string; is_bot?: boolean };
    text?: string;
  };
};

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://devuz.studio").replace(/\/$/, "");

export const siteLinks = () => ({
  booking: `${site()}/maximova#zapis`,
  cabinet: `${site()}/maximova/kabinet`,
});

const DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

/** Заявка одним сообщением — Дарье в Telegram. */
export function bookingText(b: Booking): string {
  const lines = [
    `<b>Новая заявка на пробное № ${b.id}</b>`,
    `${esc(b.language)} · ${esc(b.age)} · ${esc(b.format)}`,
    `Родитель: ${esc(b.parentName)}`,
    `Контакт: ${esc(b.contact)}`,
  ];
  if (b.preferredTime) lines.push(`Удобное время: ${esc(b.preferredTime)}`);
  if (b.comment) lines.push(`Комментарий: ${esc(b.comment)}`);
  if (b.telegramId) lines.push("Родитель вошёл в кабинет — заявка видна ему там.");
  lines.push(`\nВсе заявки: ${siteLinks().cabinet}`);
  return lines.join("\n");
}

export function handleUpdate(update: Update, config: BotConfig, now = Date.now()): Outgoing[] {
  const message = update.message;
  const chatId = message?.chat?.id;
  const from = message?.from;
  // Только личные сообщения живого человека: в группах бот молчит.
  if (!message || !chatId || !from?.id || from.is_bot || message.chat?.type !== "private") return [];

  const text = (message.text || "").trim();
  const reply = (body: string): Outgoing[] => [{ chatId, text: body }];
  const isAdmin = config.admins.includes(from.id);

  const login = /^\/start\s+login_([A-Za-z0-9_-]{16,40})$/.exec(text);
  if (login) {
    const result = confirmLogin(login[1], { ...from, id: from.id }, config.admins, now);
    if (result === "ok") {
      return reply(
        `Готово, ${esc(from.first_name || "здравствуйте")}! Вы вошли в личный кабинет — вернитесь в браузер, страница откроется сама.\n\nСюда же будут приходить задания на дом, замечания и напоминания об оплате.`,
      );
    }
    return reply(
      `Ссылка для входа устарела. Откройте кабинет и нажмите «Войти через Telegram» ещё раз:\n${siteLinks().cabinet}`,
    );
  }

  if (text === "/id") return reply(`Ваш Telegram ID: <code>${from.id}</code>`);

  if (text === "/zayavki") {
    if (!isAdmin) return reply("Эта команда — только для Дарьи.");
    const list = listBookings(10);
    if (!list.length) return reply("Заявок пока нет.");
    const rows = list.map(
      (b) =>
        `№ ${b.id} · ${DATE.format(new Date(b.createdAt))}${b.status === "new" ? " · <b>новая</b>" : ""}\n${esc(b.language)}, ${esc(b.age)}, ${esc(b.format)} — ${esc(b.parentName)}, ${esc(b.contact)}`,
    );
    return reply(`<b>Последние заявки</b>\n\n${rows.join("\n\n")}\n\nВсе — в кабинете: ${siteLinks().cabinet}`);
  }

  const links = siteLinks();
  return reply(
    [
      "Здравствуйте! Это бот школы английского и французского Дарьи Максимовой.",
      "",
      `Записаться на пробное занятие: ${links.booking}`,
      `Личный кабинет: ${links.cabinet}`,
      "",
      "После входа в кабинет сюда будут приходить задания на дом, замечания и напоминания об оплате.",
      isAdmin ? "\nДля Дарьи: /zayavki — последние заявки." : "",
    ]
      .join("\n")
      .trim(),
  );
}
