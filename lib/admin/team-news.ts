import { isWorkday, tashkentHour } from "@/lib/admin/portion";
import type { Role } from "@/lib/admin/roles";
import { STREAM_ON } from "@/lib/admin/stream";
import { sendKeyboard, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Разовые объявления команде в Telegram: что нового в панели и в боте.
 *
 * Владелец, 29.09: «Сделай оповещение по руководителям и менеджерам по
 * новым функциям, которые их касаются… Предыдущие доработки тоже включи в
 * короткий перечень с коротким понятным объяснением».
 *
 * Объявление — это код, а не рассылка руками: уходит само ближайшим
 * проходом свипа после выкатки, в рабочее время, каждому один раз
 * (team_news_sent). Текст у руководителя и менеджера разный — каждому то,
 * что он видит сам. Владельцу — копия: чтобы знать, что именно ушло.
 */

export type News = {
  id: string;
  /** С какого и до какого дня (по UTC) слать. После — не шлём: новость устарела. */
  from: string;
  until: string;
  roles: readonly Role[];
  text: (role: Role) => string;
  /** Показать внизу чата кнопку «▶️ Получать лиды». */
  streamKey?: boolean;
};

/** Объявления уходят по будням с 09:00 до 19:00 по Ташкенту — не ночью. */
export const NEWS_FROM_HOUR = 9;
export const NEWS_TO_HOUR = 19;

export function newsWindow(now: Date): boolean {
  const hour = tashkentHour(now);
  return isWorkday(now) && hour >= NEWS_FROM_HOUR && hour < NEWS_TO_HOUR;
}

export function newsActive(news: News, now: Date): boolean {
  return now.getTime() >= Date.parse(`${news.from}T00:00:00Z`) && now.getTime() < Date.parse(`${news.until}T00:00:00Z`);
}

function touchesNews(role: Role): string {
  const head = role === "head";
  return [
    "<b>Что нового в касаниях</b>",
    "",
    "<b>1. «🙅 Клиент отказался» и «🔇 Игнорирует»</b>",
    "Нажимайте, когда ясно, что разговора не будет. В Telegram кнопки появляются под карточкой компании после «Отправить через бота» или «Написал сам» и под сообщением об ответе клиента; в панели — в карточке в «Касаниях».",
    "После нажатия компания уходит из работы: бот больше не пишет ей повторных сообщений, модель не отвечает, лид закрывается «проиграли», напоминания по нему снимаются. Касание в порции и в плане недели остаётся засчитанным. Напишет клиент сам — бот сразу позовёт того, кто вёл.",
    "",
    "<b>2. «▶️ Получать лиды»</b>",
    "Кнопка внизу этого чата (или команда /leads). Нажали — компании из общего пула приходят сюда одна за другой, с готовым текстом и теми же кнопками, что в порции дня. Без лимита: разобрали одну — пришла следующая; неразобранных одновременно не больше трёх. По будням с 9:00 до 18:00, после утренней порции; что не разобрали до 18:00, вернётся в пул. Это сверх порции и в её счёт не идёт. Остановить — «⏸ Не получать лиды».",
    "",
    "<b>Ещё за последние дни</b>",
    "• Порция дня — это 5 именно касаний. «Не подходит» не засчитывается: вместо неё сразу приходит замена.",
    "• «Касания» открываются быстро и не зависают при копировании: сразу видно то, что в работе, остальное — кнопкой «Показать ещё 20».",
    "• В письмах — наш проект из ниши адресата: мебельщикам — мебельный, а не USTA.",
    "• Взяли лид из очереди или вам его передали — переписка по нему тоже ваша: ответы клиента и повторные сообщения идут вам.",
    "• Уведомления, не дошедшие из-за сбоя связи, бот досылает сам.",
    ...(head
      ? [
          "• Вечерний отчёт по порциям: «Имя — 3 из 5, не подошло 2 · поток: 4 касания». Считаются только касания, поток — отдельно.",
          "• Просьбу о передаче лида подтверждаете кнопкой прямо в Telegram.",
          "• В «Команде» — галочки: какие сообщения бота получает каждый менеджер. По умолчанию приходит всё.",
          "• Раздел «Трафик» — посещаемость сайта из Метрики и Google Analytics.",
        ]
      : []),
    "",
    "Подробно — в панели, кнопка «Как пользоваться разделом» в «Касаниях».",
  ].join("\n");
}

export const NEWS: readonly News[] = [
  {
    id: "2026-09-29-touches",
    from: "2026-09-29",
    until: "2026-10-03",
    roles: ["head", "manager"],
    text: touchesNews,
    streamKey: true,
  },
];

type Row = { id: string; role: Role; chat: number };

/**
 * Разослать то, что ещё не ушло. Отметка — до сообщения и условно (первичный
 * ключ): два прохода свипа не отправят одно объявление дважды. Не дошло —
 * отметка снимается, и следующий проход попробует снова, пока новость
 * актуальна.
 */
export async function sendTeamNews(now: Date = new Date(), list: readonly News[] = NEWS): Promise<number> {
  if (!newsWindow(now)) return 0;
  const active = list.filter((news) => newsActive(news, now));
  if (!active.length) return 0;
  const db = serviceClient();
  if (!db) return 0;

  const { data } = await db.from("staff").select("id, role, telegram_user_id").eq("is_active", true);
  const people: Row[] = (data ?? [])
    .map((r) => ({ id: r.id as string, role: r.role as Role, chat: Number(r.telegram_user_id) }))
    .filter((r) => Number.isFinite(r.chat) && r.chat !== 0);

  let sent = 0;
  for (const news of active) {
    const { data: done } = await db.from("team_news_sent").select("staff_id").eq("news_id", news.id);
    const already = new Set((done ?? []).map((r) => r.staff_id as string));
    const readers = people.filter((p) => news.roles.includes(p.role) && !already.has(p.id));
    // Копия владельцу — после того, как ушло хоть кому-то: иначе он узнал
    // бы о рассылке, которой не было.
    const owners = people.filter((p) => p.role === "admin" && !already.has(p.id));

    let reached = already.size > 0;
    for (const reader of readers) {
      if (!(await claim(news.id, reader.id))) continue;
      const text = news.text(reader.role);
      const ok = news.streamKey ? await sendKeyboard(reader.chat, text, [[STREAM_ON]]) : await sendMessage(reader.chat, text);
      if (ok) {
        sent += 1;
        reached = true;
      } else {
        await db.from("team_news_sent").delete().eq("news_id", news.id).eq("staff_id", reader.id);
      }
    }
    if (!reached) continue;
    for (const owner of owners) {
      if (!(await claim(news.id, owner.id))) continue;
      const copy = [
        "<i>Копия: это ушло руководителям и менеджерам. Ниже — текст для руководителя; у менеджеров нет пунктов, которые касаются только руководителей.</i>",
        "",
        news.text("head"),
      ].join("\n");
      if (!(await sendMessage(owner.chat, copy))) {
        await db.from("team_news_sent").delete().eq("news_id", news.id).eq("staff_id", owner.id);
      }
    }
  }
  return sent;
}

async function claim(newsId: string, staffId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("team_news_sent")
    .upsert({ news_id: newsId, staff_id: staffId }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
    .select("staff_id");
  return Boolean(data?.length);
}
