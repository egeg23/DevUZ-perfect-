import { wants } from "@/lib/admin/notify-prefs";
import {
  HANDOVER_TEXT,
  bindingPatch,
  findHandTouch,
  needsBinding,
  normalizeHandle,
  readInbound,
  type HandTouch,
  type TalkRow,
} from "@/lib/admin/outreach-talk";
import { protoTermsText } from "@/lib/admin/prototype-claim";
import { announcePrototype } from "@/lib/admin/prototype-claim-store";
import { leadOnHandover, offerLead, routeAutopilotReply } from "@/lib/admin/autopilot-reply";
import { hasMockupLink } from "@/lib/admin/mockup-offer";
import { recordMockupSent } from "@/lib/admin/mockup-offer-store";
import { CLOSE_TEXT, canClose, closeCallback, isCloseReason } from "@/lib/admin/touch-close";
import { esc, sendMessage, sendWithRows } from "@/lib/qualify/telegram";
import { MAIN_ACCOUNT, accountOf, sentFrom, sentFromText } from "@/lib/admin/work-accounts";
import { accountTags } from "@/lib/admin/work-accounts-store";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";
import { detectLang } from "@/lib/talk/language";
import { checkFresh } from "@/lib/admin/check-fresh";
import { LETTER_AFTER_REPLY } from "@/lib/admin/autopilot";
import { lastEdits, lineEditable, type EditState } from "@/lib/admin/outreach-edit";
import type { CircleLang } from "@/lib/admin/circle-store";
import { objectionOf } from "@/lib/admin/objections";
import {
  INTRO_BEFORE_MS,
  PRICE_KIND,
  circleNicheOf,
  introLine,
  introTargetOf,
  isAutoReply,
  priceLine,
  salesNew,
  type CircleNiche,
  type SalesArm,
} from "@/lib/admin/sales-after-reply";
import {
  CIRCLE_AFTER_MS,
  CIRCLE_LANG,
  PITCH_AFTER_MS,
  circleBody,
  circleFailText,
  circleLangFor,
  circleLangOf,
  letterLang,
  pitchAfter,
  replyLang,
  waitsForPitch,
  withoutGreeting,
  type HelloLang,
} from "@/lib/admin/hello-first";

/**
 * Переписка по касанию — то, что ходит в базу.
 *
 * Отдельно от чистой части и от модели по той же причине, по которой
 * отдельно живёт очередь касаний: половину этих функций вызывает процесс
 * скаута, а тянуть к нему SDK модели ради записи входящего незачем.
 *
 * Разделение обязанностей здесь такое. Скаут принимает входящее и
 * отправляет исходящее — он единственный, у кого есть сессия рабочего
 * аккаунта. Свип на сайте думает: читает неотвеченное, зовёт модель и
 * кладёт ответ в очередь. Ни один из них не ждёт другого.
 */

/**
 * Сколько очередных ответов просматривать за раз.
 *
 * Ровно столько, чтобы ручные сообщения не запирали очередь. Больше не
 * нужно: отдаём всё равно по одному, а каждая строка — отдельный запрос за
 * проспектом.
 */
const REPLY_SCAN = 20;

export type Inbound = {
  messageId: string;
  /** Когда пришло: клиент пишет несколькими сообщениями подряд (laterInbound). */
  createdAt: string;
  prospectId: string;
  leadId: string | null;
  host: string;
  label: string | null;
  target: string;
  body: string;
  findings: { title: string; impact: string }[];
  firstMessage: string;
  requestNo: string | null;
  managerName: string;
  managerChatId: number | null;
  repliesSoFar: number;
  /**
   * Касание автопрогона без лида: модель ведёт к согласию на бесплатный
   * макет, а не к созвону (untilMockup).
   */
  untilMockup: boolean;
  /** Половина «new» A/B (sales-after-reply): готовые ответы на возражения до макета. */
  salesNew: boolean;
  /** Ниша для слов окупаемости в ответе на «дорого». */
  niche: CircleNiche;
  /** Хост сайта текстом; null — сайта нет. */
  siteHost: string | null;
};

/**
 * Половина A/B касания (prospects.sales_arm). Отдельным запросом: пока
 * миграция 0168 не применена, колонки нет — тогда null, и касание идёт как
 * раньше, а остальные запросы не падают вместе с ней.
 */
export async function salesArmOf(prospectId: string): Promise<SalesArm | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.from("prospects").select("sales_arm").eq("id", prospectId).maybeSingle();
  if (error || !data) return null;
  const arm = (data as { sales_arm?: unknown }).sales_arm;
  return arm === "old" || arm === "new" ? arm : null;
}

/**
 * Входящее от проспекта.
 *
 * Ищем по адресу среди тех, кому уже написали. Не нашли — значит написал
 * кто-то посторонний, и это не наше дело: скаут читает личку рабочего
 * аккаунта, туда пишут и по другим поводам.
 */
export async function recordInbound(input: {
  handle: string;
  /** Кого вернул телеграм при отправке. Главный ключ: он есть всегда. */
  userId?: string;
  /** Номер написавшего, если Telegram его показал: по нему узнаётся касание, сделанное руками. */
  phone?: string;
  /** Каким аккаунтом принято сообщение: на него переходит разговор, начатый руками. */
  account?: string;
  body: string;
}): Promise<{ matched: boolean; host?: string; verdict?: string; bound?: boolean }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const handle = normalizeHandle(input.handle);
  const userId = (input.userId ?? "").trim();
  const phone = (input.phone ?? "").trim();
  if (!handle && !userId && !phone) return { matched: false };

  // Сравниваем в общем виде: в проспекте адрес мог остаться ссылкой.
  const { data: rows } = await db
    .from("prospects")
    .select(PROSPECT_FIELDS)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(500);

  /**
   * Сначала по id, и только потом по адресу.
   *
   * У человека, найденного по номеру, @адреса может не быть вовсе — а
   * именно так мы и находим тех, у кого на сайте нет телеграма. Пока
   * сверялись только по адресу, их ответы не находили своего разговора и
   * уходили в никуда: снаружи это выглядело как «клиент не отвечает».
   *
   * Обратный порядок был бы хуже и по другой причине: адрес человек меняет,
   * id — нет.
   */
  const sent = (rows ?? []) as unknown as ProspectRow[];
  let prospect: ProspectRow | null =
    (userId ? sent.find((row) => String(row.target_user_id ?? "") === userId) : undefined) ??
    (handle ? sent.find((row) => normalizeHandle(row.target) === handle) : undefined) ??
    null;

  /**
   * Не нашли среди отправленных ботом — ищем среди написанных руками.
   *
   * Менеджер написал клиенту сам, с рабочего аккаунта студии на своём
   * телефоне: отметил «Связался сам» или ещё не успел. Id клиента у нас нет
   * — письмо ушло мимо скаута, — поэтому узнаём его по @адресу или номеру из
   * карточки (findHandTouch). Сюда же попадает письмо, которое ещё стоит в
   * очереди бота: менеджер написал раньше бота, клиент уже ответил.
   */
  if (!prospect) {
    // Отмеченные «Связался сам» — первыми: про них менеджер уже сказал, что
    // написал. Потом те, что он отметить не успел.
    const [marked, unmarked] = await Promise.all([
      db
        .from("prospects")
        .select(PROSPECT_FIELDS)
        .eq("status", "sent")
        .eq("target_kind", "manual")
        .order("touched_at", { ascending: false, nullsFirst: false })
        .limit(300),
      db
        .from("prospects")
        .select(PROSPECT_FIELDS)
        .in("status", ["manual", "sending"])
        .order("claimed_at", { ascending: false, nullsFirst: false })
        .limit(300),
    ]);
    const hand = [...(marked.data ?? []), ...(unmarked.data ?? [])] as unknown as ProspectRow[];
    prospect = findHandTouch(hand, { handle, phone });
  }
  if (!prospect) return { matched: false };

  // Клиент ответил на рабочий аккаунт — переписка теперь здесь, и бот ведёт
  // её с этого же аккаунта (nextReply берёт по sent_via).
  let bound = false;
  if (input.account && needsBinding(prospect)) {
    bound = await bindToAccount(prospect, { account: input.account, userId, handle, phone });
    if (bound && prospect.status !== "sent") prospect = { ...prospect, status: "sent", ai_handling: true };
  }

  const saved = await saveInbound(prospect, input.body);
  // Сказать менеджеру, что дальше пишет бот, — только если бот правда пишет:
  // клиент просит человека или разговор уже забрали себе — об этом своё
  // сообщение уходит из saveInbound.
  if (bound && saved.verdict === "talk" && prospect.ai_handling) {
    await tellManager(
      String(prospect.id),
      "Клиент ответил на рабочий аккаунт студии, с которого вы ему писали. Дальше переписку ведёт бот с этого же аккаунта — как с обычного касания. Забрать разговор себе — «Отвечать самому» в карточке лида.",
    );
  }
  return { ...saved, bound };
}

