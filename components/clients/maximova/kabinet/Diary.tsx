"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { AGES, SCHOOL } from "@/content/clients/maximova/facts";
import type { Group, Payment, Student } from "@/lib/clients/maximova/school";

import s from "./kabinet.module.css";

/**
 * Формы дневника для Дарьи. Каждая шлёт одно действие на /api/maximova/diary
 * и обновляет страницу; ответ — сколько родителей получили сообщение в
 * Telegram, чтобы было видно, дошло ли.
 */

type Result = { ok?: boolean; error?: string; sent?: number; recipients?: number };

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: string, data: Record<string, unknown>, done?: string) => {
    setBusy(true);
    setNote(null);
    const response = await fetch("/api/maximova/diary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    }).catch(() => null);
    const result = ((await response?.json().catch(() => null)) ?? {}) as Result;
    setBusy(false);
    if (!result.ok) {
      setNote({ ok: false, text: result.error || "Не получилось. Проверьте интернет и попробуйте ещё раз." });
      return false;
    }
    let sent = "";
    if (typeof result.recipients === "number") {
      if (!result.recipients) sent = " Родитель ещё не привязан — в Telegram не ушло, но в кабинете видно.";
      else if (result.sent === result.recipients) sent = ` Родителям в Telegram: ${result.sent}.`;
      else sent = ` Telegram не ответил: дошло ${result.sent ?? 0} из ${result.recipients}. В кабинете родителя всё видно.`;
    }
    setNote({ ok: true, text: `${done ?? "Сохранено."}${sent}` });
    router.refresh();
    return true;
  };

  return { busy, note, run };
}

const formData = (event: FormEvent<HTMLFormElement>) =>
  Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;

function Note({ note }: { note: { ok: boolean; text: string } | null }) {
  if (!note) return null;
  return (
    <p className={note.ok ? s.success : s.error} role="status">
      {note.text}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const LanguageSelect = () => (
  <select name="language" className={s.input} defaultValue={SCHOOL.languages[0]}>
    {SCHOOL.languages.map((l) => (
      <option key={l}>{l}</option>
    ))}
  </select>
);

const AgeSelect = () => (
  <select name="age" className={s.input} defaultValue={AGES[0].range}>
    {AGES.map((a) => (
      <option key={a.id}>{a.range}</option>
    ))}
  </select>
);

const GroupSelect = ({ groups, value, name = "groupId" }: { groups: Group[]; value?: number | null; name?: string }) => (
  <select name={name} className={s.input} defaultValue={value ?? ""}>
    <option value="">Без группы</option>
    {groups.map((g) => (
      <option key={g.id} value={g.id}>
        {g.title}
      </option>
    ))}
  </select>
);

// ─── Группы ───────────────────────────────────────────────────────────────

export function GroupForm() {
  const { busy, note, run } = useAction();
  return (
    <form
      className={s.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (await run("addGroup", formData(e), "Группа создана.")) form.reset();
      }}
    >
      <Field label="Название">
        <input name="title" className={s.input} placeholder="Например, English 5–8, вт/чт" required />
      </Field>
      <div className={s.row}>
        <Field label="Язык">
          <LanguageSelect />
        </Field>
        <Field label="Возраст">
          <AgeSelect />
        </Field>
      </div>
      <Field label="Расписание">
        <input name="schedule" className={s.input} placeholder="Вт и чт, 17:00–17:45" />
      </Field>
      <button className={s.button} disabled={busy}>
        Создать группу
      </button>
      <Note note={note} />
    </form>
  );
}

// ─── Ученики ──────────────────────────────────────────────────────────────

export function StudentForm({ groups }: { groups: Group[] }) {
  const { busy, note, run } = useAction();
  return (
    <form
      className={s.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (await run("addStudent", formData(e), "Ученик добавлен. Отправьте родителю ссылку-приглашение из его карточки."))
          form.reset();
      }}
    >
      <Field label="Имя ребёнка">
        <input name="name" className={s.input} placeholder="Только имя — фамилия не нужна" required />
      </Field>
      <div className={s.row}>
        <Field label="Язык">
          <LanguageSelect />
        </Field>
        <Field label="Возраст">
          <AgeSelect />
        </Field>
      </div>
      <Field label="Группа">
        <GroupSelect groups={groups} />
      </Field>
      <button className={s.button} disabled={busy}>
        Добавить ученика
      </button>
      <Note note={note} />
    </form>
  );
}

