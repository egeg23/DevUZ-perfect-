/* Ядро сайта CZECHFARM: обращения со статусами, продукты и новости,
   заголовки страниц, контакты, комната инвестора, команда и подключения
   (Telegram, amoCRM, Bitrix24). Сеть — через tg.mjs и crm.mjs; fetch
   подменяется в тестах. Модели нет: бот отвечает текстами из панели. */
import { randomBytes } from "node:crypto";
import { sealer, hashPass, checkPass, token, sha } from "./crypt.mjs";
import { tgClient, tgUpdate, faqMatch } from "./tg.mjs";
import { crmClient, amoBase, b24Base, KIND_NAME, leadText } from "./crm.mjs";

export const STATUS = { new: "Новое", work: "В работе", meet: "Назначена встреча", done: "Ответ отправлен", spam: "Спам" };
export const ROLES = { owner: "Владелец", head: "Руководитель", manager: "Менеджер" };
export const KINDS = KIND_NAME;
export const LANGS = ["ru", "uz", "en", "ar"];
/* Страницы сайта, у которых заголовок и описание правятся в панели. */
export const PAGES = ["home", "about", "products", "partners", "investors", "news", "contacts", "privacy"];
export const PRODUCT_KEYS = ["name", "inn", "form", "maker", "dir", "rx", "doc", "img", "about"];
export const CONTACT_KEYS = ["phone", "email", "address", "social", "map"];
const SECRET_KEYS = new Set(["tg.token", "amo.token", "b24.hook"]);
const SESSION_DAYS = 90;

const cut = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);
const json = (s, def) => { try { return JSON.parse(s); } catch { return def; } };
/* Номер обращения: CF- и шесть знаков без похожих букв. */
const NO_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const leadNo = () => "CF-" + [...randomBytes(6)].map((b) => NO_ABC[b % NO_ABC.length]).join("");

