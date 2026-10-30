/* Ядро сайта клиники: заявки, переписка из всех каналов в одном окне,
   сотрудники, подключения. Сеть (amoCRM, Telegram, Wazzup) — через
   клиентов из amo.mjs, tg.mjs, wazzup.mjs; fetch подменяется в тестах. */
import { sealer, hashPass, checkPass, token, sha } from "./crypt.mjs";
import { amoClient, amoBase } from "./amo.mjs";
import { tgClient, tgMessage } from "./tg.mjs";
import { wzClient, wzMessages, WZ_KINDS } from "./wazzup.mjs";

export const STATUS = { new: "Новая", confirmed: "Подтверждена", came: "Пришёл", canceled: "Отменена" };
export const ROLES = { owner: "Главный врач", admin: "Администратор" };
export const KIND = { site: "Сайт", tg: "Telegram-бот", ...WZ_KINDS };
const SECRET_KEYS = new Set(["amo.token", "tg.token", "wz.key"]);
const SESSION_DAYS = 90;

export const cleanPhone = (s) => {
  const d = String(s || "").replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "8" || d[0] === "7")) return "+7" + d.slice(1);
  if (d.length === 10 && d[0] === "9") return "+7" + d;
  return d.length >= 10 && d.length <= 15 ? "+" + d : "";
};
const cut = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);

