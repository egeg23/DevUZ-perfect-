import { isWorkday, tashkentHour } from "@/lib/admin/portion";
import type { Role } from "@/lib/admin/roles";
import { periodReport } from "@/lib/admin/period-report-store";
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
  /**
   * Текст по роли. Может считаться в момент отправки — отчёт по базе
   * (lib/admin/period-report-store); пусто — сейчас слать нечего, попробуем
   * следующим проходом.
   */
  text: (role: Role, now?: Date) => string | null | Promise<string | null>;
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

/**
 * Задачи команды (PR #175, #177) и клиенты партнёров без ссылки (PR #176).
 *
 * Владелец, 01.10: «По этим 2 апдейтам разошли всем сотрудникам инфо в
 * боте, начни со слов: Коллеги, а у нас обнова!»
 */
function tasksNews(): string {
  return [
    "<b>Коллеги, а у нас обнова!</b>",
    "",
    "<b>1. Задачи — наша внутренняя CRM</b>",
    "Задачи друг другу теперь ставим в панели, а не в личке. На главной («Лиды») — блок «Задачи»: «Мне» и «Я поставил».",
    "• Поставить может любой — любому, в том числе себе: «Поставить задачу» → кому, что сделать, срок (можно без срока) и, если нужно, проект.",
    "• Тому, на кого поставили, бот сразу пишет сюда: кто поставил, что и к какому сроку. Нажмите «✅ Взять в работу» — постановщик увидит, что задача у вас.",
    "• Дальше в том же сообщении: «✅ Сделано», «✖ Не сделано» или «🕑 Перенести срок» — +1 час, завтра к 18:00, +3 дня, неделя или своя дата. Постановщику приходит каждый шаг.",
    "• Бот напомнит, если задачу не взяли за 30 минут, за час до срока и когда срок прошёл. Ночью, с 23:00 до 07:00, бот молчит.",
    "• В панели задачи идут от ближайшего срока, их можно сгруппировать по сроку, проекту или человеку. Кто поставил задачу, может перенести срок или отменить её.",
    "• Пока панель открыта, новая задача приходит со звуком. Нажмите в блоке «Включить уведомления» — будут ещё и всплывающие уведомления браузера.",
    "",
    "<b>2. Клиенты партнёров — теперь и без ссылки</b>",
    "• Партнёр может сам закрепить за собой компанию в своём кабинете — по ИНН, названию и контакту. Когда такая компания пишет нам, лид сам становится клиентом этого партнёра.",
    "• В карточке лида это видно: «Клиент партнёра Имя (закреплён ДД.ММ)». Там же новое поле «ИНН компании» → «Сохранить ИНН»: клиент назвал ИНН — впишите, система сама проверит, не закреплён ли он за партнёром.",
    "• С таким лидом работаете как обычно: процент партнёра платит студия, для клиента ничего не меняется.",
    "",
    "Подробно — в панели: в «Лидах» кнопка «Как пользоваться разделом», пункты про задачи и про ИНН.",
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
  // Владелец, 01.10: «Отправь мне и Александру отчёт по сотрудникам за 2
  // недели работы, чтобы было видно, кто сколько касаний сделал». Владелец
  // сам среди читателей — копии ему не будет.
  {
    id: "2026-10-01-touches-2w",
    from: "2026-10-01",
    until: "2026-10-03",
    roles: ["admin", "head"],
    text: (_role, now) => periodReport(now),
  },
  {
    id: "2026-10-02-tasks-partners",
    from: "2026-10-02",
    until: "2026-10-07",
    roles: ["head", "manager"],
    text: tasksNews,
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
      const text = await news.text(reader.role, now);
      const ok = !text
        ? false
        : news.streamKey
          ? await sendKeyboard(reader.chat, text, [[STREAM_ON]])
          : await sendMessage(reader.chat, text);
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
      const head = await news.text("head", now);
      const copy = [
        "<i>Копия: это ушло руководителям и менеджерам. Ниже — текст для руководителя; у менеджеров нет пунктов, которые касаются только руководителей.</i>",
        "",
        head,
      ].join("\n");
      if (!head || !(await sendMessage(owner.chat, copy))) {
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