const PROSPECT_FIELDS =
  "id, host, status, target, target_kind, target_user_id, contacts, message, claimed_by, touched_by, lead_id, ai_handling, closed_reason, proto_url, hello_at, pitch_at, checked_at, walked, autopilot_at";

/** Строка касания из PROSPECT_FIELDS. Лид и закрепление здесь только читаются. */
type ProspectRow = HandTouch &
  Record<
    | "id"
    | "host"
    | "target_user_id"
    | "message"
    | "lead_id"
    | "ai_handling"
    | "closed_reason"
    | "proto_url"
    | "hello_at"
    | "pitch_at"
    | "checked_at"
    | "walked"
    | "autopilot_at",
    unknown
  > &
  Record<"claimed_by" | "touched_by", string | null>;

/** Что лежит в ответе модели, который ждал ручной отправки, а бот его не отправил. */
const HAND_REPLY_LEFT = "не отправлено ботом: ответ ждал ручной отправки, а разговор перешёл на рабочий аккаунт";

/**
 * Перевести разговор на рабочий аккаунт, которому ответил клиент.
 *
 * Условие на прежний статус — чтобы не перебить то, что успело случиться
 * между чтением и записью: бот отправил письмо из очереди, менеджер нажал
 * «Связался сам».
 */
async function bindToAccount(
  prospect: ProspectRow,
  who: { account: string; userId: string; handle: string; phone: string },
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const now = new Date().toISOString();
  const { data: updated } = await db
    .from("prospects")
    .update(bindingPatch(prospect, prospect.touched_by ?? prospect.claimed_by, who, now))
    .eq("id", prospect.id)
    .eq("status", prospect.status)
    .select("id");
  if (!updated?.length) return false;

  // Ответы модели, ждавшие, что менеджер отправит их руками, бот не досылает:
  // их могли уже отправить, а клиенту сейчас нужен ответ на новое сообщение.
  await db
    .from("outreach_messages")
    .update({ status: "done", failure: HAND_REPLY_LEFT })
    .eq("prospect_id", prospect.id)
    .eq("direction", "out")
    .eq("status", "queued");

  // Касание не отмечали — первого письма в ленте нет. Модель, отвечая, не
  // должна ссылаться на несказанное: кладём то, что менеджер отправлял.
  if (prospect.status !== "sent" && prospect.message) {
    await db.from("outreach_messages").insert({
      prospect_id: prospect.id,
      lead_id: prospect.lead_id,
      direction: "out",
      author: "staff",
      body: String(prospect.message).slice(0, 4000),
      status: "sent",
      sent_at: now,
    });
  }
  return true;
}

/**
 * Ответ клиента, принесённый руками.
 *
 * По ручному маршруту переписка идёт в WhatsApp или голосом: клиент отвечает
 * менеджеру на телефон, и к нам это не приходит ничем. Владелец: «и тут же
 * подхватывает ИИ после написанного сообщения пользователю до выяснения
 * BANT» — подхватить модель может только то, что ей показали, поэтому ответ
 * переносит человек.
 *
 * Дальше всё то же самое, что и с телеграмом: свип видит неотвеченное
 * входящее, модель пишет ответ, ответ ложится в очередь. Отправит его снова
 * человек — скауту по этому маршруту отправлять некуда.
 */
export async function recordManualInbound(
  prospectId: string,
  body: string,
): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const { data: prospect } = await db
    .from("prospects")
    .select("id, host, target, target_user_id, lead_id, claimed_by, ai_handling, closed_reason, proto_url, message, hello_at, pitch_at, checked_at, walked, autopilot_at")
    .eq("id", prospectId)
    .maybeSingle();
  if (!prospect) return { matched: false };

  return saveInbound(prospect, body);
}

/**
 * Первая строка сообщения «клиент написал». Касание закрыли «Клиент
 * отказался» / «Игнорирует», а клиент вернулся — это надо сказать прямо:
 * лид уже «проиграли», и если разговор пошёл, его стоит открыть снова.
 */
function writesAgain(closedReason: unknown): string {
  const closed = String(closedReason ?? "");
  return isCloseReason(closed)
    ? `Клиент, которого отметили «${CLOSE_TEXT[closed].label}», написал снова — отвечаете вы. Лид закрыт «проиграли»: если разговор пошёл, верните ему статус «в работе».`
    : "Клиент написал — отвечаете вы:";
}

