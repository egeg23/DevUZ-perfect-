import { tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Отчёты плановых смен — владельцу в Telegram.
 *
 * Смена (разборы, эксперимент) пишет строку в `shift_reports`; бот на
 * сервере доносит её. Так у смены появляется голос, которого у неё не было:
 * токена бота в плановой сессии нет, а правило «напиши владельцу» стояло.
 *
 * Отправляется всё неотправленное, старое первым; после доставки строка
 * помечается временем. Не доставилось — останется до следующего прохода,
 * свип ходит каждые пять минут.
 */

const BATCH = 10;

export type ShiftReport = { id: string; shift: string; body: string; created_at: string };

export const SHIFT_TITLE: Record<string, string> = {
  razbor: "Смена разборов",
  experiment: "Эксперимент 300→2000",

  // Выкатка — не смена, а поломка, о которой иначе некому сказать. Красный
  // Action видит тот, кто открыл вкладку Actions; 19 сентября работа
  // простояла в ветке сутки ровно потому, что смотреть в неё было некому.
  // Канал у тревоги тот же, что у смен, а расписания у неё нет и не будет:
  // день без выкаток — обычный день, и сторож молчания о ней не спрашивает.
  deploy: "Выкатка",
};

export function renderShiftReport(report: ShiftReport): string {
  return `<b>${esc(shiftTitle(report.shift))}</b>\n${esc(report.body)}`;
}

/**
 * Заголовок строки. Тревога сторожа приходит тем же каналом, что и отчёт, и
 * должна отличаться от него первым же словом: «Смена разборов — молчит» и
 * «Смена разборов» в ленте Telegram стоят рядом.
 */
export function shiftTitle(shift: string): string {
  if (shift.endsWith(SILENT_SUFFIX)) {
    const base = shift.slice(0, -SILENT_SUFFIX.length);
    return `${SHIFT_TITLE[base] ?? base} — молчит`;
  }
  return SHIFT_TITLE[shift] ?? shift;
}

async function ownerChatId(): Promise<number | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("staff").select("telegram_user_id").eq("role", "admin").eq("is_active", true).limit(1).maybeSingle();
  const id = Number(data?.telegram_user_id);
  return Number.isFinite(id) && id !== 0 ? id : null;
}

export async function sendShiftReports(): Promise<{ sent: number; failed: number }> {
  const db = serviceClient();
  if (!db) return { sent: 0, failed: 0 };

  const { data } = await db
    .from("shift_reports")
    .select("id, shift, body, created_at")
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  const pending = (data ?? []) as ShiftReport[];
  if (!pending.length) return { sent: 0, failed: 0 };

  const chat = await ownerChatId();
  if (!chat) return { sent: 0, failed: pending.length };

  let sent = 0;
  let failed = 0;
  for (const report of pending) {
    const ok = await sendMessage(chat, renderShiftReport(report));
    if (!ok) {
      failed += 1;
      continue;
    }
    await db.from("shift_reports").update({ notified_at: new Date().toISOString() }).eq("id", report.id);
    sent += 1;
  }
  return { sent, failed };
}

/**
 * Сторож молчания.
 *
 * Отчёт смены — это то, что смена написала САМА, дойдя до последнего шага.
 * Смена, упавшая на первом, не напишет ничего, и её провал выглядит ровно
 * как тишина: владелец узнал, что разборов нет, только когда зашёл и
 * посмотрел, — на третий день.
 *
 * Поэтому молчание тоже должно звонить. Если к сроку строки от смены нет,
 * сторож кладёт в ту же таблицу строку о том, что её нет, и она уходит
 * владельцу тем же путём. Отдельного канала у сторожа нет намеренно: канал,
 * которым никто не пользуется, ломается незаметно.
 *
 * Тревога поднимается один раз в сутки на смену: сама строка тревоги и
 * служит отметкой «уже били». Пустая смена, честно написавшая «не нашлось
 * годных сайтов», сторожа не будит — она отчиталась.
 *
 * Расписание живёт здесь константой. Если смену выключают совсем, строку
 * надо убрать отсюда, иначе сторож будет звонить о смене, которой нет.
 */