export function makeCore({ db, secret, publicUrl = "", fetchImpl = fetch, now = () => Date.now() }) {
  const box = sealer(secret);
  let version = 1; /* растёт при каждой правке того, что видно на сайте */
  const changed = () => { version++; };

  /* ── Настройки и журнал ─────────────────────────────────────────── */
  const getS = (k) => { const r = db.get("select v from settings where k = ?", k); if (!r) return ""; return SECRET_KEYS.has(k) ? box.open(r.v) : r.v; };
  const setS = (k, v) => { if (v === "" || v == null) db.run("delete from settings where k = ?", k); else db.run("insert into settings(k, v) values(?, ?) on conflict(k) do update set v = excluded.v", k, SECRET_KEYS.has(k) ? box.seal(v) : String(v)); };
  const note = (who, t, leadId = null) => db.run("insert into log(at, who, t, lead_id) values(?, ?, ?, ?)", now(), who || "система", cut(t, 500), leadId);

  /* ── Сотрудники и вход ──────────────────────────────────────────── */
  const users = {
    count: () => db.get("select count(*) n from users").n,
    list: () => db.all("select u.id, u.login, u.name, u.role, u.disabled, u.kinds, u.created_at, (select count(*) from tg_staff t where t.user_id = u.id) tg from users u order by u.id"),
    get: (id) => db.get("select id, login, name, role, disabled, kinds from users where id = ?", id),
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
    setRole(id, role, by) {
      const u = users.get(id); if (!u) throw new Error("Нет такого сотрудника");
      if (!ROLES[role]) throw new Error("Нет такой роли");
      if (u.role === "owner" && role !== "owner" && db.get("select count(*) n from users where role = 'owner' and disabled = 0").n <= 1) throw new Error("Нельзя снять последнего владельца");
      db.run("update users set role = ? where id = ?", role, id);
      note(by, `${u.name}: роль «${ROLES[role]}»`);
    },
    /* Какие темы обращений сотрудник получает в Telegram: пусто — все. */
    setKinds(id, kinds, by) {
      const list = (Array.isArray(kinds) ? kinds : []).filter((k) => KINDS[k]);
      db.run("update users set kinds = ? where id = ?", list.join(","), id);
      note(by, `${users.get(id)?.name}: темы в Telegram — ${list.length ? list.map((k) => KINDS[k]).join(", ") : "все"}`);
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
      if (u.role === "owner" && db.get("select count(*) n from users where role = 'owner' and disabled = 0").n <= 1) throw new Error("Нельзя отключить последнего владельца");
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
      note(u.name, "Вошёл в панель");
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

  /* Менеджер не видит запросы инвесторов и комнату инвестора (как в макете). */
  const seesKind = (user, kind) => user.role !== "manager" || kind !== "investor";

  /* ── Подключения ────────────────────────────────────────────────── */
  const tg = () => tgClient(getS("tg.token"), fetchImpl);
  const crmCfg = () => {
    const kind = getS("crm.kind");
    if (kind === "amo") return { kind, domain: getS("amo.domain"), token: getS("amo.token") };
    if (kind === "b24") return { kind, hook: getS("b24.hook") };
    return { kind: "" };
  };
  const crm = () => crmClient(crmCfg(), fetchImpl);

  function settingsView() {
    const c = crmCfg();
    return {
      tg: { on: !!getS("tg.token"), bot: getS("tg.bot"), staff: db.all("select u.name from tg_staff t join users u on u.id = t.user_id").map((r) => r.name) },
      crm: { kind: c.kind, name: c.kind === "amo" ? "amoCRM" : c.kind === "b24" ? "Bitrix24" : "", account: getS("crm.account"), auto: getS("crm.auto") !== "0", amoDomain: getS("amo.domain"), b24Portal: c.kind === "b24" ? (b24Base(c.hook).split("/")[2] || "") : "" },
      metrika: getS("seo.metrika"), yandex: getS("seo.yandex"), google: getS("seo.google"),
      publicUrl,
    };
  }

  const connect = {
    async tg({ token: tk }, by) {
      tk = String(tk || "").trim();
      if (!/^\d+:[\w-]{30,}$/.test(tk)) throw new Error("Токен бота выглядит так: 123456:ABC… (его даёт @BotFather)");
      const c = tgClient(tk, fetchImpl), me = await c.me();
      const hook = token(24);
      if (publicUrl) await c.setHook(`${publicUrl}/api/tg/hook`, hook);
      try { await c.commands([{ command: "start", description: "Начать" }, { command: "faq", description: "Частые вопросы" }]); } catch { /* не критично */ }
      setS("tg.token", tk); setS("tg.bot", me.username || ""); setS("tg.secret", hook);
      note(by, `Подключил Telegram-бота @${me.username}`);
      return { bot: me.username };
    },
    async amo({ domain, token: tk }, by) {
      if (!amoBase(domain)) throw new Error("Поддомен amoCRM: например, czechfarm или czechfarm.amocrm.ru");
      const keep = String(tk || "").trim() || (getS("crm.kind") === "amo" ? getS("amo.token") : "");
      if (!keep) throw new Error("Вставьте долгосрочный токен");
      const acc = await crmClient({ kind: "amo", domain, token: keep }, fetchImpl).check();
      setS("b24.hook", ""); setS("amo.domain", domain); setS("amo.token", keep); setS("crm.kind", "amo"); setS("crm.account", acc);
      note(by, `Подключил amoCRM (${acc})`);
      return settingsView();
    },
    async b24({ hook }, by) {
      const base = b24Base(hook);
      if (!base) throw new Error("Адрес вебхука Bitrix24 выглядит так: https://портал.bitrix24.ru/rest/1/ключ/");
      const acc = await crmClient({ kind: "b24", hook: base }, fetchImpl).check();
      setS("amo.domain", ""); setS("amo.token", ""); setS("b24.hook", base); setS("crm.kind", "b24"); setS("crm.account", acc);
      note(by, `Подключил Bitrix24 (${acc})`);
      return settingsView();
    },
    crmAuto(on, by) { setS("crm.auto", on ? "1" : "0"); note(by, on ? "Обращения уходят в CRM сами" : "Обращения в CRM — только кнопкой"); },
    async off(name, by) {
      if (name === "tg") { try { await tg().dropHook(); } catch { /* токен мог уже не работать */ } ["tg.token", "tg.bot", "tg.secret"].forEach((k) => setS(k, "")); db.run("delete from tg_staff"); note(by, "Отключил Telegram-бота"); }
      if (name === "crm") { ["crm.kind", "crm.account", "amo.domain", "amo.token", "b24.hook"].forEach((k) => setS(k, "")); note(by, "Отключил CRM"); }
      return settingsView();
    },
    /* Ссылка, по которой сотрудник привязывает свой Telegram: /start <код>, 15 минут. */
    tgLink(userId) {
      const bot = getS("tg.bot");
      if (!bot) throw new Error("Сначала владелец подключает бота в «Подключениях»");
      const code = token(9);
      db.run("delete from tg_codes where until < ?", now());
      db.run("insert into tg_codes(code, user_id, until) values(?, ?, ?)", code, userId, now() + 15 * 6e4);
      return `https://t.me/${bot}?start=${code}`;
    },
    counters({ metrika, yandex, google }, by) {
      const m = cut(metrika, 12), y = cut(yandex, 80), g = cut(google, 120);
      if (m && !/^\d{5,12}$/.test(m)) throw new Error("Номер счётчика Метрики — только цифры");
      if ((y && !/^[\w-]{6,80}$/.test(y)) || (g && !/^[\w-]{6,120}$/.test(g))) throw new Error("Код подтверждения — латиница, цифры, дефис");
      setS("seo.metrika", m); setS("seo.yandex", y); setS("seo.google", g); changed();
      note(by, "Поменял счётчики и коды подтверждения");
    },
  };

  /* ── Обращения ──────────────────────────────────────────────────── */
  const LEAD_COLS = "id, no, at, kind, src, page, lang, name, org, email, phone, country, msg, extra, status, note, owner_id, tg_chat, crm_id, crm_err";
  const ownerName = (id) => (id ? db.get("select name from users where id = ?", id)?.name || "" : "");
  const view = (l) => l && { ...l, extra: json(l.extra, {}), owner: ownerName(l.owner_id), kindName: KINDS[l.kind] || l.kind, statusName: STATUS[l.status] || l.status };

  const leads = {
    async add(b, src = "site") {
      const kind = KINDS[b.kind] ? b.kind : "other";
      const l = {
        name: cut(b.name, 120), org: cut(b.org, 160), email: cut(b.email, 160), phone: cut(b.phone, 40), country: cut(b.country, 80),
        msg: cut(b.msg, 4000), page: cut(b.page, 40), lang: LANGS.includes(b.lang) ? b.lang : "ru",
      };
      if (!l.name && !l.org) throw new Error("Напишите, как к вам обращаться");
      if (src === "site" && !l.email && !l.phone) throw new Error("Оставьте почту или телефон, чтобы мы ответили");
      if (l.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(l.email)) throw new Error("Проверьте почту");
      /* Остальные поля формы (масштаб, что нужно, препарат из «Пути бренда») — как есть, коротко. */
      const extra = {};
      for (const [k, v] of Object.entries(b)) if (!["name", "org", "email", "phone", "country", "msg", "page", "lang", "kind", "id", "ts", "website", "agree"].includes(k) && typeof v === "string" && v.trim() && Object.keys(extra).length < 12) extra[cut(k, 30)] = cut(v, 300);
      let no; do no = leadNo(); while (db.get("select 1 from leads where no = ?", no));
      const key = token(12);
      const r = db.run("insert into leads(no, key, at, kind, src, page, lang, name, org, email, phone, country, msg, extra, tg_chat) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        no, key, now(), kind, src, l.page, l.lang, l.name, l.org, l.email, l.phone, l.country, l.msg, JSON.stringify(extra), cut(b.tgChat, 40));
      const id = Number(r.lastInsertRowid);
      note(src === "bot" ? "Telegram-бот" : "сайт", `Новое обращение ${no}: ${KINDS[kind]}`, id);
      await notifyStaff(id).catch((e) => console.error("tg notify", e.message));
      if (crmCfg().kind && getS("crm.auto") !== "0") await leads.toCrm(id, "система").catch(() => {});
      return { no, key, id };
    },
    /* Статус для «Мои обращения» на сайте: номер и ключ, который знает только браузер клиента. */
    statusOf(items) {
      const st = {};
      for (const it of (Array.isArray(items) ? items : []).slice(0, 10)) {
        const l = db.get("select key, status from leads where no = ?", cut(it?.no, 20));
        if (l && it.key && l.key === String(it.key)) st[it.no] = l.status === "spam" ? "done" : l.status;
      }
      return st;
    },
    list(user, { status = "", kind = "", q = "" } = {}) {
      let rows = db.all(`select ${LEAD_COLS} from leads order by id desc limit 500`).filter((l) => seesKind(user, l.kind));
      if (status) rows = rows.filter((l) => l.status === status);
      if (kind) rows = rows.filter((l) => l.kind === kind);
      if (q) { const s = q.toLowerCase(); rows = rows.filter((l) => [l.no, l.name, l.org, l.email, l.phone, l.msg].join(" ").toLowerCase().includes(s)); }
      return rows.map(view);
    },
    get(user, id) {
      const l = db.get(`select ${LEAD_COLS} from leads where id = ?`, id);
      if (!l || !seesKind(user, l.kind)) return null;
      return { ...view(l), history: db.all("select at, who, t from log where lead_id = ? order by id", id), msgs: db.all("select at, dir, text, who from lead_msgs where lead_id = ? order by id", id) };
    },
    check(user, id) { const l = db.get("select kind from leads where id = ?", id); if (!l || !seesKind(user, l.kind)) throw new Error("Нет такого обращения"); },
    setStatus(user, id, status) {
      leads.check(user, id);
      if (!STATUS[status]) throw new Error("Нет такого статуса");
      db.run("update leads set status = ? where id = ?", status, id);
      note(user.name, `Статус: «${STATUS[status]}»`, id);
    },
    setNote(user, id, text) { leads.check(user, id); db.run("update leads set note = ? where id = ?", cut(text, 4000), id); note(user.name, "Поменял заметку", id); },
    take(user, id) {
      leads.check(user, id);
      db.run("update leads set owner_id = ?, status = case when status = 'new' then 'work' else status end where id = ?", user.id, id);
      note(user.name, "Взял обращение", id);
      refreshNotices(id).catch(() => {});
    },
    assign(user, id, ownerId) {
      leads.check(user, id);
      if (user.role === "manager") throw new Error("Назначает руководитель или владелец");
      const u = ownerId ? users.get(ownerId) : null;
      if (ownerId && (!u || u.disabled)) throw new Error("Нет такого сотрудника");
      db.run("update leads set owner_id = ? where id = ?", ownerId || null, id);
      note(user.name, u ? `Назначил: ${u.name}` : "Снял ответственного", id);
      refreshNotices(id).catch(() => {});
    },
    async toCrm(id, who) {
      const l = db.get("select * from leads where id = ?", id);
      if (!l) throw new Error("Нет такого обращения");
      const c = crm();
      if (!c) throw new Error("CRM не подключена: владелец подключает её в «Подключениях»");
      try {
        const crmId = await c.send(l);
        db.run("update leads set crm_id = ?, crm_err = '' where id = ?", crmId, id);
        note(who, `Отправил в ${c.name}: № ${crmId}`, id);
        return crmId;
      } catch (e) {
        db.run("update leads set crm_err = ? where id = ?", cut(e.message, 300), id);
        note(who, `${c.name} не приняла обращение: ${e.message}`, id);
        throw e;
      }
    },
    /* Ответ клиенту в Telegram-бот (если обращение пришло из бота). */
    async reply(user, id, text) {
      leads.check(user, id);
      const l = db.get("select tg_chat from leads where id = ?", id);
      text = cut(text, 3500);
      if (!text) throw new Error("Пустой ответ");
      if (!l.tg_chat) throw new Error("Клиент писал с сайта: ответьте ему на почту или по телефону");
      await tg().send(l.tg_chat, text);
      db.run("insert into lead_msgs(lead_id, at, dir, text, who) values(?, ?, 'out', ?, ?)", id, now(), text, user.name);
      db.run("update leads set status = case when status in ('new', 'work') then 'done' else status end where id = ?", id);
      note(user.name, "Ответил клиенту в Telegram", id);
    },
  };

  /* ── Telegram: уведомления команде с «Взял» ─────────────────────── */
  function leadCard(id) {
    const l = view(db.get("select * from leads where id = ?", id));
    const lines = [
      `📩 ${l.kindName} · ${l.no}`,
      [l.name, l.org].filter(Boolean).join(", "),
      l.country && `Страна: ${l.country}`,
      l.email && `Почта: ${l.email}`,
      l.phone && `Телефон: ${l.phone}`,
      ...Object.entries(l.extra).map(([k, v]) => `${k}: ${v}`),
      l.msg && `\n${l.msg.slice(0, 1500)}`,
      "",
      l.owner ? `✅ Взял: ${l.owner}` : "Никто ещё не взял",
      l.tg_chat ? "Ответ на это сообщение уйдёт клиенту в бот." : "",
    ];
    const kb = [[...(l.owner ? [] : [{ text: "✋ Взял", callback_data: `take:${id}` }]), ...(publicUrl ? [{ text: "Открыть в панели", url: `${publicUrl}/admin#lead/${id}` }] : [])]].filter((r) => r.length);
    return { text: lines.filter((x) => x !== false && x !== null && x !== undefined).join("\n").replace(/\n{3,}/g, "\n\n"), extra: kb.length ? { reply_markup: { inline_keyboard: kb } } : {} };
  }
  async function notifyStaff(id) {
    if (!getS("tg.token")) return;
    const l = db.get("select kind from leads where id = ?", id);
    const staff = db.all("select t.chat_id, u.role, u.kinds from tg_staff t join users u on u.id = t.user_id where u.disabled = 0");
    const card = leadCard(id);
    for (const s of staff) {
      if (s.role === "manager" && l.kind === "investor") continue;
      const ks = s.kinds ? s.kinds.split(",") : [];
      if (ks.length && !ks.includes(l.kind)) continue;
      try { const m = await tg().send(s.chat_id, card.text, card.extra); db.run("insert or ignore into notices(chat_id, message_id, lead_id) values(?, ?, ?)", s.chat_id, m.message_id, id); } catch (e) { console.error("tg send", e.message); }
    }
  }
  async function refreshNotices(id) {
    if (!getS("tg.token")) return;
    const card = leadCard(id);
    for (const n of db.all("select chat_id, message_id from notices where lead_id = ?", id)) await tg().edit(n.chat_id, n.message_id, card.text, card.extra).catch(() => {});
  }

  /* ── Telegram: вебхук ───────────────────────────────────────────── */
  const BOT_TEXT = {
    hello: "Здравствуйте! Это бот CZECHFARM alliance. Напишите вопрос: на частые ответим сразу, остальное передадим команде, и вам ответят здесь же.",
    taken: "Спасибо! Передали команде CZECHFARM, ответ придёт в этот чат.",
    more: "Добавили к вашему обращению.",
    faq: "Частые вопросы:",
    none: "Частых вопросов пока нет. Напишите свой, и команда ответит.",
  };
  const botText = (k) => getS("bot." + k) || BOT_TEXT[k];
  const faqList = () => db.all("select id, q, a from faq order by sort, id");

  async function hook(update) {
    const u = tgUpdate(update);
    if (!u) return;
    const bot = tg();
    const staffRow = db.get("select t.user_id, u.name, u.role from tg_staff t join users u on u.id = t.user_id where t.chat_id = ? and u.disabled = 0", u.chat);

    if (u.kind === "button") {
      const m = /^take:(\d+)$/.exec(u.data), f = /^faq:(\d+)$/.exec(u.data);
      if (m && staffRow) {
        const id = Number(m[1]), l = db.get("select owner_id from leads where id = ?", id);
        if (!l) return bot.answer(u.id, "Обращения уже нет");
        if (l.owner_id && l.owner_id !== staffRow.user_id) { await bot.answer(u.id, `Уже взял ${ownerName(l.owner_id)}`); return refreshNotices(id); }
        leads.take({ id: staffRow.user_id, name: staffRow.name, role: staffRow.role }, id);
        return bot.answer(u.id, "Обращение ваше");
      }
      if (f) { const q = db.get("select a from faq where id = ?", Number(f[1])); await bot.answer(u.id, ""); if (q) await bot.send(u.chat, q.a); return; }
      return bot.answer(u.id, "");
    }

    /* Привязка сотрудника: /start <код из панели>. */
    if (u.start) {
      const c = db.get("select * from tg_codes where code = ? and until > ?", u.start, now());
      if (c) {
        db.run("delete from tg_codes where code = ?", u.start);
        db.run("insert into tg_staff(chat_id, user_id, at) values(?, ?, ?) on conflict(chat_id) do update set user_id = excluded.user_id, at = excluded.at", u.chat, c.user_id, now());
        const nm = users.get(c.user_id)?.name || "";
        note(nm, "Привязал Telegram");
        return bot.send(u.chat, `Готово, ${nm}: новые обращения будут приходить сюда с кнопкой «Взял». Ответ (Reply) на обращение из бота уйдёт клиенту.`);
      }
    }

    if (staffRow) {
      /* Ответ сотрудника на уведомление — клиенту в бот. */
      const n = u.replyTo && db.get("select lead_id from notices where chat_id = ? and message_id = ?", u.chat, u.replyTo);
      if (n) {
        const user = { id: staffRow.user_id, name: staffRow.name, role: staffRow.role };
        try { await leads.reply(user, n.lead_id, u.text); return bot.send(u.chat, "Отправили клиенту."); } catch (e) { return bot.send(u.chat, e.message); }
      }
      return bot.send(u.chat, "Это бот для обращений. Чтобы ответить клиенту, ответьте (Reply) на его обращение.");
    }

    /* Клиент. */
    if (u.start !== null || u.text === "/faq") {
      const list = faqList();
      if (u.start !== null) await bot.send(u.chat, botText("hello"));
      return bot.send(u.chat, list.length ? botText("faq") : botText("none"), list.length ? { reply_markup: { inline_keyboard: list.slice(0, 10).map((f) => [{ text: f.q.slice(0, 60), callback_data: `faq:${f.id}` }]) } } : {});
    }
    const hit = faqMatch(u.text, faqList());
    const open = db.get("select id from leads where tg_chat = ? and status in ('new', 'work', 'meet') and at > ? order by id desc", u.chat, now() - 7 * 864e5);
    if (hit && !open) return bot.send(u.chat, hit.a);
    if (open) {
      db.run("insert into lead_msgs(lead_id, at, dir, text, who) values(?, ?, 'in', ?, ?)", open.id, now(), cut(u.text, 4000), u.name);
      note("Telegram-бот", "Клиент дописал в бот", open.id);
      const card = `💬 ${db.get("select no from leads where id = ?", open.id).no}: ${u.name} дописал\n\n${u.text.slice(0, 1500)}`;
      for (const s of db.all("select t.chat_id from tg_staff t join users u on u.id = t.user_id where u.disabled = 0")) {
        try { const m = await bot.send(s.chat_id, card); db.run("insert or ignore into notices(chat_id, message_id, lead_id) values(?, ?, ?)", s.chat_id, m.message_id, open.id); } catch { /* дальше */ }
      }
      return bot.send(u.chat, botText("more"));
    }
    const { id } = await leads.add({ kind: "bot", name: u.name, org: u.username ? "@" + u.username : "", msg: u.text, lang: LANGS.includes(u.lang) ? u.lang : "ru", page: "telegram", tgChat: u.chat }, "bot");
    db.run("insert into lead_msgs(lead_id, at, dir, text, who) values(?, ?, 'in', ?, ?)", id, now(), cut(u.text, 4000), u.name);
    return bot.send(u.chat, botText("taken"));
  }

  const faq = {
    list: faqList,
    save(list, by) {
      const rows = (Array.isArray(list) ? list : []).map((f) => ({ q: cut(f.q, 200), a: cut(f.a, 3000) })).filter((f) => f.q && f.a).slice(0, 30);
      db.tx(() => { db.run("delete from faq"); rows.forEach((f, i) => db.run("insert into faq(q, a, sort) values(?, ?, ?)", f.q, f.a, i)); });
      note(by, `Сохранил частые вопросы бота: ${rows.length}`);
      return faqList();
    },
    texts: () => Object.fromEntries(Object.keys(BOT_TEXT).map((k) => [k, botText(k)])),
    setTexts(t, by) { for (const k of Object.keys(BOT_TEXT)) if (typeof t?.[k] === "string") setS("bot." + k, cut(t[k], 1000) === BOT_TEXT[k] ? "" : cut(t[k], 1000)); note(by, "Поменял тексты бота"); },
  };

  /* ── Сайт: продукты, новости, заголовки, контакты ───────────────── */
  const cleanProduct = (d) => {
    const o = {};
    for (const k of PRODUCT_KEYS) o[k] = cut(d?.[k], k === "about" ? 4000 : 300);
    if (!o.name) throw new Error("Укажите название продукта");
    if (o.rx && o.rx !== "rx" && o.rx !== "otc") o.rx = "";
    for (const k of ["doc", "img"]) if (o[k] && !/^(https:\/\/|\/uploads\/)/.test(o[k])) throw new Error("Файл — загрузкой или ссылкой https://");
    return o;
  };
  const products = {
    list: () => db.all("select id, data, pub, sort, at from products order by sort, id").map((r) => ({ id: r.id, pub: !!r.pub, sort: r.sort, ...json(r.data, {}) })),
    save(id, d, by) {
      const o = cleanProduct(d);
      if (id) db.run("update products set data = ?, at = ? where id = ?", JSON.stringify(o), now(), id);
      else id = Number(db.run("insert into products(data, pub, sort, at) values(?, 0, ?, ?)", JSON.stringify(o), (db.get("select max(sort) m from products").m || 0) + 1, now()).lastInsertRowid);
      changed(); note(by, `Сохранил продукт «${o.name}»`);
      return id;
    },
    publish(id, on, by) { db.run("update products set pub = ? where id = ?", on ? 1 : 0, id); changed(); note(by, `${on ? "Опубликовал" : "Снял"} продукт № ${id}`); },
    remove(id, by) { db.run("delete from products where id = ?", id); changed(); note(by, `Удалил продукт № ${id}`); },
  };
  /* Новость — на каждом языке сайта своим текстом; нет перевода — русский. */
  const cleanNews = (d) => {
    const o = { img: cut(d?.img, 300) };
    for (const l of LANGS) o[l] = { title: cut(d?.[l]?.title, 200), body: cut(d?.[l]?.body, 20000) };
    if (!o.ru.title) throw new Error("Заголовок на русском обязателен");
    if (o.img && !/^(https:\/\/|\/uploads\/)/.test(o.img)) throw new Error("Картинка — загрузкой или ссылкой https://");
    return o;
  };
  const news = {
    list: () => db.all("select id, data, pub, ts from news order by ts desc, id desc").map((r) => ({ id: r.id, pub: !!r.pub, ts: r.ts, ...json(r.data, {}) })),
    save(id, d, by) {
      const o = cleanNews(d), ts = Number(d?.ts) > 0 ? Number(d.ts) : now();
      if (id) db.run("update news set data = ?, ts = ?, at = ? where id = ?", JSON.stringify(o), ts, now(), id);
      else id = Number(db.run("insert into news(data, pub, ts, at) values(?, 0, ?, ?)", JSON.stringify(o), ts, now()).lastInsertRowid);
      changed(); note(by, `Сохранил новость «${o.ru.title}»`);
      return id;
    },
    publish(id, on, by) { db.run("update news set pub = ? where id = ?", on ? 1 : 0, id); changed(); note(by, `${on ? "Опубликовал" : "Снял"} новость № ${id}`); },
    remove(id, by) { db.run("delete from news where id = ?", id); changed(); note(by, `Удалил новость № ${id}`); },
  };
  const seo = {
    all: () => Object.fromEntries(db.all("select k, t, d from seo").map((r) => [r.k, { t: r.t, d: r.d }])),
    save(map, by) {
      db.tx(() => { for (const [k, v] of Object.entries(map || {})) {
        const [l, p] = k.split(":");
        if (!LANGS.includes(l) || !PAGES.includes(p)) continue;
        const t = cut(v?.t, 120), d = cut(v?.d, 300);
        if (t || d) db.run("insert into seo(k, t, d) values(?, ?, ?) on conflict(k) do update set t = excluded.t, d = excluded.d", k, t, d); else db.run("delete from seo where k = ?", k);
      } });
      changed(); note(by, "Поменял заголовки страниц");
    },
  };
  const contacts = {
    get: () => Object.fromEntries(CONTACT_KEYS.map((k) => [k, getS("ct." + k)])),
    save(c, by) {
      const map = cut(c?.map, 1000);
      if (map && !/^https:\/\/(www\.)?(google\.com\/maps\/embed|yandex\.(ru|uz|com)\/map-widget)/.test(map)) throw new Error("Карта: адрес из «Поделиться → Встроить карту» Google или из конструктора Яндекс Карт (https://yandex.ru/map-widget/…)");
      const social = cut(c?.social, 300);
      if (social && !/^https:\/\//.test(social)) throw new Error("Соцсеть — ссылкой https://");
      for (const k of CONTACT_KEYS) setS("ct." + k, k === "map" ? map : k === "social" ? social : cut(c?.[k], 300));
      changed(); note(by, "Поменял контакты на сайте");
    },
  };

  /* То, что сервер кладёт в страницу (K.live): только опубликованное. */
  function live(lang) {
    return {
      prod: products.list().filter((p) => p.pub).map(({ sort, ...p }) => p),
      news: news.list().filter((n) => n.pub).map((n) => ({ id: n.id, pub: true, ts: n.ts, img: n.img, title: n[lang]?.title || n.ru.title, body: n[lang]?.title ? n[lang].body : n.ru.body })),
      contacts: contacts.get(),
    };
  }
  const seoFor = (lang, page) => db.get("select t, d from seo where k = ?", `${lang}:${page}`) || null;

  /* ── Комната инвестора ──────────────────────────────────────────── */
  const ir = {
    docs: () => db.all("select id, title, name, size, at from ir_docs order by id desc"),
    addDoc({ title, file, name, size }, by) {
      title = cut(title, 160); if (!title) throw new Error("Назовите документ");
      const id = Number(db.run("insert into ir_docs(title, file, name, size, at) values(?, ?, ?, ?, ?)", title, file, cut(name, 160), size, now()).lastInsertRowid);
      note(by, `Добавил документ инвестору «${title}»`); return id;
    },
    fileUsed: (file) => !!db.get("select 1 from ir_docs where file = ?", file),
    removeDoc(id, by) { const d = db.get("select title, file from ir_docs where id = ?", id); db.run("delete from ir_docs where id = ?", id); note(by, `Удалил документ инвестору «${d?.title || id}»`); return d?.file || ""; },
    links: () => db.all("select l.token, l.name, l.org, l.lang, l.created_at, l.created_by, l.revoked, l.last_at, (select count(*) from ir_views v where v.token = l.token) views from ir_links l order by l.created_at desc").map((l) => ({ ...l, url: `${publicUrl}/room/${l.token}` })),
    addLink({ name, org, lang }, by) {
      name = cut(name, 120); if (!name) throw new Error("Кому ссылка: имя инвестора");
      const tk = token(18);
      db.run("insert into ir_links(token, name, org, lang, created_at, created_by) values(?, ?, ?, ?, ?, ?)", tk, name, cut(org, 160), LANGS.includes(lang) ? lang : "ru", now(), by);
      note(by, `Выдал ссылку в комнату инвестора: ${name}`);
      return `${publicUrl}/room/${tk}`;
    },
    revoke(tk, by) { const l = db.get("select name from ir_links where token = ?", tk); db.run("update ir_links set revoked = 1 where token = ?", tk); note(by, `Закрыл ссылку инвестора: ${l?.name || ""}`); },
    views: (tk) => db.all("select v.at, v.ip, d.title from ir_views v left join ir_docs d on d.id = v.doc_id where v.token = ? order by v.id desc limit 200", tk),
    /* Открытие по ссылке: живая ссылка → список документов, каждое открытие — в журнал. */
    open(tk, docId, ip) {
      const l = db.get("select * from ir_links where token = ? and revoked = 0", cut(tk, 40));
      if (!l) return null;
      db.run("insert into ir_views(token, doc_id, at, ip) values(?, ?, ?, ?)", l.token, docId || null, now(), cut(ip, 60));
      db.run("update ir_links set last_at = ? where token = ?", now(), l.token);
      if (docId) return { link: l, doc: db.get("select * from ir_docs where id = ?", docId) };
      return { link: l, docs: ir.docs() };
    },
  };

  /* ── Сводка и журнал ────────────────────────────────────────────── */
  function summary(user) {
    const rows = db.all("select kind, status, at, owner_id from leads where status != 'spam' order by id desc limit 2000").filter((l) => seesKind(user, l.kind));
    const day = now() - 864e5, week = now() - 7 * 864e5;
    return {
      fresh: rows.filter((l) => l.status === "new").length,
      noOwner: rows.filter((l) => !l.owner_id && l.status !== "done").length,
      day: rows.filter((l) => l.at > day).length,
      week: rows.filter((l) => l.at > week).length,
      byKind: Object.fromEntries(Object.keys(KINDS).map((k) => [k, rows.filter((l) => l.kind === k && l.at > week).length])),
      products: db.get("select count(*) n from products where pub = 1").n,
      news: db.get("select count(*) n from news where pub = 1").n,
      todo: [
        !getS("tg.token") && "Подключить Telegram-бота",
        !crmCfg().kind && "Подключить amoCRM или Bitrix24",
        !getS("ct.phone") && !getS("ct.email") && "Заполнить контакты на сайте",
        !db.get("select 1 from products where pub = 1") && "Опубликовать первые продукты",
      ].filter(Boolean),
    };
  }
  const log = () => db.all("select l.at, l.who, l.t, l.lead_id, ld.no from log l left join leads ld on ld.id = l.lead_id order by l.id desc limit 300");

  return {
    users, auth, connect, settingsView, leads, faq, products, news, seo, contacts, ir, summary, log, live, seoFor,
    hook, tgSecret: () => getS("tg.secret"), counters: () => ({ metrika: getS("seo.metrika"), yandex: getS("seo.yandex"), google: getS("seo.google") }),
    version: () => version, leadText,
  };
}