/** Общий хвост обоих путей: записать, оценить, при нужде отпустить модель. */
async function saveInbound(
  prospect: {
    id: unknown;
    host: unknown;
    lead_id: unknown;
    ai_handling: unknown;
    closed_reason?: unknown;
    proto_url?: unknown;
    message?: unknown;
    hello_at?: unknown;
    pitch_at?: unknown;
    checked_at?: unknown;
    walked?: unknown;
    /** Касание автопрогона: письмо к нему пишется после ответа (LETTER_AFTER_REPLY). */
    autopilot_at?: unknown;
    claimed_by?: unknown;
  },
  raw: string,
): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };

  const body = raw.trim().slice(0, 4000);
  if (!body) return { matched: false };

  // Автоответчик компании («Мы отвечаем в рабочее время», «Ваше сообщение
  // передано менеджеру») — не ответ (lib/admin/sales-after-reply.ts): ни
  // кружка, ни письма, ни модели, ни строки менеджеру. Ждём живого ответа.
  // Для обеих половин A/B: это исправление ошибки.
  if (isAutoReply(body)) {
    await saveAutoReply(prospect, body);
    return { matched: true, host: String(prospect.host), verdict: "auto" };
  }

  // «Передам руководству» — у половины «new» через 2 дня один вопрос
  // «Руководитель успел посмотреть?» (sales-after-reply-store → runBossAsks).
  if (objectionOf(body) === "boss" && salesNew({ sales_arm: await salesArmOf(String(prospect.id)) })) {
    await db
      .from("prospects")
      .update({ boss_promised_at: new Date().toISOString() })
      .eq("id", prospect.id)
      .is("boss_promised_at", null);
  }

  // Ответ на «Здравствуйте»: письма о сайте клиент ещё не видел
  // (lib/admin/hello-first.ts). Отказ и просьба позвать человека идут
  // обычным путём — к человеку, письмо не уходит.
  const hello = waitsForPitch(prospect);
  if (hello && pitchAfter(readInbound(body))) return answerHello(prospect, body);

  // Письмо после «Здравствуйте» стоит в очереди, а клиент написал ещё раз
  // («да?», «кто это?»): на это ответит само письмо — второй ответ модели
  // поверх него вышел бы перебивающим.
  const pitching = Boolean(prospect.pitch_at) && (await pitchQueued(String(prospect.id)));

  await db.from("outreach_messages").insert({
    prospect_id: prospect.id,
    lead_id: prospect.lead_id,
    direction: "in",
    author: "staff",
    body,
    status: "done",
    ...(pitching ? { answered_at: new Date().toISOString() } : {}),
  });
  if (pitching) return { matched: true, host: String(prospect.host), verdict: "hello" };

  const patch: Record<string, unknown> = { replied_at: new Date().toISOString() };
  // Кружок спрашивает одно — хотите ли макет, — и «да» на него — согласие.
  const afterCircle = prospect.pitch_at ? await circleWasPitch(String(prospect.id), String(prospect.pitch_at)) : false;
  const read = readInbound(body, { afterCircle });
  // Прототип в письме уже был (lib/proto/auto) — «прототип» в ответе значит
  // не «соберите», а «посмотрел»: правки, цена, сроки. Это разговор для
  // человека, а не рассылка «нужен прототип» всей команде. «Был» — значит
  // ссылка стоит в самом письме: сборка заранее выключена (AUTO_PROTO), и у
  // компании может остаться ссылка с прошлых дней, которой клиент не видел.
  const protoSent =
    typeof prospect.proto_url === "string" &&
    prospect.proto_url !== "" &&
    String(prospect.message ?? "").includes(prospect.proto_url);
  // Касание автопрогона до лида: переписку до согласия на макет ведёт модель
  // (владелец, 13.10.2026: «по одному сообщению не можем определить. Пусть
  // ИИ ведёт переписку до макета, дальше мы»). Короткое «Добрый вечер»,
  // «спасибо», «посмотрю» — не повод звать человека: модель ответит и снова
  // предложит макет. Отказ, «+», «позвоните», «пришлите» — как всегда.
  const aiLeads = untilMockup(prospect);
  const verdict = read === "proto" && protoSent ? "proto_ready" : aiLeads && read === "unclear" ? "talk" : read;

  // Просьбу не писать и просьбу позвать человека модель не обсуждает.
  // Первая — потому что следующее сообщение после неё и есть то, за что
  // аккаунты блокируют. Вторая — потому что «сейчас позову менеджера» с
  // продолжением расспросов читается как обман.
  if (verdict !== "talk" && prospect.ai_handling) {
    patch.ai_handling = false;
    patch.handover_reason = HANDOVER_TEXT[verdict] ?? verdict;
  }
  await db.from("prospects").update(patch).eq("id", prospect.id);

  // Касание автопрогона ничьё, пока клиент не ответил: первый ответ заводит
  // лид и отдаёт его команде через очередь на тёплые лиды
  // (lib/admin/autopilot-reply.ts). Дальше — как с любым касанием: ответы
  // тому, кто лид взял.
  const auto = await routeAutopilotReply(String(prospect.id), body, verdict).catch((error: unknown) => {
    console.error("автопрогон: ответ не ушёл команде", error instanceof Error ? error.message : error);
    return null;
  });

  // «Хотят прототип» — всей команде, кто первый возьмёт (prototype-claim).
  // Повторная просьба того же клиента второй рассылки не запускает и идёт
  // как обычный ответ — тому, у кого лид сейчас.
  const announced = verdict === "proto" ? await announcePrototype(String(prospect.id), body) : null;

  // Лид автопрогона с просьбой о прототипе раздаёт рассылка «🔥 Нужен
  // прототип». Не ушла — в очередь, как любой ответ: ничьим лид не остаётся.
  if (auto?.kind === "held" && !announced) await offerLead(String(prospect.id), auto.leadId, body);

  // Клиент согласился на бесплатный макет — в ту же переписку сразу ссылка на
  // условия, на которых макет даётся (content/mockup-terms, раздел 5). Для
  // ознакомления, без вопроса «согласны?»: условия принимаются действиями
  // клиента после неё. Один раз на клиента — как и рассылка команде. По
  // ручному маршруту сообщение ждёт в карточке, отправляет человек.
  if (announced) {
    const lang = detectLang(body);
    await queueReply({
      prospectId: String(prospect.id),
      leadId: (prospect.lead_id as string | null) ?? null,
      body: protoTermsText(lang),
    });
    // Половина «new»: цена одной строкой сразу, до макета (владелец,
    // 17.10.2026) — kind 'price', по нему считается ступень «цена названа».
    if (lang !== "en" && salesNew({ sales_arm: await salesArmOf(String(prospect.id)) })) {
      await queueReply({
        prospectId: String(prospect.id),
        leadId: (prospect.lead_id as string | null) ?? null,
        body: priceLine(lang),
        kind: PRICE_KIND,
      });
    }
  }

  if (verdict !== "talk" && !announced) {
    // Ответили на «Здравствуйте» — письма о сайте клиент не видел, и
    // менеджер, открыв переписку, должен это знать до того, как напишет.
    const unseen = hello ? "\n\nКлиент получил только «Здравствуйте» — письмо о сайте не уходило." : "";
    await tellManager(String(prospect.id), `Ответ по ${prospect.host}: ${HANDOVER_TEXT[verdict] ?? verdict}.${unseen}\n\n${body.slice(0, 500)}`, {
      refuse: true,
    });
  } else if (!prospect.ai_handling) {
    // Модель разговор не ведёт — её отпустили или его забрал человек. Тогда
    // кроме человека ответить некому, и молчать о сообщении нельзя: раньше
    // оно ложилось в переписку, и клиент ждал, пока кто-то откроет карточку.
    await tellManager(String(prospect.id), `${writesAgain(prospect.closed_reason)}\n\n${body.slice(0, 500)}`, { refuse: true });
  }

  return { matched: true, host: String(prospect.host), verdict };
}

