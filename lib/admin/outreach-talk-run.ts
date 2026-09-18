import {
  MAX_AI_REPLIES,
  replyProblems,
  talkNote,
  asTranscript,
} from "@/lib/admin/outreach-talk";
import {
  handOver,
  markAnswered,
  pendingTalks,
  queueReply,
  threadFor,
  type Inbound,
} from "@/lib/admin/outreach-talk-store";
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

export async function runTalks(limit = 5): Promise<TalkRun> {
  const run: TalkRun = { handled: 0, replied: 0, handed: 0, errors: [] };

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

type Outcome = "replied" | "handed";

async function answerOne(inbound: Inbound): Promise<Outcome> {
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
      if (event.type === "qualified") qualified = true;
    },
  });

  await markAnswered(inbound.messageId);

  const problems = replyProblems(text, facts);
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

  await queueReply({ prospectId: inbound.prospectId, leadId: inbound.leadId, body: text.trim() });

  if (qualified) {
    // Прощальную фразу модели отправляем — обрывать разговор на полуслове
    // нельзя. А дальше разговор ведёт человек.
    await handOver(inbound.prospectId, "qualified", "Первичка закрыта, бриф выше. Дальше разговор ваш.");
    return "handed";
  }

  return "replied";
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
