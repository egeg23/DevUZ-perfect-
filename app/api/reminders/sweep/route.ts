import { record } from "@/lib/admin/audit";
import { DELIVERY_GIVE_UP } from "@/lib/admin/ownership";
import { recordFailure, recordSuccess } from "@/lib/admin/sweep-health";
import { runCoach } from "@/lib/admin/coach-store";
import { sweepOrders } from "@/lib/admin/order-sweep-run";
import { runTalks } from "@/lib/admin/outreach-talk-run";
import { runRazborShift } from "@/lib/razbor/shift-run";
import { sendShiftReports, warnAboutSilentShifts } from "@/lib/admin/shift-reports";
import { sendScoutDigest } from "@/lib/scout/digest";
import { purgeExpiredSignals, resendUnnotifiedSignals } from "@/lib/scout/store";
import { esc, sendWithButtons } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отправка созревших напоминаний.
 *
 * Дёргается таймером systemd с самого сервера, поэтому защищено не кукой, а
 * общим секретом в заголовке. Секрет не задан — endpoint отвечает отказом
 * всем подряд, включая таймер. Обратный порядок («нет секрета — пускаем
 * всех») выглядит удобнее ровно до того дня, когда переменная не доедет до
 * контейнера, и адрес окажется открыт наружу.
 *
 * За один проход отправляется не больше пачки: если база накопила тысячу
 * просроченных напоминаний, вывалить их разом в личку менеджеру — верный
 * способ добиться, чтобы он выключил уведомления от бота совсем.
 */
const BATCH = 25;

/**
 * Сколько раз пробовать доставить одно напоминание.
 *
 * Пометка «отправлено» ставится только после успеха — иначе первый же сбой
 * Telegram съедал бы напоминание навсегда. Обратная сторона: напоминание,
 * которое доставить нельзя в принципе (менеджер заблокировал бота), при
 * таймере в пять минут пересылалось бы вечно, каждый раз занимая место в
 * пачке из двадцати пяти и вытесняя те, что дошли бы.
 *
 * Пять попыток — это около получаса. Дальше свип перестаёт пробовать, а
 * панель показывает напоминание как недоставленное: молча уронить его в
 * тишину хуже, чем показать человеку, что до него не достучались.
 *
 * Значение живёт в lib/admin/ownership рядом с типом напоминания: карточка
 * должна рисовать «не доставлено» ровно тогда, когда свип сдался, и две
 * несвязанные константы разъехались бы при первой же правке.
 */
const MAX_ATTEMPTS = DELIVERY_GIVE_UP;