/**
 * Клиент ответил на «Здравствуйте» (lib/admin/hello-first.ts).
 *
 * Ответил по-русски — в очередь ответов ложится кружок из «Избранного»
 * рабочего аккаунта: он сам и есть предложение, письмо за ним не идёт. Не
 * ушёл кружок — письмо уходит вместо него (markCircleSkipped). Ответил на
 * другом языке — письмо без приветствия на языке ответа, с паузой: ответ
 * через секунду выглядит как робот.
 *
 * Модель на этот ответ не отвечает — за неё ответит кружок или письмо, —
 * поэтому входящее сразу помечено отвеченным. Лид автопрогона заводится не
 * здесь, а на ответ на кружок или письмо: «да?» на приветствие — ещё не
 * тёплый лид.
 *
 * Проверке сайта больше трёх дней (CLAUDE.md, «проверка по факту») — письмо
 * не уходит: разговор человеку, он напишет, проверив сайт. Кружок про сайт
 * ничего не утверждает и уходит и тогда.
 */
async function answerHello(
  prospect: Parameters<typeof saveInbound>[0],
  body: string,
): Promise<{ matched: boolean; host?: string; verdict?: string }> {
  const db = serviceClient();
  if (!db) return { matched: false };
  const id = String(prospect.id);
  const host = String(prospect.host);
  const now = Date.now();
  const at = new Date(now).toISOString();

  await db.from("outreach_messages").insert({
    prospect_id: id,
    lead_id: prospect.lead_id,
    direction: "in",
    author: "staff",
    body,
    status: "done",
    answered_at: at,
  });

  // Условно: два быстрых ответа подряд («да», «кто это?») письмо дважды не ставят.
  const { data: claimed } = await db
    .from("prospects")
    .update({ replied_at: at, pitch_at: at })
    .eq("id", id)
    .is("pitch_at", null)
    .select("id");
  if (!claimed?.length) return { matched: true, host, verdict: "hello" };

  const sentLang = letterLang(String(prospect.message ?? ""), (prospect.walked as { lang?: string } | null)?.lang);
  const lang = replyLang(body, sentLang);

  const circle = circleLangFor(lang);
  if (circle) {
    const sendAfter = new Date(now + CIRCLE_AFTER_MS).toISOString();
    // Половина «new»: за несколько секунд до кружка — строка, что он про его
    // сайт (sales-after-reply → introLine). Скаут шлёт её, ждёт
    // INTRO_BEFORE_MS и шлёт кружок (nextReply → intro). Строка ложится
    // первой: в ленте она перед кружком. Миграция 0168 не применена — kind
    // 'intro' база не примет, и кружок уйдёт без строки, как раньше.
    if (salesNew({ sales_arm: await salesArmOf(id) })) {
      const { data: full } = await db.from("prospects").select("host, label, place_id, contacts").eq("id", id).maybeSingle();
      await db.from("outreach_messages").insert({
        prospect_id: id,
        lead_id: prospect.lead_id,
        direction: "out",
        author: "staff",
        kind: "intro",
        body: introLine(circle, introTargetOf(full ?? { host: prospect.host })),
        status: "queued",
        send_after: sendAfter,
      });
    }
    await db.from("outreach_messages").insert({
      prospect_id: id,
      lead_id: prospect.lead_id,
      direction: "out",
      author: "staff",
      kind: "circle",
      body: circleBody(circle),
      status: "queued",
      send_after: sendAfter,
    });
    return { matched: true, host, verdict: "hello" };
  }

  const queued = await queueHelloLetter(prospect, lang, now + PITCH_AFTER_MS, body);
  return { matched: true, host, verdict: queued ? "hello" : "hello_stale" };
}

/**
 * Письмо тем, кто ответил на «Здравствуйте» не по-русски или кому не ушёл
 * кружок: без приветствия, на языке ответа. Письма нет, проверка сайта
 * старше трёх дней или перевод не вышел — разговор человеку, и это видно в
 * строке менеджеру. true — письмо в очереди.
 */
async function queueHelloLetter(
  prospect: Parameters<typeof saveInbound>[0],
  lang: HelloLang,
  sendAt: number,
  inbound: string,
  /** false — письмо уже пытались дописать (letter-later): откладывать снова нельзя. */
  options: { defer?: boolean } = {},
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const id = String(prospect.id);
  const host = String(prospect.host);
  const letter = withoutGreeting(String(prospect.message ?? "")).trim();
  const fresh = checkFresh((prospect.checked_at as string | null) ?? null, Date.now());
  const sentLang = letterLang(String(prospect.message ?? ""), (prospect.walked as { lang?: string } | null)?.lang);

  const handOverHello = async (reason: string) => {
    await db.from("prospects").update({ ai_handling: false, handover_reason: reason }).eq("id", id);
    await tellManager(id, `Ответ по ${host}: ${reason}.\n\n${inbound.slice(0, 500)}`, { refuse: true });
    return false;
  };
  if (!fresh) return handOverHello("ответил на «Здравствуйте», но проверке сайта больше трёх дней — письмо не ушло: проверьте сайт и напишите сами");
  // Автопрогон пишет письмо после ответа (LETTER_AFTER_REPLY): скаут только
  // отмечает, на каком языке ответили, письмо напишет и поставит свип
  // (lib/admin/letter-later.ts) — модель процессу скаута не грузим.
  if (!letter && prospect.autopilot_at && LETTER_AFTER_REPLY && options.defer !== false) {
    await db
      .from("prospects")
      .update({ letter_wanted: lang, letter_wanted_at: new Date(sendAt).toISOString() })
      .eq("id", id);
    return true;
  }
  if (!letter) return handOverHello("ответил на «Здравствуйте», а письма о сайте нет — напишите сами");

  // Письмо на языке сайта, а ответили на другом — перевод того же письма,
  // уже прошедшего проверку. Модель грузится только здесь: этот файл читает
  // и процесс скаута.
  let text = letter;
  if (lang !== sentLang) {
    const { translateLetter } = await import("@/lib/admin/letter-translate");
    const translated = await translateLetter(letter, lang, host);
    if (!translated) return handOverHello(`ответил на «Здравствуйте» на другом языке (${LANG_LABEL[lang]}), а письмо перевести не вышло — напишите сами`);
    text = translated;
  }

  await db.from("outreach_messages").insert({
    prospect_id: id,
    lead_id: prospect.lead_id,
    direction: "out",
    author: "staff",
    kind: "text",
    body: text.slice(0, 4000),
    status: "queued",
    send_after: new Date(sendAt).toISOString(),
  });

  // Прототип, собранный заранее, уходит вместе с письмом (lib/proto/auto).
  if (typeof prospect.proto_url === "string" && prospect.proto_url && text.includes(prospect.proto_url)) {
    await db
      .from("protos")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("prospect_id", id)
      .eq("auto", true)
      .eq("status", "ready");
  }
  return true;
}

const LANG_LABEL: Record<HelloLang, string> = { ru: "по-русски", uz: "по-узбекски", en: "по-английски" };

