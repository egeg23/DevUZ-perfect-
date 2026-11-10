/* Аудитория CZECHFARM: подписчики Telegram-бота, рассылки по ним и кабинеты
   партнёров и клиентов на сайте.
   - Подписчик — каждый, кто сам писал боту (не сотрудник). Сегмент — «партнёр»
     или «клиент»: выбирает сам кнопкой в боте или берётся из кабинета.
   - Рассылка — из панели или с телефона владельца (/рассылка в боте). Уходит
     порциями не быстрее 25 сообщений в секунду; 403 — человек заблокировал
     бота, больше ему не шлём.
   - Кабинет: регистрация на сайте; клиент — сразу, партнёр — после проверки
     в панели. В кабинете — свои обращения со статусом и новое обращение. */
import { hashPass, checkPass, token, sha } from "./crypt.mjs";

export const SEGMENTS = { all: "Всем", partner: "Партнёрам", client: "Клиентам" };
export const ACC_STATUS = { pending: "На проверке", active: "Активен", blocked: "Заблокирован" };
const ACC_KINDS = ["partner", "client"];
const SESSION_DAYS = 90;
const GAP_MS = 40; /* 25 в секунду — предел Telegram для рассылок */
const cut = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);

export function makeAudience({ db, note, tg, now, publicUrl = "", onLead = null }) {
  /* ── Подписчики ─────────────────────────────────────────────────── */
  const isStaff = (chat) => !!db.get("select 1 from tg_staff where chat_id = ?", chat);
  const subs = {
    touch(u) {
      if (isStaff(u.chat)) return;
      db.run(`insert into bot_users(chat, name, username, lang, first_at, last_at) values(?, ?, ?, ?, ?, ?)
        on conflict(chat) do update set name = excluded.name, username = excluded.username, lang = excluded.lang, last_at = excluded.last_at, blocked_at = null`,
      u.chat, cut(u.name, 120), cut(u.username, 60), cut(u.lang, 5), now(), now());
    },
    setKind(chat, kind) { if (ACC_KINDS.includes(kind)) db.run("update bot_users set kind = ? where chat = ?", kind, chat); },
    recipients(seg) {
      const rows = db.all("select b.chat, coalesce(a.kind, b.kind) kind from bot_users b left join accounts a on a.id = b.account_id where b.blocked_at is null and b.chat not in (select chat_id from tg_staff)");
      return rows.filter((r) => seg === "all" || r.kind === seg).map((r) => r.chat);
    },
    counts() {
      const all = db.get("select count(*) n from bot_users where chat not in (select chat_id from tg_staff)").n;
      const blocked = db.get("select count(*) n from bot_users where blocked_at is not null").n;
      const week = db.get("select count(*) n from bot_users where first_at > ?", now() - 7 * 864e5).n;
      return { all: subs.recipients("all").length, partner: subs.recipients("partner").length, client: subs.recipients("client").length, blocked, ever: all, week };
    },
  };

  /* ── Рассылки ───────────────────────────────────────────────────── */
  let busy = false;
  const photoRef = (p) => (p.startsWith("/uploads/") ? publicUrl + p : p);
  const bc = {
    create({ text, photo = "", seg = "all", via = "panel" }, by) {
      text = cut(text, photo ? 1024 : 4000);
      if (!text) throw new Error("Напишите текст рассылки");
      if (!SEGMENTS[seg]) throw new Error("Нет такого сегмента");
      if (photo && photo.startsWith("/uploads/") && !publicUrl.startsWith("https://")) throw new Error("Фото в рассылке работает, когда у сайта есть адрес https");
      const to = subs.recipients(seg);
      if (!to.length) throw new Error("В этом сегменте пока нет подписчиков бота");
      const id = db.tx(() => {
        const r = db.run("insert into broadcasts(at, by, text, photo, seg, via, total) values(?, ?, ?, ?, ?, ?, ?)", now(), by, text, cut(photo, 300), seg, via, to.length);
        const bid = Number(r.lastInsertRowid);
        for (const c of to) db.run("insert or ignore into broadcast_q(broadcast_id, chat) values(?, ?)", bid, c);
        return bid;
      });
      note(by, `Рассылка № ${id}: ${SEGMENTS[seg].toLowerCase()}, ${to.length} получателей`);
      return id;
    },
    list: () => db.all("select id, at, by, text, photo, seg, via, total, sent, failed, blocked, state, done_at from broadcasts order by id desc limit 50"),
    cancel(id, by) {
      const b = db.get("select state from broadcasts where id = ?", id);
      if (!b || b.state === "done") throw new Error("Рассылка уже закончилась");
      db.run("delete from broadcast_q where broadcast_id = ?", id);
      db.run("update broadcasts set state = 'canceled', done_at = ? where id = ?", now(), id);
      note(by, `Остановил рассылку № ${id}`);
    },
    /* Один проход: до limit сообщений. Зовёт сервер по таймеру и тест. */
    async tick(limit = 200, wait = (ms) => new Promise((r) => setTimeout(r, ms))) {
      if (busy) return 0;
      busy = true;
      let done = 0;
      try {
        while (done < limit) {
          const job = db.get("select q.broadcast_id id, q.chat, b.text, b.photo from broadcast_q q join broadcasts b on b.id = q.broadcast_id order by q.broadcast_id, q.chat limit 1");
          if (!job) break;
          db.run("update broadcasts set state = 'sending' where id = ? and state = 'queued'", job.id);
          let field = "sent";
          try {
            if (job.photo) await tg().photo(job.chat, photoRef(job.photo), job.text);
            else await tg().send(job.chat, job.text);
          } catch (e) {
            if (/blocked|deactivated|403|chat not found/i.test(e.message)) { field = "blocked"; db.run("update bot_users set blocked_at = ? where chat = ?", now(), job.chat); }
            else field = "failed";
          }
          db.run(`update broadcasts set ${field} = ${field} + 1 where id = ?`, job.id);
          db.run("delete from broadcast_q where broadcast_id = ? and chat = ?", job.id, job.chat);
          if (!db.get("select 1 from broadcast_q where broadcast_id = ?", job.id)) db.run("update broadcasts set state = 'done', done_at = ? where id = ?", now(), job.id);
          done++;
          if (wait) await wait(GAP_MS);
        }
      } finally { busy = false; }
      return done;
    },
    pending: () => !!db.get("select 1 from broadcast_q limit 1"),
  };

  /* ── Кабинеты партнёров и клиентов ──────────────────────────────── */
  const view = (a) => a && { id: a.id, kind: a.kind, name: a.name, org: a.org, email: a.email, phone: a.phone, country: a.country, lang: a.lang, status: a.status, statusName: ACC_STATUS[a.status], created_at: a.created_at, approved_by: a.approved_by, tg: !!a.tg_chat };
  const acc = {
    register(b) {
      const kind = ACC_KINDS.includes(b.kind) ? b.kind : "";
      if (!kind) throw new Error("Выберите: партнёр или клиент");
      const name = cut(b.name, 120), email = cut(b.email, 160).toLowerCase(), pass = String(b.pass || "");
      if (!name) throw new Error("Напишите, как к вам обращаться");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Проверьте почту");
      if (pass.length < 8) throw new Error("Пароль не короче 8 знаков");
      if (kind === "partner" && !cut(b.org, 160)) throw new Error("Партнёру нужно название компании");
      if (db.get("select 1 from accounts where email = ?", email)) throw new Error("С этой почтой уже есть кабинет: войдите");
      const status = kind === "partner" ? "pending" : "active";
      const id = Number(db.run("insert into accounts(kind, name, org, email, phone, country, lang, pass, status, created_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        kind, name, cut(b.org, 160), email, cut(b.phone, 40), cut(b.country, 80), ["ru", "uz", "en", "ar"].includes(b.lang) ? b.lang : "ru", hashPass(pass), status, now()).lastInsertRowid);
      note("сайт", `Регистрация: ${kind === "partner" ? "партнёр" : "клиент"} ${name}${b.org ? ", " + cut(b.org, 160) : ""}${status === "pending" ? " — ждёт проверки" : ""}`);
      if (onLead && status === "pending") onLead({ kind: "partner", name, org: cut(b.org, 160), email, phone: cut(b.phone, 40), country: cut(b.country, 80), msg: "Регистрация партнёра на сайте: проверьте и одобрите в «Партнёры и клиенты»", lang: b.lang, page: "account", accountId: id }).catch(() => {});
      return acc.login(email, pass);
    },
    login(email, pass) {
      const a = db.get("select * from accounts where email = ?", cut(email, 160).toLowerCase());
      if (!a || !checkPass(pass, a.pass)) return null;
      if (a.status === "blocked") throw new Error("Кабинет заблокирован: напишите в компанию");
      const sid = token(32);
      db.run("insert into account_sessions(id, account_id, created_at, last_at) values(?, ?, ?, ?)", sha(sid), a.id, now(), now());
      return sid;
    },
    of(sid) {
      if (!sid) return null;
      const s = db.get("select * from account_sessions where id = ?", sha(sid));
      if (!s || now() - s.last_at > SESSION_DAYS * 864e5) return null;
      const a = db.get("select * from accounts where id = ? and status != 'blocked'", s.account_id);
      if (!a) return null;
      if (now() - s.last_at > 6e4) db.run("update account_sessions set last_at = ? where id = ?", now(), s.id);
      return a;
    },
    logout: (sid) => sid && db.run("delete from account_sessions where id = ?", sha(sid)),
    me(a) {
      const rows = db.all("select no, at, kind, status, msg from leads where account_id = ? or (account_id is null and email != '' and lower(email) = ?) order by id desc limit 30", a.id, a.email);
      return { ...view(a), leads: rows.map((l) => ({ no: l.no, at: l.at, kind: l.kind, status: l.status === "spam" ? "done" : l.status, msg: l.msg.slice(0, 300) })) };
    },
    tgLink(a, bot) {
      if (!bot) throw new Error("Бот компании ещё не подключён");
      const code = "acc" + token(9);
      db.run("delete from acc_codes where until < ?", now());
      db.run("insert into acc_codes(code, account_id, until) values(?, ?, ?)", code, a.id, now() + 15 * 6e4);
      return `https://t.me/${bot}?start=${code}`;
    },
    /* /start acc… в боте: Telegram клиента привязан к кабинету. */
    linkChat(code, chat) {
      const c = db.get("select * from acc_codes where code = ? and until > ?", code, now());
      if (!c) return null;
      db.run("delete from acc_codes where code = ?", code);
      db.run("update accounts set tg_chat = ? where id = ?", chat, c.account_id);
      db.run("update bot_users set account_id = ? where chat = ?", c.account_id, chat);
      return db.get("select * from accounts where id = ?", c.account_id);
    },
    list: () => db.all("select * from accounts order by id desc limit 500").map(view),
    setStatus(id, status, by) {
      const a = db.get("select * from accounts where id = ?", id);
      if (!a) throw new Error("Нет такого кабинета");
      if (!ACC_STATUS[status]) throw new Error("Нет такого статуса");
      db.run("update accounts set status = ?, approved_by = ? where id = ?", status, status === "active" ? by : a.approved_by, id);
      if (status === "blocked") db.run("delete from account_sessions where account_id = ?", id);
      note(by, `Кабинет ${a.name} (${a.email}): «${ACC_STATUS[status]}»`);
      if (a.tg_chat && status === "active" && a.status === "pending") tg().send(a.tg_chat, "CZECHFARM: ваш кабинет партнёра одобрен. Добро пожаловать!").catch(() => {});
    },
  };

  return { subs, bc, acc };
}
