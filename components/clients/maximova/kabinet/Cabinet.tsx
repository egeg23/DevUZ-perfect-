import { TEACHER } from "@/content/clients/maximova/facts";
import {
  homeworkFor,
  listGroups,
  listStudents,
  openPayments,
  paymentsOf,
  recentHomework,
  remarksOf,
  studentsOfParent,
  type Student,
} from "@/lib/clients/maximova/school";
import type { Viewer } from "@/lib/clients/maximova/store";
import { bookingsOf, countUsers, listBookings } from "@/lib/clients/maximova/store";

import { Credit } from "../Credit";
import { Logout, StatusToggle } from "./Actions";
import { BindInvite, GroupForm, HomeworkForm, PaymentRow, StudentCard, StudentForm } from "./Diary";
import { Login } from "./Login";
import s from "./kabinet.module.css";

const DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});
const DAY = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

export const TABS = [
  { id: "zayavki", title: "Заявки" },
  { id: "ucheniki", title: "Ученики" },
  { id: "gruppy", title: "Группы" },
  { id: "zadaniya", title: "Задания" },
  { id: "oplata", title: "Оплата" },
] as const;
export type Tab = (typeof TABS)[number]["id"];

/**
 * Личный кабинет.
 *
 * Дарья — рабочий кабинет по вкладкам: заявки, ученики (приглашение
 * родителю, уровень по тесту, группа, замечания, оплата), группы, задания,
 * неоплаченное. Всё, что касается ребёнка, уходит родителю в Telegram.
 *
 * Родитель — дневник по каждому ребёнку: группа и расписание, уровень,
 * задания, замечания, оплата — и свои заявки.
 */
export function Cabinet({
  viewer,
  botReady,
  botUsername,
  tab,
  invite,
}: {
  viewer: Viewer | null;
  botReady: boolean;
  botUsername: string;
  tab: Tab;
  invite: { code: string; childName: string } | null;
}) {
  return (
    <div className={s.page}>
      <header className={s.bar}>
        <a href="/maximova" className={s.brand}>
          ← {TEACHER.name}
        </a>
        {viewer ? <Logout /> : null}
      </header>
      <main className={viewer?.role === "admin" ? `${s.main} ${s.wide}` : s.main}>
        {!viewer ? (
          <>
            <h1 className={s.title}>Личный кабинет</h1>
            {invite ? (
              <p className={s.lead}>
                Вас пригласили в дневник: <strong>{invite.childName}</strong>. Войдите через Telegram — ребёнок появится
                в вашем кабинете, а задания, замечания и напоминания об оплате будут приходить в Telegram.
              </p>
            ) : (
              <p className={s.lead}>
                Здесь — ваши заявки, а после вступительного теста — дневник ребёнка: задания на дом, замечания и
                напоминания об оплате. Регистрация — это первый вход через Telegram, пароль не нужен.
              </p>
            )}
            <Login ready={botReady} invite={invite?.code ?? ""} />
          </>
        ) : viewer.role === "admin" ? (
          <Admin viewer={viewer} tab={tab} />
        ) : (
          <Parent viewer={viewer} botUsername={botUsername} invite={invite} />
        )}
      </main>
      <footer className={s.footer}>
        <a href="/maximova/privacy">Политика обработки персональных данных</a>
        <Credit />
      </footer>
    </div>
  );
}

// ─── Родитель ─────────────────────────────────────────────────────────────