/**
 * Письмо, которое свип дописал после ответа (lib/admin/letter-later.ts), —
 * в ту же очередь, что и письмо, написанное заранее: перевод на язык ответа,
 * прототип, а не вышло — разговор человеку. Письма так и нет — тоже человеку:
 * второй раз не откладываем.
 */
export async function queueLaterLetter(prospectId: string, lang: HelloLang): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data: prospect } = await db.from("prospects").select(PROSPECT_FIELDS).eq("id", prospectId).maybeSingle();
  if (!prospect) return false;
  const { data: inbound } = await db
    .from("outreach_messages")
    .select("body")
    .eq("prospect_id", prospectId)
    .eq("direction", "in")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return queueHelloLetter(prospect as unknown as ProspectRow, lang, Date.now(), String(inbound?.body ?? ""), { defer: false });
}

/** Предложением был кружок: после «Здравствуйте» ушёл он, а письма не было. */
async function circleWasPitch(prospectId: string, pitchAt: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("outreach_messages")
    .select("kind, status")
    .eq("prospect_id", prospectId)
    .eq("direction", "out")
    .gte("created_at", pitchAt);
  const rows = data ?? [];
  // Строка перед кружком (intro) — не письмо: «да» на кружок с ней — то же согласие.
  return rows.some((r) => r.kind === "circle" && r.status === "sent") && !rows.some((r) => (r.kind ?? "text") === "text" && r.status === "sent");
}

/** Письмо после «Здравствуйте» ещё ждёт отправки. */
async function pitchQueued(prospectId: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { count } = await db
    .from("outreach_messages")
    .select("id", { count: "exact", head: true })
    .eq("prospect_id", prospectId)
    .eq("direction", "out")
    .eq("author", "staff")
    .eq("status", "queued");
  return Boolean(count);
}

/** Входящие, на которые ещё не отвечали и по которым модель ещё ведёт. */
export async function pendingTalks(limit = 5): Promise<Inbound[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("outreach_messages")
    .select("id, prospect_id, lead_id, body, created_at")
    .eq("direction", "in")
    .is("answered_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  const out: Inbound[] = [];
  for (const row of data ?? []) {
    const { data: p } = await db
      .from("prospects")
      .select("id, host, label, niche, target, message, findings, lead_id, ai_handling, request_no, claimed_by, autopilot_at")
      .eq("id", row.prospect_id)
      .maybeSingle();
    if (!p) continue;

    // Модель отпустили — входящее остаётся неотвеченным намеренно: на него
    // отвечает человек, и пометить его «обработанным» значило бы потерять
    // его из виду в панели.
    if (!p.ai_handling) continue;

    const { data: staff } = p.claimed_by
      ? // Только работающий: отключённому не пишем о клиенте и его именем
        // не подписываемся.
        await db
          .from("staff")
          .select("display_name, telegram_user_id")
          .eq("id", p.claimed_by)
          .eq("is_active", true)
          .maybeSingle()
      : { data: null };

    const { count } = await db
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", p.id)
      .eq("direction", "out")
      .eq("author", "ai");

    out.push({
      messageId: String(row.id),
      createdAt: String(row.created_at),
      prospectId: String(p.id),
      leadId: (row.lead_id as string | null) ?? (p.lead_id as string | null) ?? null,
      host: String(p.host),
      label: (p.label as string | null) ?? null,
      target: String(p.target ?? ""),
      body: String(row.body),
      findings: Array.isArray(p.findings)
        ? (p.findings as { title?: string; impact?: string }[])
            .map((f) => ({ title: String(f.title ?? ""), impact: String(f.impact ?? "") }))
            .filter((f) => f.title)
        : [],
      firstMessage: String(p.message ?? ""),
      requestNo: (p.request_no as string | null) ?? null,
      managerName: String(staff?.display_name ?? "менеджер студии"),
      managerChatId: Number(staff?.telegram_user_id) || null,
      repliesSoFar: count ?? 0,
      untilMockup: untilMockup(p),
      salesNew: salesNew({ sales_arm: await salesArmOf(String(p.id)) }),
      niche: circleNicheOf(p),
      siteHost: typeof p.host === "string" && p.host ? String(p.host) : null,
    });
  }
  return out;
}

/**
 * После этого входящего клиент написал ещё. «Добрый вечер» и следом «Какие
 * идеи?» — один заход: отвечать на каждое отдельно значит дважды подряд
 * писать человеку. Отвечаем на последнее — модель видит всю ленту.
 */
export async function laterInbound(prospectId: string, createdAt: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { count } = await db
    .from("outreach_messages")
    .select("id", { count: "exact", head: true })
    .eq("prospect_id", prospectId)
    .eq("direction", "in")
    .gt("created_at", createdAt);
  return Boolean(count);
}

/** Лента разговора целиком — её читает и модель, и менеджер в карточке. */
export async function threadFor(prospectId: string): Promise<TalkRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("outreach_messages")
    .select("direction, body")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []).map((row) => ({ direction: row.direction as "in" | "out", body: String(row.body) }));
}

export async function queueReply(input: {
  prospectId: string;
  leadId: string | null;
  body: string;
  /** Не раньше: ответ модели — через 40–120 секунд, как человек набирает (humanSendAfter). */
  sendAfter?: string | null;
  /** 'price' — строка о цене после «+» (sales-after-reply, PRICE_KIND). */
  kind?: "text" | typeof PRICE_KIND;
}): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const row = {
    prospect_id: input.prospectId,
    lead_id: input.leadId,
    direction: "out",
    author: "ai",
    body: input.body.slice(0, 4000),
    status: "queued",
    ...(input.sendAfter ? { send_after: input.sendAfter } : {}),
  };
  const { error } = await db.from("outreach_messages").insert({ ...row, kind: input.kind ?? "text" });
  // Миграция 0168 не применена — 'price' база не примет: строка уходит
  // обычным текстом, клиенту всё равно.
  if (error && input.kind && input.kind !== "text") await db.from("outreach_messages").insert(row);
}

/**
 * Автоответчик компании — в ленту, чтобы менеджер видел, что пришло, но
 * отвеченным и с kind 'auto': ни модель, ни счёт «ответили» его не берут.
 * Касание не трогаем — ни replied_at, ни pitch_at: ждём живого ответа.
 */
async function saveAutoReply(prospect: { id: unknown; lead_id: unknown }, body: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const row = {
    prospect_id: prospect.id,
    lead_id: prospect.lead_id,
    direction: "in",
    author: "staff",
    body,
    status: "done",
    answered_at: new Date().toISOString(),
  };
  const { error } = await db.from("outreach_messages").insert({ ...row, kind: "auto" });
  if (error) await db.from("outreach_messages").insert(row);
}

export async function markAnswered(messageId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outreach_messages").update({ answered_at: new Date().toISOString() }).eq("id", messageId);
}

/**
 * Модель отпускает разговор.
 *
 * Всегда с причиной и всегда с уведомлением: разговор, тихо оставленный без
 * ответа, для клиента выглядит так же, как если бы им перестали
 * заниматься, — а он, в отличие от нас, об этом не узнает.
 */