export async function POST(request: Request) {
  const expected = process.env.REMINDER_SWEEP_SECRET;
  const provided = request.headers.get("x-devuz-sweep");

  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  const db = serviceClient();
  if (!db) {
    // Здоровье писать некуда — база и есть то, что недоступно. Отвечаем
    // честно, а таймер придёт через пять минут.
    return Response.json({ ok: false, error: "no-db" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("lead_reminders")
    .select("id, lead_id, staff_id, due_at, note, kind, attempts")
    .lte("due_at", now)
    .is("sent_at", null)
    .is("done_at", null)
    .is("cancelled_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("due_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error("reminders: не прочитал очередь", error.message);
    await recordFailure(`чтение очереди: ${error.message}`);
    return Response.json({ ok: false, error: "read" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of data ?? []) {
    const [staff, lead] = await Promise.all([
      db
        .from("staff")
        .select("telegram_user_id, is_active")
        .eq("id", reminder.staff_id as string)
        .maybeSingle(),
      db
        .from("leads")
        .select("request_no, company, contact_name, status")
        .eq("id", reminder.lead_id as string)
        .maybeSingle(),
    ]);

    // Сотрудник отключён — напоминание гасим, а не копим: слать в личку
    // человеку, у которого уже нет доступа к панели, незачем.
    if (!staff.data?.is_active) {
      await db
        .from("lead_reminders")
        .update({ cancelled_at: now })
        .eq("id", reminder.id as string);
      skipped += 1;
      continue;
    }

    const who =
      (lead.data?.company as string | null) ||
      (lead.data?.contact_name as string | null) ||
      "без названия";
    const number = (lead.data?.request_no as string | null) ?? String(reminder.lead_id).slice(0, 8);

    // Кнопки прямо под напоминанием: разбирать его человек должен там, где
    // он его читает. «Открой панель, найди лид, отметь готово» — три
    // действия вместо одного, и после третьего раза их перестают делать.
    const ok = await sendWithButtons(
      staff.data.telegram_user_id as number,
      [
        "<b>Напоминание по лиду</b>",
        "",
        `<b>${esc(number)}</b> — ${esc(who)}`,
        reminder.note ? esc(String(reminder.note)) : "",
      ]
        .filter(Boolean)
        .join("\n"),
      [
        // «Открыть» — ссылка, а не действие: карточку всё равно открывает
        // браузер, и гонять это через колбэк значит ждать ответа сервера
        // ради перехода, который Telegram сделает сам.
        { text: "Открыть", url: `${siteUrl}/admin/leads/${reminder.lead_id}` },
        { text: "+2 часа", callback_data: `rem:snooze:${reminder.id}` },
        { text: "Готово", callback_data: `rem:done:${reminder.id}` },
      ],
    );

    // Пометка «отправлено» ставится только после успеха. Иначе первый же
    // сбой Telegram молча съедал бы напоминание навсегда.
    if (!ok) {
      await db
        .from("lead_reminders")
        .update({
          attempts: ((reminder.attempts as number | null) ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", reminder.id as string);
      failed += 1;
      continue;
    }

    await db
      .from("lead_reminders")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", reminder.id as string);

    await record("reminder.sent", {
      actorStaffId: reminder.staff_id as string,
      targetType: "lead",
      targetId: reminder.lead_id as string,
      meta: { kind: reminder.kind, due_at: reminder.due_at },
    });

    sent += 1;
  }

  // Уборка просроченных сигналов скаута едет здесь же, а не отдельным
  // таймером. Своего расписания ей не нужно — она дешёвая и работает по
  // частичному индексу, — а лишний юнит systemd это лишняя вещь, которую
  // однажды забудут включить на новом сервере.
  const purged = await purgeExpiredSignals();

  // Досылка сигналов, которые Telegram не принял с первого раза. Тоже
  // здесь: своего расписания ей не нужно, а окно в сутки и предел попыток
  // не дают ей превратиться в рассылку.
  const resent = await resendUnnotifiedSignals();

  // Утренняя сводка скаута — тоже здесь, по той же причине: ей не нужен
  // свой таймер, ей нужен кто-то, кто ходит регулярно и посмотрит на часы.
  const digest = await sendScoutDigest();

  // Заявки на покупку — по той же причине здесь. Заявка, забытая без
  // счёта, и оплаченный заказ, которому нечего отдать, — это деньги, и
  // узнавать о них от самого покупателя значит узнавать слишком поздно.
  const orders = await sweepOrders();

  // Рекомендации — здесь же: в понедельник утром недельные, каждое утро
  // дневные. Сам решает, пора ли; в остальные проходы возвращается сразу.
  const coach = await runCoach(new Date());
  if (coach.errors.length) console.error("coach:", coach.errors.join("; "));

  // Первичка по касаниям: клиент ответил на наше письмо — отвечает модель.
  // Здесь же, а не отдельным таймером: разговор не срочный, пять минут
  // задержки ему только на пользу, а лишний процесс на сервере — нет.
  const talks = await runTalks();
  if (talks.errors.length) console.error("касания:", talks.errors.join("; "));

  // Ночная смена разборов. Переехала сюда с плановой сессии: у той не было
  // ни базы, ни репозитория, ни ключа модели, и три ночи подряд она
  // отрабатывала по полчаса, не оставляя следа. Сама решает, пора ли —
  // раз в сутки, в восемь утра по Ташкенту.
  const razbor = await runRazborShift(new Date());
  if (razbor.errors.length) console.error("разборы:", razbor.errors.join("; "));

  // Отчёты плановых смен — владельцу. У смены нет токена бота, у свипа есть.
  // Сторож молчания идёт ПЕРЕД отправкой: тревога, поднятая сейчас, уходит
  // этим же проходом, а не через пять минут следующим.
  const silent = await warnAboutSilentShifts(new Date());
  const shifts = await sendShiftReports();

  // Проход считается неудачным, только если не дошло вообще ничего из
  // того, что пробовали. Одно недоставленное письмо при двадцати
  // доставленных — это заблокировавший бота менеджер, а не авария, и
  // будить владельца из-за него нельзя: разбуженный впустую перестаёт
  // читать эти сообщения к третьему разу.
  const attempted = sent + failed;
  if (attempted > 0 && sent === 0) {
    await recordFailure(`Telegram не принял ни одного из ${failed} напоминаний`);
  } else {
    await recordSuccess();
  }

  return Response.json({
    coach,
    shifts,
    silent,
    talks,
    razbor,
    ok: true,
    sent,
    skipped,
    failed,
    purged,
    resent,
    digest,
    orders,
    queued: (data ?? []).length,
  });
}