/** Карточка ученика: приглашение, уровень и группа, замечание, оплата. */
export function StudentCard({ student, groups, payments }: { student: Student; groups: Group[]; payments: Payment[] }) {
  const level = useAction();
  const remark = useAction();
  const pay = useAction();
  const [copied, setCopied] = useState(false);

  const invite = () => `${window.location.origin}/maximova/kabinet?invite=${student.inviteCode}`;

  return (
    <li className={s.item}>
      <p className={s.itemTitle}>
        {student.name} · {student.language}, {student.age}
        {student.groupTitle ? ` · ${student.groupTitle}` : ""}
      </p>
      <p className={s.hint}>
        {student.parentTelegramId ? "Родитель привязан — сообщения уходят ему в Telegram." : "Родитель ещё не привязан."}
      </p>
      {!student.parentTelegramId ? (
        <button
          type="button"
          className={s.small}
          onClick={async () => {
            await navigator.clipboard?.writeText(invite()).catch(() => null);
            setCopied(true);
          }}
        >
          {copied ? "Ссылка скопирована — отправьте родителю" : "Скопировать приглашение для родителя"}
        </button>
      ) : null}

      <details className={s.more}>
        <summary>Уровень по тесту и группа</summary>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void level.run("updateStudent", { id: student.id, ...formData(e) }, "Сохранено.");
          }}
        >
          <Field label="Уровень по вступительному тесту">
            <input name="level" className={s.input} defaultValue={student.level} placeholder="Например, A1, начинаем с нуля" />
          </Field>
          <Field label="Группа">
            <GroupSelect groups={groups} value={student.groupId} />
          </Field>
          <button className={s.small} disabled={level.busy}>
            Сохранить и сообщить родителю
          </button>
          <Note note={level.note} />
        </form>
      </details>

      <details className={s.more}>
        <summary>Замечание или похвала</summary>
        <form
          className={s.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            if (await remark.run("addRemark", { studentId: student.id, ...formData(e) }, "Записано.")) form.reset();
          }}
        >
          <div className={s.row}>
            <label className={s.radio}>
              <input type="radio" name="kind" value="praise" defaultChecked /> Похвала
            </label>
            <label className={s.radio}>
              <input type="radio" name="kind" value="remark" /> Замечание
            </label>
          </div>
          <textarea name="text" className={s.input} rows={3} required />
          <button className={s.small} disabled={remark.busy}>
            Записать и отправить родителю
          </button>
          <Note note={remark.note} />
        </form>
      </details>

      <details className={s.more}>
        <summary>Оплата{payments.some((p) => p.status === "due") ? " · есть неоплаченное" : ""}</summary>
        <ul className={s.list}>
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </ul>
        <form
          className={s.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            if (await pay.run("addPayment", { studentId: student.id, ...formData(e) }, "Оплата выставлена.")) form.reset();
          }}
        >
          <Field label="За что">
            <input name="title" className={s.input} placeholder="Абонемент на 3 месяца" required />
          </Field>
          <div className={s.row}>
            <Field label="Сумма">
              <input name="amount" className={s.input} placeholder="2 900 ₽" />
            </Field>
            <Field label="Оплатить до">
              <input name="due" className={s.input} placeholder="5 октября" />
            </Field>
          </div>
          <button className={s.small} disabled={pay.busy}>
            Выставить и напомнить родителю
          </button>
          <Note note={pay.note} />
        </form>
      </details>
    </li>
  );
}

export function PaymentRow({ payment, label }: { payment: Payment; label?: string }) {
  const { busy, note, run } = useAction();
  return (
    <li className={s.payment}>
      <span>
        {label ? `${label}: ` : ""}
        {payment.title}
        {payment.amount ? ` · ${payment.amount}` : ""}
        {payment.due ? ` · до ${payment.due}` : ""} · {payment.status === "paid" ? "оплачено" : "ждёт оплаты"}
      </span>
      <span className={s.row}>
        {payment.status === "due" ? (
          <>
            <button type="button" className={s.small} disabled={busy} onClick={() => run("remindPayment", { id: payment.id }, "Напомнила.")}>
              Напомнить
            </button>
            <button type="button" className={s.small} disabled={busy} onClick={() => run("setPayment", { id: payment.id, status: "paid" })}>
              Оплачено
            </button>
          </>
        ) : (
          <button type="button" className={s.small} disabled={busy} onClick={() => run("setPayment", { id: payment.id, status: "due" })}>
            Вернуть в неоплаченные
          </button>
        )}
      </span>
      <Note note={note} />
    </li>
  );
}

// ─── Задания ──────────────────────────────────────────────────────────────

export function HomeworkForm({ groups, students }: { groups: Group[]; students: Student[] }) {
  const { busy, note, run } = useAction();
  return (
    <form
      className={s.form}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = formData(e);
        const [kind, value] = (data.target || "").split(":");
        const target = kind === "s" ? { studentId: value } : { groupId: value };
        if (await run("addHomework", { text: data.text, due: data.due, ...target }, "Задание выдано.")) form.reset();
      }}
    >
      <Field label="Кому">
        <select name="target" className={s.input} required defaultValue="">
          <option value="" disabled>
            Выберите группу или ученика
          </option>
          <optgroup label="Группа">
            {groups.map((g) => (
              <option key={g.id} value={`g:${g.id}`}>
                {g.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ученик">
            {students.map((st) => (
              <option key={st.id} value={`s:${st.id}`}>
                {st.name}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label="Задание">
        <textarea name="text" className={s.input} rows={4} required />
      </Field>
      <Field label="Срок">
        <input name="due" className={s.input} placeholder="К четвергу" />
      </Field>
      <button className={s.button} disabled={busy}>
        Выдать и отправить родителям
      </button>
      <Note note={note} />
    </form>
  );
}

// ─── Приглашение для родителя ────────────────────────────────────────────

/** Родитель уже вошёл и открыл приглашение — одна кнопка, чтобы привязать ребёнка. */
export function BindInvite({ code, childName }: { code: string; childName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className={s.card}>
      <p className={s.lead}>
        Приглашение в дневник: <strong>{childName}</strong>.
      </p>
      <button
        type="button"
        className={s.button}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const response = await fetch("/api/maximova/invite", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code }),
          }).catch(() => null);
          const data = (await response?.json().catch(() => null)) as Result | null;
          setBusy(false);
          if (data?.ok) router.replace("/maximova/kabinet");
          else setError(data?.error || "Не получилось. Попробуйте ещё раз.");
        }}
      >
        Добавить в мой кабинет
      </button>
      {error ? <p className={s.error}>{error}</p> : null}
    </div>
  );
}