export async function handOver(prospectId: string, reason: string, note: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ ai_handling: false, handover_reason: HANDOVER_TEXT[reason] ?? reason })
    .eq("id", prospectId);
  // Касание автопрогона, которое модель вела до макета, ничьё: лид
  // заводится сейчас и идёт в очередь на тёплые лиды — строку о нём получит
  // тот, кому лид достанется (lib/admin/autopilot-reply.ts).
  if (await leadOnHandover(prospectId, note).catch(() => null)) return;
  await tellManager(prospectId, note);
}

/**
 * Касание автопрогона, по которому лида ещё нет: модель ведёт переписку до
 * согласия на макет. Взял человек или лид уже заведён — как обычно.
 */
export function untilMockup(p: { autopilot_at?: unknown; lead_id?: unknown; claimed_by?: unknown; ai_handling?: unknown }): boolean {
  return Boolean(p.autopilot_at) && !p.lead_id && !p.claimed_by && p.ai_handling !== false;
}

/**
 * Строка тому, кто ведёт разговор, — и только ему.
 *
 * Не в общий чат: лид касания уже принадлежит человеку, и объявлять о нём
 * всей команде значит звать остальных на чужой разговор. Ведёт тот, кто
 * нажал «Отвечать самому» (handled_by), — это может быть руководитель или
 * владелец, а не менеджер касания; иначе — тот, за кем касание.
 */
export async function tellManager(
  prospectId: string,
  text: string,
  options: { refuse?: boolean } = {},
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const { data: p } = await db
    .from("prospects")
    .select("claimed_by, handled_by, lead_id, host, status, closed_reason, sent_via, target_kind")
    .eq("id", prospectId)
    .maybeSingle();
  const to = p?.handled_by ?? p?.claimed_by;
  if (!p || !to) return false;

  const { data: staff } = await db
    .from("staff")
    .select("telegram_user_id, notify_off")
    .eq("id", to)
    .eq("is_active", true)
    .maybeSingle();
  const chat = Number(staff?.telegram_user_id);
  if (!Number.isFinite(chat) || chat === 0) return false;
  // Галочка «Ответы клиентов на касания» снята — ответ ждёт в «Касаниях».
  if (!wants(staff?.notify_off as string[] | null, "talks")) return false;

  // С какого аккаунта разговор: отвечать клиенту — оттуда же. Разговор на
  // рабочем аккаунте — ответить можно прямо в карточке (queueStaffReply).
  const from = sentFrom({ sent_via: p.sent_via as string | null, target_kind: p.target_kind as string | null }, await accountTags());
  const via = from ? `\nАккаунт: ${esc(sentFromText(from))}` : "";
  const url = p.lead_id ? `${siteUrl}/admin/leads/${p.lead_id}#talk` : "";
  const link = !url ? "" : from ? `\n\nОтветить прямо в карточке лида — уйдёт с этого аккаунта:\n${url}` : `\n\n${url}`;
  const body = `<b>Касание · ${esc(String(p.host))}</b>${via}\n${esc(text)}${link}`;
  // Под ответом клиента — «Клиент отказался»: «не интересно» читают здесь,
  // и закрыть касание надо там же, не открывая панель.
  if (options.refuse && canClose({ status: String(p.status), closed_reason: p.closed_reason as string | null })) {
    return sendWithRows(chat, body, [[{ text: CLOSE_TEXT.refused.button, callback_data: closeCallback("refused", prospectId) }]]);
  }
  return sendMessage(chat, body);
}

/**
 * Строка перед кружком и ниша кружка — только у половины «new»
 * (sales-after-reply). У «old» — общий кружок без строки, как раньше.
 */
