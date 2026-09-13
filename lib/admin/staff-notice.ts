import { esc, sendWithButtons } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";

/**
 * Сообщение сотруднику о том, что он заведён в панели.
 *
 * До этого человека заводили, и он об этом не узнавал: где-то в базе
 * появлялась строка, а он продолжал работать как раньше. Первым, что он
 * видел, оказывалось напоминание по лиду — от бота, о котором он не знал,
 * про панель, адреса которой ему никто не называл.
 *
 * Главное ограничение здесь не наше, а телеграмовское: **бот не может
 * написать первым тому, кто ему ни разу не писал.** На такую попытку Bot
 * API отвечает отказом, и обойти это нечем — так задумано, иначе боты
 * рассылали бы кому угодно. Значит приглашение доходит не всегда, и делать
 * вид, что дошло, нельзя: панель должна сказать прямо, что человеку надо
 * сначала написать боту, и дать кнопку отправить ещё раз.
 */

export type InviteOutcome = "sent" | "blocked" | "no_bot";

/**
 * Что человек может в панели — своими словами, а не названием роли.
 *
 * «Роль: admin» не говорит ничего тому, кто видит панель впервые.
 */
const WHAT_YOU_CAN: Record<"admin" | "manager", string[]> = {
  manager: [
    "видеть лидов с сайта и брать их в работу",
    "открывать контакт клиента и переписку с ним",
    "вести проекты и ставить напоминания",
    "выставлять счета по заявкам на покупку",
  ],
  admin: [
    "всё, что может менеджер",
    "заводить и отключать сотрудников",
    "читать журнал действий — кто что открывал и менял",
    "подтверждать оплату и отзывать доступ к файлам",
  ],
};

const ROLE_TITLE: Record<"admin" | "manager", string> = {
  manager: "менеджер",
  admin: "администратор",
};

function body(
  role: "admin" | "manager",
  invitedBy: string,
  returning: boolean,
): string {
  return [
    returning
      ? "<b>Доступ в панель DevUz восстановлен</b>"
      : "<b>Вас добавили в панель DevUz</b>",
    "",
    `Роль: <b>${ROLE_TITLE[role]}</b>. Добавил: ${esc(invitedBy)}.`,
    "",
    "Что вам доступно:",
    ...WHAT_YOU_CAN[role].map((line) => `• ${line}`),
    "",
    "<b>Как войти:</b> напишите мне сюда <code>/login</code> — пришлю ссылку.",
    "Ссылка одноразовая и живёт пять минут, так что запрашивайте её тогда, когда садитесь работать.",
  ].join("\n");
}

/**
 * Отправить приглашение.
 *
 * Никогда не бросает: сотрудник заведён независимо от того, доехало ли
 * сообщение, и падать на уведомлении о действии значило бы откатывать само
 * действие из-за его описания.
 */
export async function notifyInvitedStaff(input: {
  telegramId: number;
  role: "admin" | "manager";
  invitedBy: string;
  returning: boolean;
}): Promise<InviteOutcome> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return "no_bot";

  try {
    const ok = await sendWithButtons(
      input.telegramId,
      body(input.role, input.invitedBy, input.returning),
      // Ссылка, а не действие: панель всё равно откроет браузер, и гонять
      // это через колбэк значит ждать ответа сервера ради перехода, который
      // Telegram сделает сам.
      [{ text: "Открыть панель", url: `${siteUrl}/admin` }],
    );
    return ok ? "sent" : "blocked";
  } catch (error) {
    console.error("admin: не отправил приглашение", error);
    return "blocked";
  }
}

/**
 * Сообщение о смене роли.
 *
 * Отдельно от приглашения: человек уже в панели, и «вас добавили» было бы
 * неправдой. А знать о выданных правах он должен — особенно когда права
 * забрали.
 */
export async function notifyRoleChange(input: {
  telegramId: number;
  role: "admin" | "manager";
  changedBy: string;
}): Promise<InviteOutcome> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return "no_bot";

  try {
    const ok = await sendWithButtons(
      input.telegramId,
      [
        "<b>В панели DevUz у вас изменилась роль</b>",
        "",
        `Теперь вы <b>${ROLE_TITLE[input.role]}</b>. Изменил: ${esc(input.changedBy)}.`,
        "",
        "Что вам доступно:",
        ...WHAT_YOU_CAN[input.role].map((line) => `• ${line}`),
      ].join("\n"),
      [{ text: "Открыть панель", url: `${siteUrl}/admin` }],
    );
    return ok ? "sent" : "blocked";
  } catch (error) {
    console.error("admin: не отправил сообщение о смене роли", error);
    return "blocked";
  }
}
