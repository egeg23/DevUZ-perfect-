import {
  MAX_AI_REPLIES,
  replyProblems,
  talkNote,
  asTranscript,
} from "@/lib/admin/outreach-talk";
import {
  closeRefused,
  handOver,
  laterInbound,
  markAnswered,
  pendingTalks,
  queueReply,
  tellReply,
  threadFor,
  type Inbound,
} from "@/lib/admin/outreach-talk-store";
import { messageWindow } from "@/lib/admin/tasks";
import { objectionOf, objectionReply } from "@/lib/admin/objections";
import { heldUntil } from "@/lib/admin/reply-heads-up";
import { aiStyleProblems, humanSendAfter, plainHost, withoutOpener } from "@/lib/admin/sales-after-reply";
import { runQualifyTurn } from "@/lib/qualify/engine";
import { buildSystemPrompt } from "@/lib/qualify/prompt";
import { talkLang } from "@/lib/talk/language";

/**
 * Ход модели по холодному касанию.
 *
 * Живёт на сайте, а не в скауте: здесь уже есть SDK модели, а у скаута
 * пять зависимостей, и так и должно остаться. Скаут принимает ответ
 * клиента и кладёт его в базу; свип раз в пять минут забирает неотвеченное,
 * думает и кладёт ответ обратно в очередь; скаут его отправляет.
 *
 * Пять минут задержки — не беда, а свойство. Ответ, прилетающий через
 * секунду после сообщения, выглядит роботом, и первое, что делает человек,
 * получив такой, — проверяет, с человеком ли он говорит.
 *
 * Движок первички тот же, что у сайта и у бота (`runQualifyTurn`). Разница
 * между каналами — в приписке к промпту и в том, куда уходит результат:
 * лид касания уже заведён и уже закреплён, поэтому квалификация
 * дописывается в него, а бриф уходит одному человеку, а не в общий чат.
 */

export type TalkRun = { handled: number; replied: number; handed: number; errors: string[] };

export async function runTalks(limit = 5, now: Date = new Date()): Promise<TalkRun> {
  const run: TalkRun = { handled: 0, replied: 0, handed: 0, errors: [] };
  // Ночью модель клиентам не пишет, а команде не уходят ни карточки, ни
  // «Ваш лид ответил» (владелец, 23.10.2026: «ночью уведомления не уходят!!!!
  // Только с 8 до 21:00 по ташкенту»). Ответы клиентов ждут утра.
  if (!messageWindow(now)) return run;

  let pending: Inbound[];
  try {
    pending = await pendingTalks(limit);
  } catch (error) {
    run.errors.push(`очередь входящих: ${message(error)}`);
    return run;
  }

  for (const inbound of pending) {
    run.handled += 1;
    try {
      const outcome = await answerOne(inbound);
      if (outcome === "replied") run.replied += 1;
      if (outcome === "handed") run.handed += 1;
    } catch (error) {
      run.errors.push(`${inbound.host}: ${message(error)}`);
    }
  }
  return run;
}

type Outcome = "replied" | "handed" | "merged";

