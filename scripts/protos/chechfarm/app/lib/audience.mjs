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
/* Сегмент «g:<номер>» — своя группа рассылки (владелец DevUz, 23.11.2026: «надо
   группировать рассылки (аптеки одной сети к примеру, врачи по направлениям и тд)»). */
const GROUP_SEG = /^g:(\d{1,9})$/;
const GROUPS_MAX = 200, GROUP_NAME = 60;
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
      const g = GROUP_SEG.exec(seg);
      if (g) return grp.chats(Number(g[1]));
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
      if (!SEGMENTS[seg] && !(GROUP_SEG.test(seg) && grp.get(Number(seg.slice(2))))) throw new Error("Нет такой группы получателей");
      if (photo && photo.startsWith("/uploads/") && !publicUrl.startsWith("https://")) throw new Error("Фото в рассылке работает, когда у сайта есть адрес https");
      const to = subs.recipients(seg);
      if (!to.length) throw new Error(GROUP_SEG.test(seg) ? "В этой группе пока никого нет в боте" : "В этом сегменте пока нет подписчиков бота");
      const id = db.tx(() => {
        const r = db.run("insert into broadcasts(at, by, text, photo, seg, via, total) values(?, ?, ?, ?, ?, ?, ?)", now(), by, text, cut(photo, 300), seg, via, to.length);
        const bid = Number(r.lastInsertRowid);
        for (const c of to) db.run("insert or ignore into broadcast_q(broadcast_id, chat) values(?, ?)", bid, c);
        return bid;
      });
      note(by, `Рассылка № ${id}: ${segName(seg).toLowerCase()}, ${to.length} получателей`);
      return id;
    },
    list: () => db.all("select id, at, by, text, photo, seg, via, total, sent, failed, blocked, state, done_at from broadcasts order by id desc limit 50").map((r) => ({ ...r, segName: segName(r.seg) })),
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
      /* Только обращения, отправленные из этого кабинета: почту при регистрации никто не проверяет,
         и по ней чужой человек увидел бы чужие запросы. */
      const rows = db.all("select no, at, kind, status, msg from leads where account_id = ? order by id desc limit 30", a.id);
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

  /* ── Партнёры из таблицы (владелец DevUz, 23.11.2026: «добавлять партнеров
     через загрузку таблицы… эти партнеры уже активируются к рассылке через
     бота когда нажмут /старт в боте, их статус тоже показывай онлайн: в боте
     или нет они»). Партнёр находит себя в боте сам: личной ссылкой
     (/start p<код>), по нику Telegram из таблицы или по номеру телефона,
     которым поделился кнопкой. Привязался — в сегменте «Партнёрам». */
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const phoneKey = (s) => { const d = digits(s); return d.length >= 9 ? d.slice(-9) : ""; };
  const nick = (s) => (/(?:t\.me\/|@)?([A-Za-z][\w]{3,31})\b/.exec(String(s || "").trim()) || [])[1]?.toLowerCase() || "";
  const pl = {
    FIELDS: ["name", "org", "phone", "email", "country", "city", "tg", "group", "note"],
    /* Запасной разбор столбцов по заголовкам, если модель недоступна. */
    guess(headers) {
      const has = (h, re) => re.test(String(h).toLowerCase()) && !(re === RULES.org && /сеть|chain|network|tarmoq/.test(String(h).toLowerCase()));
      const RULES = { group: /групп|сеть|направлен|специальн|категор|сегмент|group|chain|network|specialt|guruh|tarmoq|yo.nalish/, tg: /telegram|телеграм|tg\b|ник|username/, email: /e-?mail|почт|pochta/, phone: /тел|phone|моб|номер|raqam|telefon/,
        org: /компан|организац|фирм|аптек|company|organi[sz]|kompaniya|tashkilot|юр/, country: /стран|country|davlat|mamlakat/,
        city: /город|регион|область|city|region|shahar|viloyat/, name: /фио|имя|контакт|name|ism|ф\.и\.о|представ/, note: /коммент|примеч|note|izoh|заметк/ };
      const map = {}, used = new Set();
      for (const f of pl.FIELDS) { const i = headers.findIndex((h, j) => !used.has(j) && has(h, RULES[f])); map[f] = i; if (i >= 0) used.add(i); }
      return map;
    },
    /* rows — строки таблицы, map — { поле: номер столбца }. */
    import(rows, map, by) {
      const at = (r, f) => (map[f] >= 0 ? cut(r[map[f]], f === "note" ? 500 : 160) : "");
      const have = db.all("select id, phone, email, tg from partner_list");
      const keysOf = (x) => [phoneKey(x.phone) && "p" + phoneKey(x.phone), x.email && "e" + x.email.toLowerCase(), nick(x.tg) && "t" + nick(x.tg)].filter(Boolean);
      const seen = new Map(have.flatMap((x) => keysOf(x).map((k) => [k, x.id])));
      /* Столбец «Группа» (сеть аптек, направление врача): значение — группа рассылки,
         несколько через запятую или «;». Повтор партнёра тоже встаёт в свою группу. */
      const groups = new Map(), inGroup = new Set();
      const toGroups = (pid, v) => { for (const nm of String(v || "").split(/[;,|]/).map(gname).filter(Boolean).slice(0, 5)) {
        const k = nm.toLowerCase(); if (!groups.has(k)) groups.set(k, grp.create(nm, by));
        if (db.run("insert or ignore into bc_group_members(group_id, ref) values(?, ?)", groups.get(k), "p:" + pid).changes) inGroup.add(pid);
      } };
      let added = 0, dup = 0, empty = 0;
      db.tx(() => { for (const r of rows.slice(0, 5000)) {
        const o = Object.fromEntries(pl.FIELDS.map((f) => [f, at(r, f)]));
        if (!o.name && !o.org) { empty++; continue; }
        if (!o.phone && !o.email && !o.tg) { empty++; continue; }
        const keys = keysOf(o), old = keys.map((k) => seen.get(k)).find(Boolean);
        if (old) { dup++; toGroups(old, o.group); continue; }
        const pid = Number(db.run("insert into partner_list(name, org, phone, email, country, city, tg, note, code, created_at, by) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          o.name, o.org, o.phone, o.email.toLowerCase(), o.country, o.city, o.tg, o.note, "p" + token(8).replace(/[^\w]/g, "x"), now(), by).lastInsertRowid);
        keys.forEach((k) => seen.set(k, pid));
        toGroups(pid, o.group);
        added++;
      } });
      note(by, `Загрузил партнёров таблицей: добавлено ${added}${dup ? `, уже были ${dup}` : ""}${empty ? `, без имени или контакта ${empty}` : ""}${groups.size ? `, по группам: ${groups.size}` : ""}`);
      return { added, dup, empty, groups: groups.size, grouped: inGroup.size };
    },
    list(bot) {
      const gs = grp.ofPartners();
      return db.all(`select p.*, b.blocked_at, b.last_at from partner_list p left join bot_users b on b.chat = p.chat and p.chat != '' order by p.id desc limit 5000`).map((p) => ({
        id: p.id, name: p.name, org: p.org, phone: p.phone, email: p.email, country: p.country, city: p.city, tg: p.tg, note: p.note,
        state: !p.chat ? "out" : p.blocked_at ? "blocked" : "in", joined_at: p.joined_at, last_at: p.last_at || null,
        link: bot ? `https://t.me/${bot}?start=${p.code}` : "", groups: gs[p.id] || [],
      }));
    },
    remove(id, by) { const p = db.get("select name, org from partner_list where id = ?", id); db.run("delete from partner_list where id = ?", id); db.run("delete from bc_group_members where ref = ?", "p:" + id); note(by, `Убрал партнёра из списка: ${p?.name || p?.org || id}`); },
    join(p, chat) {
      db.run("update partner_list set chat = ?, joined_at = coalesce(joined_at, ?) where id = ?", chat, now(), p.id);
      db.run("update bot_users set kind = 'partner' where chat = ?", chat);
      note("бот", `Партнёр в боте: ${p.name || p.org}`);
      return p;
    },
    /* Кто это в боте: код из ссылки, ник, номер. Уже привязанный — сам по себе. */
    find({ chat, code, username, phone }) {
      const mine = db.get("select * from partner_list where chat = ?", chat);
      if (mine) return { p: mine, fresh: false };
      let p = null;
      if (code) p = db.get("select * from partner_list where code = ? and chat = ''", code);
      if (!p && username) p = db.all("select * from partner_list where chat = '' and tg != ''").find((x) => nick(x.tg) === String(username).toLowerCase()) || null;
      if (!p && phoneKey(phone)) p = db.all("select * from partner_list where chat = '' and phone != ''").find((x) => phoneKey(x.phone) === phoneKey(phone)) || null;
      return p ? { p: pl.join(p, chat), fresh: true } : null;
    },
  };

  /* ── Группы рассылки ─────────────────────────────────────────────
     Участник — подписчик бота (c:<чат>) или партнёр из таблицы (p:<номер>):
     партнёр получает рассылку группы, когда сам пришёл в бота. */
  const gname = (s) => cut(s, GROUP_NAME).replace(/\s+/g, " ");
  const grp = {
    get: (id) => db.get("select * from bc_groups where id = ?", id) || null,
    /* Без учёта регистра: lower() в SQLite кириллицу не понимает. */
    byName: (name) => { const k = gname(name).toLowerCase(); return db.all("select id, name from bc_groups").find((g) => g.name.toLowerCase() === k) || null; },
    /* Чаты для рассылки: живые подписчики группы и пришедшие в бота партнёры, без сотрудников. */
    chats(id) {
      return db.all(`select b.chat from bc_group_members m join bot_users b on m.ref = 'c:' || b.chat where m.group_id = ? and b.blocked_at is null
        union select p.chat from bc_group_members m join partner_list p on m.ref = 'p:' || p.id left join bot_users b on b.chat = p.chat
        where m.group_id = ? and p.chat != '' and b.blocked_at is null`, id, id).map((r) => r.chat).filter((c) => !isStaff(c));
    },
    list() {
      return db.all("select g.id, g.name, g.created_at, g.by, (select count(*) from bc_group_members m where m.group_id = g.id) total from bc_groups g order by g.name collate nocase")
        .map((g) => ({ ...g, inBot: grp.chats(g.id).length }));
    },
    create(name, by) {
      name = gname(name);
      if (!name) throw new Error("Напишите название группы");
      const same = grp.byName(name);
      if (same) return same.id;
      if (db.get("select count(*) n from bc_groups").n >= GROUPS_MAX) throw new Error(`Групп уже ${GROUPS_MAX}, уберите ненужные`);
      const id = Number(db.run("insert into bc_groups(name, created_at, by) values(?, ?, ?)", name, now(), by).lastInsertRowid);
      note(by, `Завёл группу рассылки «${name}»`);
      return id;
    },
    rename(id, name, by) {
      const g = grp.get(id); name = gname(name);
      if (!g) throw new Error("Нет такой группы");
      if (!name) throw new Error("Напишите название группы");
      const same = grp.byName(name); if (same && same.id !== id) throw new Error("Группа с таким названием уже есть");
      db.run("update bc_groups set name = ? where id = ?", name, id); note(by, `Группа «${g.name}» теперь «${name}»`);
    },
    remove(id, by) {
      const g = grp.get(id); if (!g) return;
      db.tx(() => { db.run("delete from bc_group_members where group_id = ?", id); db.run("delete from bc_groups where id = ?", id); });
      note(by, `Убрал группу рассылки «${g.name}»`);
    },
    /* Кто в группе: имя, кто это и есть ли в боте. */
    members(id) {
      const subs_ = db.all("select m.ref, b.name, b.username, b.kind, b.blocked_at from bc_group_members m join bot_users b on m.ref = 'c:' || b.chat where m.group_id = ?", id)
        .map((r) => ({ ref: r.ref, name: r.name || (r.username ? "@" + r.username : "подписчик бота"), sub: [r.username && "@" + r.username, r.kind === "partner" ? "партнёр" : r.kind === "client" ? "клиент" : ""].filter(Boolean).join(" · "), state: r.blocked_at ? "blocked" : "in" }));
      const parts = db.all("select m.ref, p.name, p.org, p.phone, p.city, p.chat, b.blocked_at from bc_group_members m join partner_list p on m.ref = 'p:' || p.id left join bot_users b on b.chat = p.chat and p.chat != '' where m.group_id = ?", id)
        .map((r) => ({ ref: r.ref, name: r.name || r.org, sub: [r.name && r.org, r.city, r.phone].filter(Boolean).join(" · "), state: !r.chat ? "out" : r.blocked_at ? "blocked" : "in" }));
      return [...parts, ...subs_].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    },
    add(id, refs, by) {
      const g = grp.get(id); if (!g) throw new Error("Нет такой группы");
      let n = 0;
      db.tx(() => { for (const r of (Array.isArray(refs) ? refs : []).slice(0, 5000)) {
        const m = /^(c|p):([\w-]{1,40})$/.exec(String(r)); if (!m) continue;
        const ok = m[1] === "c" ? db.get("select 1 from bot_users where chat = ?", m[2]) : db.get("select 1 from partner_list where id = ?", Number(m[2]) || 0);
        if (ok && db.run("insert or ignore into bc_group_members(group_id, ref) values(?, ?)", id, r).changes) n++;
      } });
      if (n && by) note(by, `Добавил в группу «${g.name}»: ${n}`);
      return n;
    },
    drop(id, ref, by) {
      const g = grp.get(id); if (!g) return;
      if (db.run("delete from bc_group_members where group_id = ? and ref = ?", id, String(ref)).changes) note(by, `Убрал из группы «${g.name}» одного участника`);
    },
    /* Кого можно добавить: партнёры из таблицы и подписчики бота по имени, компании, городу, телефону, нику. */
    find(q, id) {
      q = cut(q, 60).toLowerCase(); if (q.length < 2) return [];
      /* Поиск в JS: LIKE и lower() в SQLite кириллицу без учёта регистра не находят. */
      const hit = (...xs) => xs.join(" ").toLowerCase().includes(q), have = new Set(id ? db.all("select ref from bc_group_members where group_id = ?", id).map((r) => r.ref) : []);
      const parts = db.all("select id, name, org, city, phone, tg, note, chat from partner_list").filter((p) => hit(p.name, p.org, p.city, p.phone, p.tg, p.note)).slice(0, 30)
        .map((p) => ({ ref: "p:" + p.id, name: p.name || p.org, sub: ["из таблицы", p.name && p.org, p.city, p.phone].filter(Boolean).join(" · "), state: p.chat ? "in" : "out" }));
      const subs_ = db.all("select chat, name, username from bot_users where blocked_at is null and chat not in (select chat_id from tg_staff)").filter((b) => hit(b.name, b.username, "@" + b.username)).slice(0, 30)
        .map((b) => ({ ref: "c:" + b.chat, name: b.name || "@" + b.username, sub: ["подписчик бота", b.username && "@" + b.username].filter(Boolean).join(" · "), state: "in" }));
      return [...parts, ...subs_].filter((x) => !have.has(x.ref)).slice(0, 40);
    },
    /* Группы партнёров из таблицы: { номер партнёра: [названия] }. */
    ofPartners() {
      const out = {};
      for (const r of db.all("select m.ref, g.name from bc_group_members m join bc_groups g on g.id = m.group_id where m.ref like 'p:%' order by g.name collate nocase")) (out[r.ref.slice(2)] ||= []).push(r.name);
      return out;
    },
  };
  function segName(seg) {
    const g = GROUP_SEG.exec(seg);
    if (!g) return SEGMENTS[seg] || seg;
    const x = grp.get(Number(g[1]));
    return x ? "Группа «" + x.name + "»" : "Группа (убрана)";
  }

  return { subs, bc, acc, pl, grp, segName };
}
