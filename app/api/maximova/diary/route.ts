import { NextResponse, type NextRequest } from "next/server";

import {
  InputError,
  addGroup,
  addHomework,
  addPayment,
  addRemark,
  addStudent,
  homeworkMessage,
  learnersOf,
  levelMessage,
  markReminded,
  parentsOf,
  paymentById,
  paymentMessage,
  remarkMessage,
  setPaymentStatus,
  studentById,
  updateStudent,
} from "@/lib/clients/maximova/school";
import { SESSION_COOKIE } from "@/lib/clients/maximova/session";
import { viewerBySession } from "@/lib/clients/maximova/store";
import { botConfig, sendMessage } from "@/lib/clients/maximova/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Дневник: всё, что Дарья делает в кабинете. Одна точка входа, действие —
 * полем action. Доступ — только администратору (MAXIMOVA_ADMIN_TG_IDS).
 *
 * Что касается ребёнка — задание, замечание, оплата, результат теста —
 * сразу уходит его родителю в Telegram. Задание и похвала уходят и самому
 * ученику, если он вошёл по своей ссылке. Сколько сообщений дошло, отвечаем
 * числом: Дарья видит, что родитель ещё не привязан, а не думает, что
 * написала ему.
 */

type Sent = { sent: number; recipients: number };

/**
 * Разослать родителям. Возвращает и сколько дошло, и скольким слали: «никому
 * не слали — родитель не привязан» и «слали, но Telegram не ответил» — разные
 * новости для Дарьи, и путать их нельзя.
 */
async function notify(targets: { chatId: number; name: string }[], text: (name: string) => string): Promise<Sent> {
  const config = botConfig();
  if (!config || !targets.length) return { sent: 0, recipients: targets.length };
  const results = await Promise.all(targets.map((t) => sendMessage(config, t.chatId, text(t.name))));
  return { sent: results.filter(Boolean).length, recipients: targets.length };
}

export async function POST(request: NextRequest) {
  const viewer = viewerBySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (viewer?.role !== "admin") return new NextResponse(null, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    switch (body.action) {
      case "addGroup":
        return NextResponse.json({ ok: true, group: addGroup(body) });

      case "addStudent":
        return NextResponse.json({ ok: true, student: addStudent(body) });

      case "updateStudent": {
        const student = updateStudent(body);
        const sent =
          typeof body.level === "string" && student.level
            ? await notify(parentsOf({ studentId: student.id }), () => levelMessage(student))
            : null;
        return NextResponse.json({ ok: true, student, ...sent });
      }

      case "addHomework": {
        const homework = addHomework(body);
        const target = { studentId: homework.studentId, groupId: homework.groupId };
        const sent = await notify([...parentsOf(target), ...learnersOf(target)], (name) => homeworkMessage(homework, name));
        return NextResponse.json({ ok: true, homework, ...sent });
      }

      case "addRemark": {
        const remark = addRemark(body);
        const target = { studentId: remark.studentId };
        const to = remark.kind === "praise" ? [...parentsOf(target), ...learnersOf(target)] : parentsOf(target);
        const sent = await notify(to, (name) => remarkMessage(remark, name));
        return NextResponse.json({ ok: true, remark, ...sent });
      }

      case "addPayment":
      case "remindPayment": {
        const payment = body.action === "addPayment" ? addPayment(body) : paymentById(Number(body.id));
        if (!payment) throw new InputError("Оплата не найдена");
        const sent = await notify(parentsOf({ studentId: payment.studentId }), (name) => paymentMessage(payment, name));
        if (sent.sent) markReminded(payment.id);
        return NextResponse.json({ ok: true, payment, ...sent });
      }

      case "setPayment": {
        const payment = paymentById(Number(body.id));
        if (!payment || (body.status !== "due" && body.status !== "paid")) throw new InputError("Оплата не найдена");
        setPaymentStatus(payment.id, body.status);
        return NextResponse.json({ ok: true });
      }

      case "student":
        return NextResponse.json({ ok: true, student: studentById(Number(body.id)) });

      default:
        return NextResponse.json({ ok: false, error: "Неизвестное действие" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ ok: false, error: error.message }, { status: 422 });
    console.error("maximova: дневник", error);
    return NextResponse.json({ ok: false, error: "Не получилось сохранить" }, { status: 500 });
  }
}