async function circleExtras(prospectId: string): Promise<{ niche: CircleNiche; intro: { id: string; body: string } | null }> {
  const db = serviceClient();
  if (!db || !salesNew({ sales_arm: await salesArmOf(prospectId) })) return { niche: "general", intro: null };
  const [{ data: p }, { data: intro }] = await Promise.all([
    db.from("prospects").select("niche, label, host").eq("id", prospectId).maybeSingle(),
    db
      .from("outreach_messages")
      .select("id, body")
      .eq("prospect_id", prospectId)
      .eq("direction", "out")
      .eq("kind", "intro")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    niche: p ? circleNicheOf(p) : "general",
    intro: intro ? { id: String(intro.id), body: String(intro.body) } : null,
  };
}

/** Следующий ответ на отправку — для скаута. */
export async function nextReply(
  /** Чей разговор: отвечаем с того аккаунта, с которого ушло первое письмо. */
  account: string = MAIN_ACCOUNT,
): Promise<{
  id: string;
  target: string;
  /** @адрес — если по номеру пользователя Telegram его не нашёл. */
  fallback?: string;
  body: string;
  host: string;
  kind: "text" | "circle";
  /** Язык кружка: какой из «Избранного» отправить (circle-store, pickCircles). */
  lang: CircleLang;
  /** Ниша кружка (половина «new»): нет кружка ниши — общий. */
  niche: CircleNiche;
  /** Строка перед кружком: скаут шлёт её, ждёт `introGapMs` и шлёт кружок. */
  intro?: { id: string; body: string };
  introGapMs?: number;
} | null> {
  const db = serviceClient();
  if (!db) return null;

  /**
   * Берём пачку, а не одно.
   *
   * Ручной маршрут скауту не отдаётся — по нему переписка идёт в WhatsApp
   * или голосом, и отправить в телеграм нечего. Но взять одно верхнее и
   * вернуть null, увидев ручное, значило бы намертво запереть очередь: одно
   * такое сообщение не даёт уйти всем, кто стоит за ним, а ждут там живые
   * люди, которые сами нам написали. Поэтому ручное пропускается, а не
   * останавливает.
   */
  // Кружок и письмо в старых касаниях клались одной вставкой — с одинаковым
  // временем, и порядок между ними решает send_after: кружок раньше.
  const { data: queued } = await db
    .from("outreach_messages")
    .select("id, body, prospect_id, kind, send_after")
    .eq("direction", "out")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .order("send_after", { ascending: true, nullsFirst: true })
    .limit(REPLY_SCAN);
  if (!queued?.length) return null;
  const now = Date.now();

  // Какие дополнительные аккаунты живы — один запрос на проход. Нужен
  // главному: переписку отключённого аккаунта отправить некому, и молча
  // держать её в очереди значит оставить клиента без ответа.
  let live: Set<string> | null = null;
  const alive = async (other: string): Promise<boolean> => {
    if (!live) {
      const { data } = await db.from("tg_accounts").select("id").in("status", ["active", "paused"]);
      live = new Set((data ?? []).map((a) => String(a.id)));
    }
    return live.has(other);
  };

  // Письмо одного разговора не обгоняет его же кружок, который ещё ждёт.
  const waiting = new Set<string>();
  for (const row of queued) {
    // Строка перед кружком сама не уходит: её шлёт скаут вместе с кружком.
    if (row.kind === "intro") continue;
    if (row.send_after && Date.parse(String(row.send_after)) > now) {
      waiting.add(String(row.prospect_id));
      continue;
    }
    if (waiting.has(String(row.prospect_id))) continue;
    const { data: p } = await db
      .from("prospects")
      .select("target, host, target_kind, target_user_id, sent_via")
      .eq("id", row.prospect_id)
      .maybeSingle();
    if (!p?.target) continue;
    // Чужой разговор — его отправит тот аккаунт, которому клиент отвечал.
    // Ответ с другого номера для клиента — незнакомец в его переписке.
    const owner = accountOf(p.sent_via as string | null);
    if (owner !== account) {
      // Аккаунт отключили — отвечать с него некому: разговор человеку.
      if (account === MAIN_ACCOUNT && !(await alive(owner))) {
        await markReplyFailed(
          String(row.id),
          "Рабочий аккаунт, с которого писали клиенту, отключён — ответьте сами со своего аккаунта",
        );
      }
      continue;
    }

    // Ответ модели по ручному маршруту никуда не девается: он остаётся в
    // очереди и показывается менеджеру в карточке, чтобы тот отправил его
    // своей рукой. Скаут же, попытавшись, получил бы отказ и передал бы
    // разговор человеку с пометкой «не удалось» — то есть испортил бы ровно
    // то, что здесь работает.
    if (p.target_kind === "manual") continue;

    // Пишем тому, кого телеграм вернул при отправке: у найденного по номеру
    // @адреса может не быть.
    const to = String(p.target_user_id ?? "") || String(p.target);
    // Номер пользователя Telegram находит только по кэшу сессии, а кэш живёт
    // в памяти скаута и пропадает с перезапуском. @адрес находится всегда.
    const handle = String(p.target);
    const circle = row.kind === "circle";
    const extras = circle ? await circleExtras(String(row.prospect_id)) : null;
    return {
      ...(extras?.intro ? { intro: extras.intro, introGapMs: INTRO_BEFORE_MS } : {}),
      niche: extras?.niche ?? "general",
      id: String(row.id),
      target: to,
      fallback: handle !== to && handle.startsWith("@") ? handle : undefined,
      body: String(row.body),
      host: String(p.host),
      kind: row.kind === "circle" ? "circle" : "text",
      lang: circleLangOf(String(row.body)),
    };
  }
  return null;
}

export async function markReplySent(
  id: string,
  /** Номер ушедшего сообщения в Telegram: по нему «Исправить» правит именно его (outreach-edit). */
  tgMessageId?: string | number | null,
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const number = tgMessageId === undefined || tgMessageId === null || !Number.isFinite(Number(tgMessageId)) ? null : Number(tgMessageId);
  const { data: sent } = await db
    .from("outreach_messages")
    .update({ status: "sent", sent_at: new Date().toISOString(), failure: null, ...(number ? { tg_message_id: number } : {}) })
    .eq("id", id)
    .select("prospect_id, lead_id, body")
    .maybeSingle();

  // Ушла ссылка на макет — у клиента пошли 48 часов акции
  // (lib/admin/mockup-offer.ts). Повторная ссылка срок не продлевает.
  if (sent?.prospect_id && hasMockupLink(String(sent.body ?? ""))) {
    const { data: p } = await db.from("prospects").select("sent_via").eq("id", sent.prospect_id).maybeSingle();
    await recordMockupSent({
      prospectId: String(sent.prospect_id),
      leadId: (sent.lead_id as string | null) ?? null,
      body: String(sent.body),
      account: (p?.sent_via as string | null) ?? null,
    }).catch((error: unknown) => console.error("акция по макету: не записалась", error instanceof Error ? error.message : error));
  }
}

/**
 * Кружок не ушёл — в «Избранном» аккаунта его нет или Telegram не принял
 * (получатель запретил голосовые и видеосообщения). Разговор человеку не
 * передаётся (в отличие от markReplyFailed): вместо кружка уходит письмо на
 * языке ответа клиента, и ему есть что прочитать.
 */
export async function markCircleSkipped(id: string, reason: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const why = circleFailText(reason);
  const { data: row } = await db
    .from("outreach_messages")
    .update({ status: "done", failure: why.slice(0, 500) })
    .eq("id", id)
    .select("prospect_id, created_at")
    .maybeSingle();
  if (!row?.prospect_id) return;

  // Строка «это про ваш сайт» без кружка ни к чему: снимаем, если не ушла.
  await db
    .from("outreach_messages")
    .update({ status: "done", failure: "не отправлено: кружок не ушёл" })
    .eq("prospect_id", row.prospect_id)
    .eq("direction", "out")
    .eq("kind", "intro")
    .eq("status", "queued");

  // Кружок был предложением сам по себе — тогда вместо него уходит письмо
  // на языке ответа клиента. Письмо уже стоит или ушло — второго не
  // ставим. Считаем с ответа на «Здравствуйте» (pitch_at), а не с кружка:
  // 08.10.2026 кружок дослали тем, кому днём вместо него ушло письмо, и
  // второе такое же письмо им было бы дублем.
  const { data: pitched } = await db.from("prospects").select("pitch_at").eq("id", row.prospect_id).maybeSingle();
  const since = new Date(
    Math.min(Date.parse(String(row.created_at)), pitched?.pitch_at ? Date.parse(String(pitched.pitch_at)) : Infinity),
  ).toISOString();
  const { count } = await db
    .from("outreach_messages")
    .select("id", { count: "exact", head: true })
    .eq("prospect_id", row.prospect_id)
    .eq("direction", "out")
    .eq("kind", "text")
    .in("status", ["queued", "sent"])
    .gte("created_at", since);
  if (count) return;

  const { data: prospect } = await db
    .from("prospects")
    .select("id, host, lead_id, ai_handling, message, checked_at, walked, proto_url, autopilot_at")
    .eq("id", row.prospect_id)
    .maybeSingle();
  if (!prospect) return;

  // Язык письма — язык последнего ответа клиента (владелец, 09.10.2026: «У
  // кого запрещены голосовые и кружки, пишем на языке ответа»). Ответа в
  // ленте нет — язык кружка.
  const { data: inbound } = await db
    .from("outreach_messages")
    .select("body")
    .eq("prospect_id", row.prospect_id)
    .eq("direction", "in")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sentLang = letterLang(String(prospect.message ?? ""), (prospect.walked as { lang?: string } | null)?.lang);
  const lang = inbound ? replyLang(String(inbound.body ?? ""), sentLang) : CIRCLE_LANG;
  await queueHelloLetter(prospect, lang, Date.now(), `(${why.slice(0, 200)})`);
}

/**
 * Ответ не ушёл.
 *
 * В отличие от первого касания, очередь здесь не снимается целиком: это
 * ответ человеку, который сам нам написал, и ограничение за рассылку так
 * не зарабатывают. Но разговор передаётся человеку — молчание после его
 * вопроса хуже, чем чужая рука в переписке.
 */
export async function markReplyFailed(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data } = await db
    .from("outreach_messages")
    .update({ status: "failed", failure: why.slice(0, 500) })
    .eq("id", id)
    .select("prospect_id")
    .maybeSingle();

  if (data?.prospect_id) {
    await handOver(String(data.prospect_id), "failed", `Ответ не удалось отправить: ${why.slice(0, 200)}. Напишите сами.`);
  }
}