export const SILENT_SUFFIX = ":silent";

export type ShiftExpectation = {
  shift: string;
  /** Во сколько по Ташкенту запускается смена, ЧЧ:ММ. */
  firesAt: string;
  /** Сколько ждём отчёта после запуска. */
  graceMinutes: number;
};

/**
 * Сторожатся только те смены, которые действительно должны прийти.
 *
 * Разборы стартуют в 08:03 по Ташкенту — теперь не рутиной, а свипом на
 * этом же сервере. Три часа на смену с запасом: самая длинная из
 * наблюдавшихся шла тридцать одну минуту.
 *
 * Эксперимент 300→2000 отсюда убран вместе с выключением его рутины.
 * Сторож, который каждое утро звонит о смене, которую сам владелец и
 * остановил, — это не бдительность, а тревога, которую перестают читать
 * к третьему разу; а вместе с ней перестают читать и настоящие.
 * Вернётся эксперимент — вернётся и строка.
 */
export const SHIFT_SCHEDULE: readonly ShiftExpectation[] = [
  { shift: "razbor", firesAt: "08:03", graceMinutes: 3 * 60 },
];

const MINUTE_MS = 60_000;

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

export type SilentShift = { shift: string; body: string };

/**
 * Какие смены сегодня промолчали.
 *
 * Чистая функция: «сейчас» и уже написанные строки приходят аргументами,
 * иначе проверка зависела бы от часов машины, а день наступал бы по UTC —
 * то есть на пять часов позже, чем у владельца.
 */
export function silentShifts(input: {
  now: Date;
  rows: readonly { shift: string; created_at: string }[];
  schedule?: readonly ShiftExpectation[];
}): SilentShift[] {
  const day = todayInTashkent(input.now);
  const midnight = tashkentMidnight(day).getTime();
  const sameDay = (row: { created_at: string }) => todayInTashkent(new Date(row.created_at)) === day;

  const out: SilentShift[] = [];
  for (const e of input.schedule ?? SHIFT_SCHEDULE) {
    const fired = minutesOf(e.firesAt);
    const deadline = midnight + (fired + e.graceMinutes) * MINUTE_MS;
    if (input.now.getTime() < deadline) continue;

    const today = input.rows.filter(sameDay);
    if (today.some((r) => r.shift === e.shift)) continue;
    if (today.some((r) => r.shift === e.shift + SILENT_SUFFIX)) continue;

    // Какая именно смена — уже сказано заголовком строки; здесь только суть.
    out.push({
      shift: e.shift + SILENT_SUFFIX,
      body:
        `Запуск был в ${e.firesAt}, к ${hhmm(fired + e.graceMinutes)} по Ташкенту отчёта нет. ` +
        `Это не «нечего публиковать»: о пустой смене приходит своя строка. Значит, смена не дошла до последнего шага — ` +
        `откройте её сессию в claude.ai/code и посмотрите, на чём она встала.`,
    });
  }
  return out;
}

/** Складывает тревоги в ту же таблицу: доставит их обычный проход свипа. */
export async function warnAboutSilentShifts(now = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  // Двух суток хватает: сторож смотрит только на сегодняшний день по
  // Ташкенту, а запас закрывает разницу часовых поясов на границе суток.
  const since = new Date(now.getTime() - 2 * 24 * 60 * MINUTE_MS).toISOString();
  const { data } = await db.from("shift_reports").select("shift, created_at").gte("created_at", since);

  const silent = silentShifts({ now, rows: (data ?? []) as { shift: string; created_at: string }[] });
  if (!silent.length) return 0;

  await db.from("shift_reports").insert(silent.map((s) => ({ shift: s.shift, body: s.body })));
  return silent.length;
}