function Parent({
  viewer,
  botUsername,
  invite,
}: {
  viewer: Viewer;
  botUsername: string;
  invite: { code: string; childName: string } | null;
}) {
  const children = studentsOfParent(viewer.telegramId);
  const bookings = bookingsOf(viewer.telegramId);
  const pendingInvite = invite && !children.some((c) => c.inviteCode === invite.code) ? invite : null;

  return (
    <>
      <h1 className={s.title}>Здравствуйте, {viewer.firstName || "родитель"}!</h1>
      {pendingInvite ? <BindInvite code={pendingInvite.code} childName={pendingInvite.childName} /> : null}

      {children.map((child) => (
        <ChildDiary key={child.id} child={child} />
      ))}

      {!children.length ? (
        <section className={s.card} aria-labelledby="k-diary">
          <h2 id="k-diary" className={s.h2}>
            Дневник ребёнка
          </h2>
          <p className={s.lead}>
            После вступительного теста я пришлю вам ссылку-приглашение — по ней ребёнок появится здесь: группа,
            расписание, уровень, задания, замечания и оплата. Всё это будет приходить и в мой Telegram-бот
            {botUsername ? (
              <>
                {" "}
                <a href={`https://t.me/${botUsername}`}>@{botUsername}</a>
              </>
            ) : null}
            .
          </p>
        </section>
      ) : null}

      <section className={s.card} aria-labelledby="k-bookings">
        <h2 id="k-bookings" className={s.h2}>
          Ваши заявки
        </h2>
        {bookings.length ? (
          <ul className={s.list}>
            {bookings.map((b) => (
              <li key={b.id} className={s.item}>
                <p className={s.itemTitle}>
                  № {b.id} · {b.language}, {b.age}, {b.format.toLowerCase()}
                </p>
                <p className={s.hint}>
                  {DATE.format(new Date(b.createdAt))} · {b.status === "new" ? "Скоро свяжусь с вами" : "Я с вами связалась"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.lead}>
            Заявок из кабинета пока нет. <a href="/maximova#zapis">Записаться на пробное −30%</a>
          </p>
        )}
      </section>
    </>
  );
}

function ChildDiary({ child }: { child: Student }) {
  const homework = homeworkFor(child, 10);
  const remarks = remarksOf(child.id, 10);
  const payments = paymentsOf(child.id, 5);
  return (
    <section className={s.card} aria-label={`Дневник: ${child.name}`}>
      <h2 className={s.h2}>{child.name}</h2>
      <dl className={s.facts}>
        <dt>Язык</dt>
        <dd>
          {child.language}, {child.age}
        </dd>
        <dt>Группа</dt>
        <dd>
          {child.groupTitle || "подбирается"}
          {child.schedule ? ` · ${child.schedule}` : ""}
        </dd>
        <dt>Уровень</dt>
        <dd>{child.level || "после вступительного теста"}</dd>
      </dl>

      <h3 className={s.h3}>Задания на дом</h3>
      {homework.length ? (
        <ul className={s.list}>
          {homework.map((h) => (
            <li key={h.id} className={s.item}>
              <p className={s.pre}>{h.text}</p>
              <p className={s.hint}>
                {DAY.format(new Date(h.createdAt))}
                {h.due ? ` · срок: ${h.due}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.hint}>Заданий пока нет.</p>
      )}

      <h3 className={s.h3}>Замечания и похвала</h3>
      {remarks.length ? (
        <ul className={s.list}>
          {remarks.map((r) => (
            <li key={r.id} className={s.item}>
              <p>
                <span className={r.kind === "praise" ? s.praise : s.remark}>{r.kind === "praise" ? "Похвала" : "Замечание"}</span>{" "}
                {r.text}
              </p>
              <p className={s.hint}>{DAY.format(new Date(r.createdAt))}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.hint}>Пока ничего.</p>
      )}

      <h3 className={s.h3}>Оплата</h3>
      {payments.length ? (
        <ul className={s.list}>
          {payments.map((p) => (
            <li key={p.id} className={s.item}>
              <p>
                {p.title}
                {p.amount ? ` · ${p.amount}` : ""}
                {p.due ? ` · до ${p.due}` : ""}
              </p>
              <p className={p.status === "paid" ? s.hint : s.remark}>{p.status === "paid" ? "Оплачено" : "Ждёт оплаты"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.hint}>Счетов пока нет.</p>
      )}
    </section>
  );
}

// ─── Дарья ────────────────────────────────────────────────────────────────

function Admin({ viewer, tab }: { viewer: Viewer; tab: Tab }) {
  const bookings = listBookings(100);
  const students = listStudents();
  const groups = listGroups();
  const due = openPayments();
  const fresh = bookings.filter((b) => b.status === "new").length;

  return (
    <>
      <h1 className={s.title}>Кабинет преподавателя</h1>
      <p className={s.lead}>
        {viewer.firstName ? `${viewer.firstName}, н` : "Н"}овых заявок: {fresh}. Учеников: {students.length}, групп:{" "}
        {groups.length}, родителей в кабинете: {countUsers()}. Неоплаченных счетов: {due.length}.
      </p>

      <nav className={s.tabs} aria-label="Разделы кабинета">
        {TABS.map((t) => (
          <a key={t.id} href={`/maximova/kabinet?tab=${t.id}`} className={t.id === tab ? s.tabOn : s.tab} aria-current={t.id === tab ? "page" : undefined}>
            {t.title}
            {t.id === "zayavki" && fresh ? ` · ${fresh}` : ""}
            {t.id === "oplata" && due.length ? ` · ${due.length}` : ""}
          </a>
        ))}
      </nav>

      {tab === "zayavki" ? (
        <section className={s.card} aria-label="Заявки на пробное">
          {bookings.length ? (
            <ul className={s.list}>
              {bookings.map((b) => (
                <li key={b.id} className={s.item}>
                  <p className={s.itemTitle}>
                    № {b.id} · {b.parentName} · <a href={contactHref(b.contact)}>{b.contact}</a>
                  </p>
                  <p>
                    {b.language}, {b.age}, {b.format.toLowerCase()}
                    {b.preferredTime ? ` · удобно: ${b.preferredTime}` : ""}
                  </p>
                  {b.comment ? <p className={s.hint}>«{b.comment}»</p> : null}
                  <p className={s.hint}>{DATE.format(new Date(b.createdAt))}</p>
                  <StatusToggle id={b.id} status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.lead}>Заявок пока нет.</p>
          )}
        </section>
      ) : null}

      {tab === "ucheniki" ? (
        <>
          <section className={s.card} aria-labelledby="k-add-student">
            <h2 id="k-add-student" className={s.h2}>
              Новый ученик
            </h2>
            <StudentForm groups={groups} />
          </section>
          <section className={s.card} aria-labelledby="k-students">
            <h2 id="k-students" className={s.h2}>
              Ученики
            </h2>
            {students.length ? (
              <ul className={s.list}>
                {students.map((st) => (
                  <StudentCard key={st.id} student={st} groups={groups} payments={paymentsOf(st.id, 5)} />
                ))}
              </ul>
            ) : (
              <p className={s.hint}>Учеников пока нет — добавьте первого после вступительного теста.</p>
            )}
          </section>
        </>
      ) : null}

      {tab === "gruppy" ? (
        <>
          <section className={s.card} aria-labelledby="k-add-group">
            <h2 id="k-add-group" className={s.h2}>
              Новая группа
            </h2>
            <GroupForm />
          </section>
          <section className={s.card} aria-labelledby="k-groups">
            <h2 id="k-groups" className={s.h2}>
              Группы
            </h2>
            {groups.length ? (
              <ul className={s.list}>
                {groups.map((g) => {
                  const members = students.filter((st) => st.groupId === g.id);
                  return (
                    <li key={g.id} className={s.item}>
                      <p className={s.itemTitle}>{g.title}</p>
                      <p>
                        {g.language}, {g.age}
                        {g.schedule ? ` · ${g.schedule}` : ""}
                      </p>
                      <p className={s.hint}>
                        {members.length ? `${members.length} из 7: ${members.map((m) => m.name).join(", ")}` : "Пока пусто"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={s.hint}>Групп пока нет.</p>
            )}
          </section>
        </>
      ) : null}

      {tab === "zadaniya" ? (
        <>
          <section className={s.card} aria-labelledby="k-add-hw">
            <h2 id="k-add-hw" className={s.h2}>
              Выдать задание
            </h2>
            {groups.length || students.length ? (
              <HomeworkForm groups={groups} students={students} />
            ) : (
              <p className={s.hint}>Сначала заведите группу или ученика.</p>
            )}
          </section>
          <section className={s.card} aria-labelledby="k-hw">
            <h2 id="k-hw" className={s.h2}>
              Последние задания
            </h2>
            {(() => {
              const list = recentHomework(20);
              return list.length ? (
                <ul className={s.list}>
                  {list.map((h) => (
                    <li key={h.id} className={s.item}>
                      <p className={s.itemTitle}>{h.target}</p>
                      <p className={s.pre}>{h.text}</p>
                      <p className={s.hint}>
                        {DAY.format(new Date(h.createdAt))}
                        {h.due ? ` · срок: ${h.due}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.hint}>Заданий пока нет.</p>
              );
            })()}
          </section>
        </>
      ) : null}

      {tab === "oplata" ? (
        <section className={s.card} aria-labelledby="k-due">
          <h2 id="k-due" className={s.h2}>
            Ждут оплаты
          </h2>
          {due.length ? (
            <ul className={s.list}>
              {due.map((p) => (
                <PaymentRow key={p.id} payment={p} label={p.studentName} />
              ))}
            </ul>
          ) : (
            <p className={s.hint}>Всё оплачено. Выставить оплату — в карточке ученика.</p>
          )}
        </section>
      ) : null}
    </>
  );
}

/** Контакт из заявки — сразу ссылкой: ник в Telegram или звонок. */
function contactHref(contact: string): string {
  const nick = /^@?([A-Za-z0-9_]{5,32})$/.exec(contact);
  if (nick) return `https://t.me/${nick[1]}`;
  const digits = contact.replace(/\D/g, "");
  const phone = digits.length === 11 && digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  return `tel:+${phone}`;
}