export function makeCore({ db, secret, publicUrl = "", fetchImpl = fetch, now = () => Date.now() }) {
  const box = sealer(secret);

  /* ── Настройки и журнал ─────────────────────────────────────────── */
  const getS = (k) => { const r = db.get("select v from settings where k = ?", k); if (!r) return ""; return SECRET_KEYS.has(k) ? box.open(r.v) : r.v; };
  const setS = (k, v) => { if (v === "" || v == null) db.run("delete from settings where k = ?", k); else db.run("insert into settings(k, v) values(?, ?) on conflict(k) do update set v = excluded.v", k, SECRET_KEYS.has(k) ? box.seal(v) : String(v)); };
  const note = (who, t) => db.run("insert into log(at, who, t) values(?, ?, ?)", now(), who || "система", cut(t, 500));

  /* ── Сотрудники и вход ──────────────────────────────────────────── */
  const users = {
    count: () => db.get("select count(*) n from users").n,
    list: () => db.all("select id, login, name, role, disabled, created_at from users order by id"),
    add({ login, name, role, pass }, by) {
      login = cut(login, 40).toLowerCase(); name = cut(name, 80);
      if (!/^[a-z0-9._-]{3,40}$/.test(login)) throw new Error("Логин: от 3 знаков, латиница, цифры, точка или дефис");
      if (!name) throw new Error("Укажите имя");
      if (!ROLES[role]) throw new Error("Нет такой роли");
      if (String(pass || "").length < 8) throw new Error("Пароль не короче 8 знаков");
      if (db.get("select 1 from users where login = ?", login)) throw new Error("Такой логин уже есть");
      const r = db.run("insert into users(login, name, role, pass, created_at) values(?, ?, ?, ?, ?)", login, name, role, hashPass(pass), now());
      note(by, `Добавил сотрудника ${name} (${ROLES[role]})`);
      return Number(r.lastInsertRowid);
    },
    setPass(id, pass, by) {
      if (String(pass || "").length < 8) throw new Error("Пароль не короче 8 знаков");
      db.run("update users set pass = ? where id = ?", hashPass(pass), id);
      db.run("delete from sessions where user_id = ?", id);
      note(by, "Сменил пароль");
    },
    disable(id, by) {
      const u = db.get("select * from users where id = ?", id);
      if (!u) throw new Error("Нет такого сотрудника");
      if (u.role === "owner" && db.get("select count(*) n from users where role = 'owner' and disabled = 0").n <= 1) throw new Error("Нельзя отключить последнего главного врача");
      db.run("update users set disabled = 1 where id = ?", id);
      db.run("delete from sessions where user_id = ?", id);
      db.run("delete from tg_staff where user_id = ?", id);
      note(by, `Отключил сотрудника ${u.name}`);
    },
  };

  const findUser = (login, pass) => { const u = db.get("select * from users where login = ? and disabled = 0", cut(login, 40).toLowerCase()); return u && checkPass(pass, u.pass) ? u : null; };
  const auth = {
    check: (login, pass) => !!findUser(login, pass),
    login(login, pass) {
      const u = findUser(login, pass);
      if (!u) return null;
      const sid = token(32);
      db.run("insert into sessions(id, user_id, created_at, last_at) values(?, ?, ?, ?)", sha(sid), u.id, now(), now());
      note(u.name, "Вошёл в админку");
      return sid;
    },
    user(sid) {
      if (!sid) return null;
      const s = db.get("select * from sessions where id = ?", sha(sid));
      if (!s || now() - s.last_at > SESSION_DAYS * 864e5) return null;
      const u = db.get("select id, login, name, role from users where id = ? and disabled = 0", s.user_id);
      if (!u) return null;
      if (now() - s.last_at > 6e4) db.run("update sessions set last_at = ? where id = ?", now(), s.id);
      return u;
    },
    logout: (sid) => sid && db.run("delete from sessions where id = ?", sha(sid)),
  };

  /* ── Подключения ────────────────────────────────────────────────── */
  const amo = () => amoClient({ domain: getS("amo.domain"), token: getS("amo.token") }, fetchImpl);
  const tg = () => tgClient(getS("tg.token"), fetchImpl);
  const wz = () => wzClient(getS("wz.key"), fetchImpl);

  function settingsView() {
    let wzCh = []; try { wzCh = JSON.parse(getS("wz.channels") || "[]"); } catch { /* пусто */ }
    return {
      amo: { on: !!(getS("amo.domain") && getS("amo.token")), domain: getS("amo.domain"), base: amoBase(getS("amo.domain")), account: getS("amo.account"), pipeline: getS("amo.pipeline"), status: getS("amo.status"), auto: getS("amo.auto") === "1", hasToken: !!getS("amo.token") },
      tg: { on: !!getS("tg.token"), bot: getS("tg.bot"), staff: db.all("select t.chat_id, u.name from tg_staff t join users u on u.id = t.user_id").map((r) => r.name) },
      wz: { on: !!getS("wz.key"), channels: wzCh },
      publicUrl,
    };
  }

  const connect = {
    async amo({ domain, token: tk }, by) {
      if (!amoBase(domain)) throw new Error("Поддомен amoCRM: например, siyanie или siyanie.amocrm.ru");
      const keep = tk || getS("amo.token");
      if (!keep) throw new Error("Вставьте долгосрочный токен");
      const c = amoClient({ domain, token: keep }, fetchImpl);
      const acc = await c.account();
      const pipes = await c.pipelines();
      setS("amo.domain", domain); setS("amo.token", keep); setS("amo.account", acc?.name || "");
      if (!getS("amo.pipeline")) { const main = pipes.find((p) => p.main) || pipes[0]; if (main) { setS("amo.pipeline", main.id); setS("amo.status", main.statuses[0]?.id || ""); } }
      if (getS("amo.auto") === "") setS("amo.auto", "1");
      note(by, `Подключил amoCRM (${acc?.name || domain})`);
      return { account: acc?.name || "", pipelines: pipes };
    },
    amoPipelines: () => amo().pipelines(),
    amoOptions({ pipeline, status, auto }, by) { setS("amo.pipeline", pipeline || ""); setS("amo.status", status || ""); setS("amo.auto", auto ? "1" : "0"); note(by, "Поменял настройки amoCRM"); },
    async tg({ token: tk }, by) {
      if (!/^\d+:[\w-]{30,}$/.test(String(tk || "").trim())) throw new Error("Токен бота выглядит так: 123456:ABC… (его даёт @BotFather)");
      const c = tgClient(String(tk).trim(), fetchImpl), me = await c.me();
      const hook = token(24);
      if (publicUrl) await c.setHook(`${publicUrl}/api/tg/hook`, hook);
      setS("tg.token", String(tk).trim()); setS("tg.bot", me.username || ""); setS("tg.secret", hook);
      note(by, `Подключил Telegram-бота @${me.username}`);
      return { bot: me.username };
    },
    async wz({ key }, by) {
      key = String(key || "").trim();
      if (key.length < 16) throw new Error("Вставьте ключ API из Wazzup → «Интеграции» → «API»");
      const c = wzClient(key, fetchImpl), ch = await c.channels();
      const hook = token(24);
      if (publicUrl) await c.setHook(`${publicUrl}/api/wazzup/${hook}`);
      setS("wz.key", key); setS("wz.secret", hook); setS("wz.channels", JSON.stringify(ch));
      note(by, `Подключил Wazzup: ${ch.length} каналов`);
      return { channels: ch };
    },
    async off(name, by) {
      if (name === "amo") ["amo.domain", "amo.token", "amo.account", "amo.pipeline", "amo.status", "amo.auto"].forEach((k) => setS(k, ""));
      else if (name === "tg") { try { await tg().dropHook(); } catch { /* токен мог уже не работать */ } ["tg.token", "tg.bot", "tg.secret"].forEach((k) => setS(k, "")); db.run("delete from tg_staff"); }
      else if (name === "wz") ["wz.key", "wz.secret", "wz.channels"].forEach((k) => setS(k, ""));
      else throw new Error("Нет такого подключения");
      note(by, `Отключил ${{ amo: "amoCRM", tg: "Telegram-бота", wz: "Wazzup" }[name]}`);
    },
    /* Ссылка «Привязать мой Telegram»: сотрудник жмёт Start, бот его узнаёт. */
    tgLink(userId) {
      const bot = getS("tg.bot");
      if (!bot) throw new Error("Сначала подключите Telegram-бота");
      const code = token(9).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
      db.run("delete from tg_codes where until < ?", now());
      db.run("insert into tg_codes(code, user_id, until) values(?, ?, ?)", code, userId, now() + 10 * 6e4);
      return `https://t.me/${bot}?start=staff-${code}`;
    },
  };

  /* ── Уведомления сотрудникам в Telegram ─────────────────────────── */
  async function notifyStaff(text, link) {
    const chats = db.all("select chat_id from tg_staff");
    if (!chats.length || !getS("tg.token")) return;
    const c = tg();
    await Promise.all(chats.map(async ({ chat_id }) => {
      try {
        const m = await c.send(chat_id, text);
        db.run("insert or replace into notices(chat_id, message_id, conv_id, lead_id) values(?, ?, ?, ?)", chat_id, m.message_id, link.conv || null, link.lead || null);
      } catch { /* бот заблокирован сотрудником — без шума */ }
    }));
  }

  /* ── Заявки ─────────────────────────────────────────────────────── */
  const leads = {
    async add(input) {
      const src = ["booking", "quiz", "chat", "tg", "wz"].includes(input.src) ? input.src : "booking";
      const l = { key: token(12), at: now(), src, name: cut(input.name, 80), phone: cleanPhone(input.phone), what: cut(input.what, 300) || "Консультация All-on-6", wish: cut(input.wish, 80), conv_id: input.conv || null };
      if (!l.phone && !l.conv_id) throw new Error("Укажите телефон, чтобы администратор мог перезвонить");
      const r = db.run("insert into leads(key, at, src, name, phone, what, wish, conv_id) values(?, ?, ?, ?, ?, ?, ?, ?)", l.key, l.at, l.src, l.name, l.phone, l.what, l.wish, l.conv_id);
      const id = Number(r.lastInsertRowid);
      note("сайт", `Новая заявка №${id}: ${l.what}`);
      notifyStaff(`🦷 Новая заявка №${id}\n${l.name || "Без имени"} · ${l.phone || "без телефона"}\n${l.what}${l.wish ? "\nУдобно: " + l.wish : ""}\n\nОткрыть: ${publicUrl}/admin#zayavki/${id}`, { lead: id }).catch(() => {});
      if (getS("amo.auto") === "1" && getS("amo.token")) leads.toAmo(id, "сайт").catch(() => {});
      return { id, key: l.key };
    },
    list: (days = 60) => db.all("select * from leads where at > ? order by at desc limit 500", now() - days * 864e5),
    get: (id) => db.get("select * from leads where id = ?", id),
    statusFor(id, key) { const l = db.get("select status, key from leads where id = ?", id); return l && l.key === key ? l.status : null; },
    setStatus(id, st, by) {
      if (!STATUS[st]) throw new Error("Нет такого статуса");
      const l = leads.get(id); if (!l) throw new Error("Нет такой заявки");
      db.run("update leads set status = ? where id = ?", st, id);
      note(by, `Заявка №${id}: ${STATUS[st].toLowerCase()}`);
    },
    setNote(id, text, by) { db.run("update leads set note = ? where id = ?", cut(text, 1000), id); note(by, `Заметка к заявке №${id}`); },
    async toAmo(id, by) {
      const l = leads.get(id); if (!l) throw new Error("Нет такой заявки");
      if (l.amo_id) return l.amo_id;
      try {
        const deal = await amo().sendLead(l, { pipeline: getS("amo.pipeline"), status: getS("amo.status") });
        db.run("update leads set amo_id = ?, amo_at = ?, amo_err = '' where id = ?", deal, now(), id);
        note(by, `Заявка №${id} ушла в amoCRM, сделка ${deal}`);
        return deal;
      } catch (e) {
        db.run("update leads set amo_err = ? where id = ?", cut(e.message, 300), id);
        throw e;
      }
    },
  };

  /* ── Переписка: все каналы в одном окне ─────────────────────────── */
  function convFor(channel, kind, ext, extra = {}) {
    let c = db.get("select * from convs where channel = ? and ext = ?", channel, ext);
    if (!c) {
      const r = db.run("insert into convs(channel, kind, ext, wz_channel, name, phone, last_at, sid) values(?, ?, ?, ?, ?, ?, ?, ?)", channel, kind, ext, extra.wzChannel || "", cut(extra.name, 80), cut(extra.phone, 20), now(), extra.sid || "");
      c = db.get("select * from convs where id = ?", Number(r.lastInsertRowid));
    } else if ((extra.name && !c.name) || (extra.phone && !c.phone)) {
      db.run("update convs set name = coalesce(nullif(name, ''), ?), phone = coalesce(nullif(phone, ''), ?) where id = ?", cut(extra.name, 80), cut(extra.phone, 20), c.id);
    }
    return c;
  }

  function addMsg(conv, dir, text, who = "", ext = "", at = now()) {
    if (ext && db.get("select 1 from msgs where conv_id = ? and ext_id = ?", conv.id, ext)) return null;
    const r = db.run("insert into msgs(conv_id, at, dir, text, who, ext_id) values(?, ?, ?, ?, ?, ?)", conv.id, at, dir, cut(text, 4000), who, ext);
    db.run("update convs set last_at = ?, last_dir = ?, unread = case when ? = 'in' then unread + 1 else 0 end where id = ?", at, dir, dir, conv.id);
    return Number(r.lastInsertRowid);
  }

  async function inbound(conv, text, who, ext, at) {
    if (!addMsg(conv, "in", text, who, ext, at)) return;
    const label = KIND[conv.kind] || conv.kind;
    await notifyStaff(`💬 ${label} · ${conv.name || who || "Без имени"}\n${text}\n\nОтветьте на это сообщение, чтобы написать пациенту.`, { conv: conv.id });
  }

  const inbox = {
    list: () => db.all("select c.*, (select text from msgs m where m.conv_id = c.id order by id desc limit 1) last_text from convs c order by last_at desc limit 300"),
    get(id) {
      const c = db.get("select * from convs where id = ?", id); if (!c) return null;
      db.run("update convs set unread = 0 where id = ?", id);
      return { ...c, msgs: db.all("select id, at, dir, text, who from msgs where conv_id = ? order by id desc limit 300", id).reverse() };
    },
    waiting: () => db.get("select count(*) n from convs where last_dir = 'in' and last_at > ?", now() - 14 * 864e5).n,
    async reply(id, text, by) {
      text = cut(text, 4000);
      if (!text) throw new Error("Пустое сообщение");
      const c = db.get("select * from convs where id = ?", id); if (!c) throw new Error("Нет такого диалога");
      if (c.channel === "tg") await tg().send(c.ext, text);
      else if (c.channel === "wz") { const i = c.ext.indexOf(":"), j = c.ext.lastIndexOf("|"); await wz().send(c.wz_channel, c.ext.slice(0, i), c.ext.slice(i + 1, j > i ? j : undefined), text); }
      addMsg(c, "out", text, by);
      return true;
    },
    /* Заявка из переписки: имя и телефон уже известны. */
    async toLead(id, by) {
      const c = db.get("select * from convs where id = ?", id); if (!c) throw new Error("Нет такого диалога");
      const lastIn = db.get("select text from msgs where conv_id = ? and dir = 'in' order by id desc limit 1", id);
      const r = await leads.add({ src: c.channel === "site" ? "chat" : c.channel, name: c.name, phone: c.phone, what: `Из переписки (${KIND[c.kind] || c.kind}): ${cut(lastIn?.text, 200)}`, conv: c.id });
      note(by, `Завёл заявку №${r.id} из переписки`);
      return r.id;
    },
  };

  /* Чат на сайте: посетитель с ключом sid в браузере. */
  const siteChat = {
    async send(sid, text, name) {
      sid = cut(sid, 64); text = cut(text, 1000);
      if (!/^[\w-]{16,64}$/.test(sid) || !text) throw new Error("Пустое сообщение");
      const c = convFor("site", "site", "s:" + sha(sid).slice(0, 24), { name, sid: sha(sid) });
      await inbound(c, text, cut(name, 80) || "Посетитель сайта");
      return c.id;
    },
    poll(sid, after = 0) {
      const c = db.get("select id from convs where channel = 'site' and ext = ?", "s:" + sha(cut(sid, 64)).slice(0, 24));
      if (!c) return [];
      return db.all("select id, at, dir, text, who from msgs where conv_id = ? and id > ? order by id limit 100", c.id, Number(after) || 0);
    },
  };

  /* ── Вебхуки ────────────────────────────────────────────────────── */
  async function tgUpdate(update) {
    const m = tgMessage(update); if (!m) return;
    const staff = db.get("select s.user_id, u.name from tg_staff s join users u on u.id = s.user_id where s.chat_id = ?", m.chat);
    if (m.start && m.start.startsWith("staff-")) {
      const row = db.get("select * from tg_codes where code = ? and until > ?", m.start.slice(6), now());
      if (!row) { await tg().send(m.chat, "Ссылка устарела. Откройте «Подключения» в админке и нажмите «Привязать мой Telegram» ещё раз."); return; }
      db.run("delete from tg_codes where code = ?", row.code);
      db.run("insert or replace into tg_staff(chat_id, user_id, at) values(?, ?, ?)", m.chat, row.user_id, now());
      const u = db.get("select name from users where id = ?", row.user_id);
      note(u?.name, "Привязал Telegram к админке");
      await tg().send(m.chat, `Готово, ${u?.name || "коллега"}. Сюда будут приходить новые заявки и сообщения пациентов. Чтобы ответить пациенту, ответьте (Reply) на уведомление.`);
      return;
    }
    if (staff) {
      const n = m.replyTo ? db.get("select * from notices where chat_id = ? and message_id = ?", m.chat, m.replyTo) : null;
      if (n && n.conv_id && !m.text.startsWith("[")) {
        try { await inbox.reply(n.conv_id, m.text, staff.name); await tg().send(m.chat, "✓ Ушло пациенту", { reply_to_message_id: m.messageId }); }
        catch (e) { await tg().send(m.chat, `Не ушло: ${e.message}`); }
      } else await tg().send(m.chat, n && n.lead_id ? `Заявка №${n.lead_id}: откройте её в админке, ${publicUrl}/admin#zayavki/${n.lead_id}` : "Чтобы написать пациенту, ответьте (Reply) на уведомление о его сообщении.");
      return;
    }
    const c = convFor("tg", "tg", m.chat, { name: m.name + (m.username ? ` (@${m.username})` : "") });
    if (m.start !== null) { await tg().send(m.chat, "Здравствуйте! Это клиника «Сияние Севера». Напишите вопрос, администратор ответит здесь же."); return; }
    await inbound(c, m.text, m.name, "tg:" + m.messageId, m.at);
  }

  async function wzHook(body) {
    for (const m of wzMessages(body)) {
      const c = convFor("wz", m.kind, `${m.kind}:${m.chat}|${m.channel}`, { wzChannel: m.channel, name: m.name, phone: m.phone });
      if (m.out) addMsg(c, "out", m.text, "Wazzup", "wz:" + m.id, m.at);
      else await inbound(c, m.text, m.name, "wz:" + m.id, m.at);
    }
  }

  /* ── Сводка ─────────────────────────────────────────────────────── */
  function summary() {
    const t = now(), w = 7 * 864e5;
    const n = (a, b) => db.get("select count(*) n from leads where at > ? and at <= ?", a, b).n;
    return {
      week: n(t - w, t), prev: n(t - 2 * w, t - w),
      fresh: db.get("select count(*) n from leads where status = 'new'").n,
      came: db.get("select count(*) n from leads where status = 'came' and at > ?", t - 30 * 864e5).n,
      waiting: inbox.waiting(),
      amoUnsent: getS("amo.token") ? db.get("select count(*) n from leads where amo_id is null and status != 'canceled' and at > ?", t - 30 * 864e5).n : 0,
      bySrc: db.all("select src, count(*) n from leads where at > ? group by src", t - 30 * 864e5),
      byKind: db.all("select kind, count(*) n from convs where last_at > ? group by kind", t - 30 * 864e5),
      settings: settingsView(),
    };
  }

  return {
    users, auth, leads, inbox, siteChat, connect, settingsView, summary,
    tgUpdate, wzHook, getS, setS, note,
    log: (limit = 200) => db.all("select at, who, t from log order by id desc limit ?", limit),
    tgSecret: () => getS("tg.secret"), wzSecret: () => getS("wz.secret"),
  };
}
