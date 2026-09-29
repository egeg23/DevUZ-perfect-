import type { Viewer } from "@/lib/clients/maximova/store";
import { bookingsOf, countUsers, listBookings } from "@/lib/clients/maximova/store";
import { DIARY, TEACHER } from "@/content/clients/maximova/facts";

import { Credit } from "../Credit";
import { Logout, StatusToggle } from "./Actions";
import { Login } from "./Login";
import s from "./kabinet.module.css";

const DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

/**
 * Личный кабинет.
 *
 * Родитель видит свои заявки и то, что появится после вступительного теста.
 * Дарья видит все заявки и отмечает, с кем связалась. Оценки, задания и
 * замечания — следующий шаг (docs/clients/maximova/plan.md): страница прямо
 * говорит, что их пока нет, а не рисует пустые графики.
 */
export function Cabinet({ viewer, botReady, botUsername }: { viewer: Viewer | null; botReady: boolean; botUsername: string }) {
  return (
    <div className={s.page}>
      <header className={s.bar}>
        <a href="/maximova" className={s.brand}>
          ← {TEACHER.name}
        </a>
        {viewer ? <Logout /> : null}
      </header>
      <main className={s.main}>
        {!viewer ? (
          <>
            <h1 className={s.title}>Личный кабинет</h1>
            <p className={s.lead}>
              Здесь — ваши заявки, а после вступительного теста — задания на дом, замечания и напоминания об оплате.
              Регистрация — это первый вход через Telegram, пароль не нужен.
            </p>
            <Login ready={botReady} />
          </>
        ) : viewer.role === "admin" ? (
          <Admin viewer={viewer} />
        ) : (
          <Parent viewer={viewer} botUsername={botUsername} />
        )}
      </main>
      <footer className={s.footer}>
        <a href="/maximova/privacy">Политика обработки персональных данных</a>
        <Credit />
      </footer>
    </div>
  );
}

function Parent({ viewer, botUsername }: { viewer: Viewer; botUsername: string }) {
  const bookings = bookingsOf(viewer.telegramId);
  return (
    <>
      <h1 className={s.title}>Здравствуйте, {viewer.firstName || "родитель"}!</h1>
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
            Заявок пока нет. <a href="/maximova#zapis">Записаться на пробное −30%</a>
          </p>
        )}
      </section>
      <section className={s.card} aria-labelledby="k-diary">
        <h2 id="k-diary" className={s.h2}>
          {DIARY.title}
        </h2>
        <p className={s.lead}>
          После вступительного теста здесь появятся уровень ребёнка и группа, а в моём Telegram-боте
          {botUsername ? (
            <>
              {" "}
              <a href={`https://t.me/${botUsername}`}>@{botUsername}</a>
            </>
          ) : null}{" "}
          — задания на дом, замечания по поведению и напоминания об оплате.
        </p>
      </section>
    </>
  );
}

function Admin({ viewer }: { viewer: Viewer }) {
  const bookings = listBookings(100);
  const fresh = bookings.filter((b) => b.status === "new").length;
  return (
    <>
      <h1 className={s.title}>Кабинет преподавателя</h1>
      <p className={s.lead}>
        {viewer.firstName ? `${viewer.firstName}, з` : "З"}аявок: {bookings.length}, новых: {fresh}. Родителей в кабинете:{" "}
        {countUsers()}.
      </p>
      <section className={s.card} aria-labelledby="k-all">
        <h2 id="k-all" className={s.h2}>
          Заявки на пробное
        </h2>
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
