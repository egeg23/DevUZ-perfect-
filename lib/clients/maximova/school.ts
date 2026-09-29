import { randomBytes } from "node:crypto";

import { AGES, SCHOOL } from "@/content/clients/maximova/facts";
import { open } from "@/lib/clients/maximova/db";
import { esc } from "@/lib/clients/maximova/telegram";

/**
 * Дневник школы: группы, ученики, задания, замечания, оплата.
 *
 * Всё, что Дарья пишет в дневник, уходит родителю в Telegram — сообщения
 * собирают функции *Message ниже, а отправляет маршрут. Родитель видит
 * только своих детей: каждая выборка для родителя идёт через
 * parent_telegram_id.
 */

type Row = Record<string, unknown>;
const now = () => new Date().toISOString();
const str = (v: unknown) => (v == null ? "" : String(v));
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/[ \t]+/g, " ").trim().slice(0, max) : "";

export type Group = { id: number; title: string; language: string; age: string; schedule: string };
export type Student = {
  id: number;
  name: string;
  language: string;
  age: string;
  groupId: number | null;
  groupTitle: string;
  schedule: string;
  level: string;
  parentTelegramId: number | null;
  inviteCode: string;
};
export type Homework = { id: number; groupId: number | null; studentId: number | null; text: string; due: string; createdAt: string };
export type Remark = { id: number; studentId: number; kind: "praise" | "remark"; text: string; createdAt: string };
export type Payment = {
  id: number;
  studentId: number;
  title: string;
  amount: string;
  due: string;
  status: "due" | "paid";
  createdAt: string;
  remindedAt: string;
};

const toGroup = (r: Row): Group => ({
  id: Number(r.id),
  title: str(r.title),
  language: str(r.language),
  age: str(r.age),
  schedule: str(r.schedule),
});

const toStudent = (r: Row): Student => ({
  id: Number(r.id),
  name: str(r.name),
  language: str(r.language),
  age: str(r.age),
  groupId: r.group_id == null ? null : Number(r.group_id),
  groupTitle: str(r.group_title),
  schedule: str(r.group_schedule),
  level: str(r.level),
  parentTelegramId: r.parent_telegram_id == null ? null : Number(r.parent_telegram_id),
  inviteCode: str(r.invite_code),
});

const toHomework = (r: Row): Homework => ({
  id: Number(r.id),
  groupId: r.group_id == null ? null : Number(r.group_id),
  studentId: r.student_id == null ? null : Number(r.student_id),
  text: str(r.text),
  due: str(r.due),
  createdAt: str(r.created_at),
});

const toRemark = (r: Row): Remark => ({
  id: Number(r.id),
  studentId: Number(r.student_id),
  kind: r.kind === "praise" ? "praise" : "remark",
  text: str(r.text),
  createdAt: str(r.created_at),
});

const toPayment = (r: Row): Payment => ({
  id: Number(r.id),
  studentId: Number(r.student_id),
  title: str(r.title),
  amount: str(r.amount),
  due: str(r.due),
  status: r.status === "paid" ? "paid" : "due",
  createdAt: str(r.created_at),
  remindedAt: str(r.reminded_at),
});

const STUDENT_SELECT = `select s.*, g.title as group_title, g.schedule as group_schedule
  from students s left join groups g on g.id = s.group_id`;

// ─── Проверки ввода ───────────────────────────────────────────────────────

export class InputError extends Error {}

const need = (value: string, message: string) => {
  if (!value) throw new InputError(message);
  return value;
};
const language = (v: unknown) => {
  const s = clean(v, 40);
  if (!SCHOOL.languages.some((l) => l === s)) throw new InputError("Выберите язык");
  return s;
};
const age = (v: unknown) => {
  const s = clean(v, 20);
  if (!AGES.some((a) => a.range === s)) throw new InputError("Выберите возраст");
  return s;
};
const id = (v: unknown) => {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0) throw new InputError("Не найдено");
  return n;
};
const optionalId = (v: unknown) => (v === "" || v == null ? null : id(v));

// ─── Группы ───────────────────────────────────────────────────────────────