export type TalkView = {
  prospectId: string;
  host: string;
  aiHandling: boolean;
  handoverReason: string | null;
  target: string | null;
  /** С какого аккаунта идёт разговор (sentFrom); null — «Написал сам». */
  from: { label: string | null; handle: string | null } | null;
  lines: TalkLine[];
};

/**
 * Реплика разговора. `status` — у исходящих: «queued» ещё ждёт скаута,
 * «failed» не ушло (`failure` — почему), «sent» ушло.
 */
export type TalkLine = {
  id: string;
  direction: "in" | "out";
  author: "staff" | "ai";
  body: string;
  created_at: string;
  status: "queued" | "sent" | "failed" | "done";
  failure: string | null;
  /** Можно нажать «Исправить» (outreach-edit → lineEditable): наше, текстом, не приветствие, 48 часов. */
  editable?: boolean;
  /** Последняя правка этой реплики: ждёт, исправлено или не вышло и почему. */
  edit?: { state: EditState; failure: string | null } | null;
};

/**
 * Разговор для карточки лида.
 *
 * Показывается тому, за кем лид закреплён, без отдельного раскрытия. Гейт
 * на переписке из чата стоит потому, что там клиент рассказывал о себе
 * незнакомому ассистенту и не ждал, что это прочтёт вся студия. Здесь всё
 * наоборот: это наша собственная переписка с сайта, который мы сами
 * выбрали, и менеджеру она нужна ровно для того, чтобы её продолжить.
 */
export async function talkForLead(leadId: string): Promise<TalkView | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data: p } = await db
    .from("prospects")
    .select("id, host, target, ai_handling, handover_reason, sent_via, target_kind, hello_at, pitch_at")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (!p) return null;

  const [{ data }, tags, edits] = await Promise.all([
    db
      .from("outreach_messages")
      .select("id, direction, author, body, created_at, status, failure, kind, sent_at, tg_message_id")
      .eq("prospect_id", p.id)
      .order("created_at", { ascending: true })
      .limit(200),
    accountTags(),
    lastEdits([String(p.id)]),
  ]);
  const touch = { hello_at: (p.hello_at as string | null) ?? null, pitch_at: (p.pitch_at as string | null) ?? null };
  const now = Date.now();

  return {
    prospectId: String(p.id),
    host: String(p.host),
    aiHandling: Boolean(p.ai_handling),
    handoverReason: (p.handover_reason as string | null) ?? null,
    target: (p.target as string | null) ?? null,
    from: sentFrom({ sent_via: p.sent_via as string | null, target_kind: p.target_kind as string | null }, tags),
    lines: (data ?? [])
      // Снятое до отправки клиент не видел — и в ленте его нет
      // (HAND_REPLY_LEFT, STAFF_TOOK_OVER).
      .filter((row) => !(row.direction === "out" && row.status === "done" && row.failure))
      .map((row) => ({
        id: String(row.id),
        direction: row.direction as "in" | "out",
        author: (row.author as "staff" | "ai") ?? "ai",
        body: String(row.body),
        created_at: String(row.created_at),
        status: (row.status as TalkLine["status"]) ?? "done",
        failure: (row.failure as string | null) ?? null,
        // Ручной маршрут пишет человек со своего телефона — править нам нечего.
        editable:
          p.target_kind !== "manual" &&
          lineEditable(
            {
              direction: String(row.direction),
              kind: (row.kind as string | null) ?? "text",
              status: String(row.status),
              sent_at: (row.sent_at as string | null) ?? null,
              created_at: String(row.created_at),
              tg_message_id: (row.tg_message_id as string | number | null) ?? null,
            },
            touch,
            now,
          ),
        edit: (() => {
          const e = edits.get(String(row.id));
          return e ? { state: e.state, failure: e.failure } : null;
        })(),
      })),
  };
}

/** Что лежит в ответе модели, снятом потому, что менеджер ответил сам из карточки. */
const STAFF_TOOK_OVER = "не отправлено: менеджер ответил сам из карточки лида";

/** Длиннее ответа менеджера в Telegram не отправить одним сообщением. */
export const STAFF_REPLY_MAX = 4000;

export type StaffReplyError = "empty" | "too_long" | "gone" | "manual" | "offline" | "failed";

/**
 * Ответ менеджера прямо из карточки лида.
 *
 * Владелец, 11.10.2026: «чтобы у нас менеджеры не переключались между
 * несколькими аккаунтами, а общались прямо через внутреннюю карточку… это
 * будет автоматически делаться». Ответ ложится в ту же очередь, что ответы
 * модели, и скаут отправляет его с аккаунта разговора (nextReply по
 * sent_via) — за полминуты, без часового предела: это не первое письмо
 * незнакомому.
 *
 * Ответил человек — модель замолкает, как после «Отвечать самому», а её
 * неотправленные ответы снимаются: клиенту не придут два ответа подряд от
 * «одного» собеседника. Ручной маршрут (писали со своего телефона) отсюда
 * не отправить: с какого номера там шла переписка, мы не знаем.
 */
export async function queueStaffReply(input: {
  prospectId: string;
  leadId: string;
  staffId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; reason: StaffReplyError }> {
  const body = input.body.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > STAFF_REPLY_MAX) return { ok: false, reason: "too_long" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: p } = await db
    .from("prospects")
    .select("id, status, target, target_kind, lead_id")
    .eq("id", input.prospectId)
    .maybeSingle();
  if (!p || String(p.lead_id ?? "") !== input.leadId || p.status !== "sent" || !p.target) return { ok: false, reason: "gone" };
  if (p.target_kind === "manual") return { ok: false, reason: "manual" };

  const now = new Date().toISOString();
  await db
    .from("prospects")
    .update({ ai_handling: false, handover_reason: "менеджер отвечает сам", handled_by: input.staffId })
    .eq("id", p.id);
  await db
    .from("outreach_messages")
    .update({ status: "done", failure: STAFF_TOOK_OVER })
    .eq("prospect_id", p.id)
    .eq("direction", "out")
    .eq("author", "ai")
    .eq("status", "queued");
  // На то, что клиент написал до этого, ответил человек.
  await db
    .from("outreach_messages")
    .update({ answered_at: now })
    .eq("prospect_id", p.id)
    .eq("direction", "in")
    .is("answered_at", null);

  const { error } = await db.from("outreach_messages").insert({
    prospect_id: p.id,
    lead_id: input.leadId,
    direction: "out",
    author: "staff",
    body,
    status: "queued",
  });
  if (error) {
    console.error("переписка: ответ менеджера не встал в очередь", error.message);
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

/**
 * Менеджер забирает разговор себе.
 *
 * Без уведомления и без причины из словаря: это не передача от модели по
 * нужде, а решение человека, и объяснять его некому — он же его и принял.
 * Зато запоминается, кто это: дальше каждое сообщение клиента уходит ему
 * (tellManager), потому что модель больше не ответит.
 */
export async function takeOverTalk(prospectId: string, staffId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ ai_handling: false, handover_reason: "менеджер отвечает сам", handled_by: staffId })
    .eq("id", prospectId);
}