async function answerOne(inbound: Inbound): Promise<Outcome> {
  // Клиент написал ещё — ответим один раз, на последнее, по всей ленте.
  if (await laterInbound(inbound.prospectId, inbound.createdAt)) {
    await markAnswered(inbound.messageId);
    return "merged";
  }

  // Разговор, который не сошёлся за дюжину реплик, дальше не сойдётся.
  // Держать его моделью значит тратить деньги и время человека, которому
  // он всё равно достанется.
  if (inbound.repliesSoFar >= MAX_AI_REPLIES) {
    await markAnswered(inbound.messageId);
    await handOver(
      inbound.prospectId,
      "turns",
      `Разговор идёт ${inbound.repliesSoFar} реплик и не сходится — дальше вы. Последнее от клиента:\n\n${inbound.body.slice(0, 500)}`,
    );
    return "handed";
  }

  const note = talkNote({
    host: inbound.host,
    label: inbound.label,
    findings: inbound.findings,
    firstMessage: inbound.firstMessage,
    managerName: inbound.managerName,
    repliesSoFar: inbound.repliesSoFar,
    untilMockup: inbound.untilMockup,
  });

  const thread = await threadFor(inbound.prospectId);

  /**
   * На каком языке отвечаем.
   *
   * Раньше здесь стояло "ru" жёстко, и системный промпт открывался словами
   * «посетитель открыл сайт на русском». Модели там же сказано переходить на
   * язык собеседника, но начинать с неверного — значит просить её исправлять
   * то, чего можно было не ломать. Рынок узбекский, и отвечать на узбекский
   * вопрос по-русски — это то же самое, что не услышать.
   */
  const locale = talkLang(thread);

  // Возражение до макета у половины «new» (lib/admin/objections.ts): уходит
  // готовый текст, модель в эту минуту молчит — как на «да?» после
  // «Здравствуйте». Не узнали или язык не русский и не узбекский — модель.
  const objection = inbound.untilMockup && inbound.salesNew ? objectionOf(inbound.body) : null;
  if (objection && (locale === "ru" || locale === "uz")) {
    await markAnswered(inbound.messageId);
    await queueReply({
      prospectId: inbound.prospectId,
      leadId: inbound.leadId,
      body: objectionReply(objection, { lang: locale, host: inbound.siteHost ? plainHost(inbound.siteHost) : null, niche: inbound.niche }),
      sendAfter: await replyAfter(inbound),
    });
    return "replied";
  }

  const history = asTranscript(thread);
  if (!history.length) {
    // Входящее без ленты — значит первое сообщение не записалось. Ответить
    // вслепую нельзя: модель не знает, что мы уже сказали.
    await markAnswered(inbound.messageId);
    await handOver(inbound.prospectId, "bad_reply", `Переписка не восстановилась, ответьте сами:\n\n${inbound.body.slice(0, 500)}`);
    return "handed";
  }

  // Что модели дозволено считать фактом: прайс и портфолио из системного
  // промпта, находки по сайту, приписка канала и весь разговор. Число,
  // которого нет ни в одном из этих мест, — выдумка.
  const facts = [
    buildSystemPrompt(locale),
    note,
    history.map((m) => m.content).join("\n"),
  ].join("\n");

  let text = "";
  let qualified = false;
  let refused = false;

  await runQualifyTurn({
    history,
    locale,
    source: "outreach",
    alreadyQualified: false,
    channelNote: note,
    existing: inbound.requestNo
      ? {
          requestNo: inbound.requestNo,
          notify: inbound.managerChatId ? [inbound.managerChatId] : [],
          heading: `Первичка по касанию · ${inbound.host}`,
        }
      : undefined,
    onText: (chunk) => {
      text += chunk;
    },
    onEvent: (event) => {
      if (event.type === "qualified") {
        qualified = true;
        refused = event.lead.priority === "archive";
      }
    },
  });

  await markAnswered(inbound.messageId);

  // Отказ: касание закрывается само, клиенту больше ничего не пишем, команде
  // — ни карточки, ни строки (владелец, 23.10.2026: «Не спамь отказами»).
  // Отказ считается на «Главной» по closed_reason.
  if (refused) {
    await closeRefused(inbound.prospectId, inbound.body);
    return "handed";
  }

  // До макета ответ модели не выдаёт робота (sales-after-reply): «Отлично!»
  // в начале снимаем сами, список и длинный ответ — не отправляем.
  if (inbound.untilMockup) text = withoutOpener(text);
  const problems = replyProblems(text, facts);
  if (inbound.untilMockup) problems.push(...aiStyleProblems(text));
  if (problems.length) {
    // Плохой ответ не отправляем и не исправляем на ходу: вторая попытка
    // той же моделью с той же историей даёт ту же выдумку. Разговор
    // достаётся человеку — с текстом, который модель хотела отправить,
    // чтобы ему было от чего оттолкнуться.
    await handOver(
      inbound.prospectId,
      "bad_reply",
      `Ответ модели не прошёл проверку (${problems.map((p) => p.text).join(" ")}). Клиент написал:\n\n${inbound.body.slice(0, 400)}`,
    );
    return "handed";
  }

  // Пауза, как человек набирает: 40–120 секунд от сообщения клиента. Свип
  // ходит раз в пять минут, и часто пауза уже есть — тогда сразу.
  // Квалификация закрыта — разговор и так уходит человеку, строку «модель
  // ответит сама» ему не шлём.
  await queueReply({
    prospectId: inbound.prospectId,
    leadId: inbound.leadId,
    body: text.trim(),
    sendAfter: qualified ? humanSendAfter(inbound.createdAt, Date.now()) : await replyAfter(inbound),
  });

  if (qualified) {
    // Прощальную фразу модели отправляем — обрывать разговор на полуслове
    // нельзя. А дальше разговор ведёт человек.
    await handOver(inbound.prospectId, "qualified", "Первичка закрыта, бриф выше. Дальше разговор ваш.");
    return "handed";
  }

  return "replied";
}

/**
 * Когда уходит ответ модели. У касания есть хозяин — ему «Ваш лид ответил»
 * с «✋ Отвечу сам», и ответ ждёт окна (lib/admin/reply-heads-up.ts). Ничьё
 * (автопрогон до макета) или строка не ушла — обычная пауза «как человек».
 */
async function replyAfter(inbound: Inbound): Promise<string | null> {
  const now = Date.now();
  const human = humanSendAfter(inbound.createdAt, now);
  if (inbound.untilMockup || !inbound.managerChatId) return human;
  const told = await tellReply(inbound.prospectId, inbound.body).catch(() => false);
  return heldUntil(human, now, told);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