export function addGroup(input: Record<string, unknown>): Group {
  const db = open();
  const r = db
    .prepare("insert into groups (title, language, age, schedule, created_at) values (?, ?, ?, ?, ?)")
    .run(need(clean(input.title, 80), "Как назвать группу?"), language(input.language), age(input.age), clean(input.schedule, 120), now());
  return toGroup(db.prepare("select * from groups where id = ?").get(Number(r.lastInsertRowid)) as Row);
}

export function listGroups(): Group[] {
  return (open().prepare("select * from groups order by id").all() as Row[]).map(toGroup);
}

// ─── Ученики ──────────────────────────────────────────────────────────────

export function addStudent(input: Record<string, unknown>): Student {
  const db = open();
  const r = db
    .prepare(
      `insert into students (name, language, age, group_id, level, invite_code, created_at)
       values (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      need(clean(input.name, 60), "Как зовут ученика?"),
      language(input.language),
      age(input.age),
      optionalId(input.groupId),
      clean(input.level, 120),
      randomBytes(9).toString("base64url"),
      now(),
    );
  return studentById(Number(r.lastInsertRowid))!;
}

export function updateStudent(input: Record<string, unknown>): Student {
  const studentId = id(input.id);
  const db = open();
  if ("groupId" in input) db.prepare("update students set group_id = ? where id = ?").run(optionalId(input.groupId), studentId);
  if ("level" in input) db.prepare("update students set level = ? where id = ?").run(clean(input.level, 120), studentId);
  const student = studentById(studentId);
  if (!student) throw new InputError("Ученик не найден");
  return student;
}

export function studentById(studentId: number): Student | null {
  const row = open().prepare(`${STUDENT_SELECT} where s.id = ?`).get(studentId) as Row | undefined;
  return row ? toStudent(row) : null;
}

export function listStudents(): Student[] {
  return (open().prepare(`${STUDENT_SELECT} where s.active = 1 order by s.name`).all() as Row[]).map(toStudent);
}

export function studentsOfParent(telegramId: number): Student[] {
  return (
    open().prepare(`${STUDENT_SELECT} where s.parent_telegram_id = ? and s.active = 1 order by s.name`).all(telegramId) as Row[]
  ).map(toStudent);
}

export function studentByInvite(code: string): Student | null {
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(code)) return null;
  const row = open().prepare(`${STUDENT_SELECT} where s.invite_code = ?`).get(code) as Row | undefined;
  return row ? toStudent(row) : null;
}

/**
 * Привязать ребёнка к родителю по приглашению. Приглашение одноразовое по
 * смыслу: ребёнок, уже привязанный к другому родителю, не перепривязывается —
 * иначе пересланная ссылка отдала бы дневник чужому человеку.
 */
export function bindInvite(code: string, parentTelegramId: number): "ok" | "taken" | "unknown" {
  const student = studentByInvite(code);
  if (!student) return "unknown";
  if (student.parentTelegramId && student.parentTelegramId !== parentTelegramId) return "taken";
  open().prepare("update students set parent_telegram_id = ? where id = ?").run(parentTelegramId, student.id);
  return "ok";
}

/** Кому из родителей писать: ученик или вся группа. */
export function parentsOf(target: { studentId?: number | null; groupId?: number | null }): { chatId: number; name: string }[] {
  const db = open();
  const rows = target.studentId
    ? (db.prepare("select parent_telegram_id, name from students where id = ? and active = 1").all(target.studentId) as Row[])
    : (db.prepare("select parent_telegram_id, name from students where group_id = ? and active = 1").all(target.groupId ?? -1) as Row[]);
  return rows.filter((r) => r.parent_telegram_id != null).map((r) => ({ chatId: Number(r.parent_telegram_id), name: str(r.name) }));
}

// ─── Задания, замечания, оплата ──────────────────────────────────────────

export function addHomework(input: Record<string, unknown>): Homework {
  const studentId = optionalId(input.studentId);
  const groupId = studentId ? null : id(input.groupId);
  const db = open();
  const r = db
    .prepare("insert into homework (group_id, student_id, text, due, created_at) values (?, ?, ?, ?, ?)")
    .run(groupId, studentId, need(clean(input.text, 2000), "Текст задания"), clean(input.due, 60), now());
  return toHomework(db.prepare("select * from homework where id = ?").get(Number(r.lastInsertRowid)) as Row);
}

export function homeworkFor(student: Student, limit = 10): Homework[] {
  return (
    open()
      .prepare("select * from homework where student_id = ? or (group_id is not null and group_id = ?) order by id desc limit ?")
      .all(student.id, student.groupId ?? -1, limit) as Row[]
  ).map(toHomework);
}

export function recentHomework(limit = 20): (Homework & { target: string })[] {
  return (
    open()
      .prepare(
        `select h.*, coalesce(g.title, s.name) as target from homework h
         left join groups g on g.id = h.group_id left join students s on s.id = h.student_id
         order by h.id desc limit ?`,
      )
      .all(limit) as Row[]
  ).map((r) => ({ ...toHomework(r), target: str(r.target) }));
}

export function addRemark(input: Record<string, unknown>): Remark {
  const db = open();
  const r = db
    .prepare("insert into remarks (student_id, kind, text, created_at) values (?, ?, ?, ?)")
    .run(id(input.studentId), input.kind === "praise" ? "praise" : "remark", need(clean(input.text, 1000), "Текст замечания"), now());
  return toRemark(db.prepare("select * from remarks where id = ?").get(Number(r.lastInsertRowid)) as Row);
}

export function remarksOf(studentId: number, limit = 10): Remark[] {
  return (open().prepare("select * from remarks where student_id = ? order by id desc limit ?").all(studentId, limit) as Row[]).map(toRemark);
}

export function addPayment(input: Record<string, unknown>): Payment {
  const db = open();
  const r = db
    .prepare("insert into payments (student_id, title, amount, due, created_at) values (?, ?, ?, ?, ?)")
    .run(id(input.studentId), need(clean(input.title, 80), "За что оплата?"), clean(input.amount, 30), clean(input.due, 30), now());
  return toPayment(db.prepare("select * from payments where id = ?").get(Number(r.lastInsertRowid)) as Row);
}

export function paymentById(paymentId: number): Payment | null {
  const row = open().prepare("select * from payments where id = ?").get(paymentId) as Row | undefined;
  return row ? toPayment(row) : null;
}

export function setPaymentStatus(paymentId: number, status: Payment["status"]) {
  open().prepare("update payments set status = ? where id = ?").run(status, paymentId);
}

export function markReminded(paymentId: number) {
  open().prepare("update payments set reminded_at = ? where id = ?").run(now(), paymentId);
}

export function paymentsOf(studentId: number, limit = 10): Payment[] {
  return (open().prepare("select * from payments where student_id = ? order by id desc limit ?").all(studentId, limit) as Row[]).map(toPayment);
}

export function openPayments(): (Payment & { studentName: string })[] {
  return (
    open()
      .prepare(
        `select p.*, s.name as student_name from payments p join students s on s.id = p.student_id
         where p.status = 'due' order by p.id desc`,
      )
      .all() as Row[]
  ).map((r) => ({ ...toPayment(r), studentName: str(r.student_name) }));
}

// ─── Сообщения родителям ─────────────────────────────────────────────────

export function homeworkMessage(h: Homework, childName: string): string {
  return [
    `<b>Задание на дом</b> — ${esc(childName)}`,
    esc(h.text),
    h.due ? `Срок: ${esc(h.due)}` : "",
    "\nВсе задания — в кабинете на сайте.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function remarkMessage(r: Remark, childName: string): string {
  const title = r.kind === "praise" ? "Похвала" : "Замечание";
  return `<b>${title}</b> — ${esc(childName)}\n${esc(r.text)}`;
}

export function paymentMessage(p: Payment, childName: string): string {
  return [
    `<b>Напоминание об оплате</b> — ${esc(childName)}`,
    `${esc(p.title)}${p.amount ? `: ${esc(p.amount)}` : ""}`,
    p.due ? `Оплатить до: ${esc(p.due)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function levelMessage(s: Student): string {
  return `<b>Результат вступительного теста</b> — ${esc(s.name)}\nУровень: ${esc(s.level)}${
    s.groupTitle ? `\nГруппа: ${esc(s.groupTitle)}${s.schedule ? ` (${esc(s.schedule)})` : ""}` : ""
  }`;
}
