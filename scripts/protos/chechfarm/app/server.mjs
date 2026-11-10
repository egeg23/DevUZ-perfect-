/* Сервер сайта CZECHFARM на сервере компании: сайт, панель, комната
   инвестора и вебхук Telegram одним процессом на node:http, без фреймворка.
   Образ собирает GitHub (.github/workflows/czechfarm-app.yml), сервер
   компании его только запускает (deploy/remote.sh). */
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { createReadStream, existsSync, statSync, readFileSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join, normalize, resolve, sep } from "node:path";
import { openDb } from "./lib/db.mjs";
import { makeCore, ROLES, STATUS, KINDS, LANGS, PAGES, CONTACT_KEYS, SEGMENTS, ACC_STATUS } from "./lib/core.mjs";
import { sameSecret } from "./lib/crypt.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".pdf": "application/pdf", ".bin": "application/octet-stream",
};
const COOKIE = "cf_s", ACOOKIE = "cf_a";
const SITE_PAGES = ["", "about", "products", "partners", "investors", "news", "contacts", "privacy", "account"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function limiter() {
  const seen = new Map();
  return (key, max, ms) => {
    const t = Date.now(), a = (seen.get(key) || []).filter((x) => t - x < ms);
    if (a.length >= max) { seen.set(key, a); return false; }
    a.push(t); seen.set(key, a);
    if (seen.size > 5000) for (const [k, v] of seen) if (!v.length || t - v[v.length - 1] > ms) seen.delete(k);
    return true;
  };
}

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }

/* Файл из панели: JPG, PNG, WebP или PDF по первым байтам, не по имени. */
export function fileKind(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.subarray(0, 4).toString("hex") === "89504e47") return "png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  if (buf.subarray(0, 5).toString() === "%PDF-") return "pdf";
  return "";
}

/* Адрес страницы → [язык, страница]: /, /about, /uz/, /en/news, /ar/contacts. */
export function routeOf(p) {
  const parts = p.replace(/\/index\.html$/, "").split("/").filter(Boolean);
  let lang = "ru";
  if (parts.length && ["uz", "en", "ar"].includes(parts[0])) lang = parts.shift();
  if (parts.length > 1) return null;
  const page = parts[0] || "";
  return SITE_PAGES.includes(page) ? [lang, page] : null;
}

export function createApp({ core, siteDir, adminDir, dataDir = "", setupCode = "", publicUrl = "", trustProxy = false, commit = "", sceneKey = "" }) {
  const allow = limiter();
  const uploadsDir = dataDir ? join(dataDir, "uploads") : "", irDir = dataDir ? join(dataDir, "ir") : "";
  const ipOf = (req) => (trustProxy && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "?";
  const cookies = (req) => Object.fromEntries(String(req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((x) => x[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
  const secure = publicUrl.startsWith("https://");
  const setCookie = (res, v, age, name = COOKIE) => res.setHeader("Set-Cookie", `${name}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`);
  const accOf = (req) => core.aud.acc.of(cookies(req)[ACOOKIE]);

  function send(res, code, body, headers = {}) {
    const isJson = typeof body !== "string";
    res.writeHead(code, { "Content-Type": isJson ? MIME[".json"] : "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers });
    res.end(isJson ? JSON.stringify(body) : body);
  }

  async function body(req, limit = 64 * 1024) {
    let size = 0; const parts = [];
    for await (const ch of req) { size += ch.length; if (size > limit) throw new HttpError(413, "Слишком большой файл или запрос"); parts.push(ch); }
    if (!size) return {};
    try { return JSON.parse(Buffer.concat(parts).toString("utf8")); } catch { throw new HttpError(400, "Ожидался JSON"); }
  }

  function staticFile(req, res, root, rel, cache, extra = {}) {
    const base = resolve(root), file = normalize(join(base, rel));
    if (file !== base && !file.startsWith(base + sep)) return false;
    if (!existsSync(file) || !statSync(file).isFile()) return false;
    const st = statSync(file), type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": cache, "Content-Length": st.size, "Last-Modified": st.mtime.toUTCString(), "X-Content-Type-Options": "nosniff", ...extra });
    if (req.method === "HEAD") return res.end(), true;
    createReadStream(file).pipe(res); return true;
  }

  /* Страница сайта: файл из образа + то, что правится в панели (продукты,
     новости, контакты, заголовки, счётчики). Сжатая копия живёт до правки. */
  let cache = new Map(), seen = 0;
  function page(lang, pg) {
    if (core.version() !== seen) { cache = new Map(); seen = core.version(); }
    const key = lang + ":" + pg;
    if (!cache.has(key)) {
      const f = join(siteDir, ...(lang === "ru" ? [] : [lang]), ...(pg ? [pg] : []), "index.html");
      let html = existsSync(f) ? readFileSync(f, "utf8") : "";
      if (html) {
        html = html.split("__SITE_URL__").join(publicUrl);
        html = html.replace('"live":null', '"live":' + JSON.stringify(core.live(lang)).replace(/</g, "\\u003c"));
        const s = core.seoFor(lang, pg || "home");
        if (s?.t) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(s.t)}</title>`).replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(s.t)}"`);
        if (s?.d) html = html.replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(s.d)}"`).replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(s.d)}"`);
        const c = core.counters(), head = [];
        if (c.yandex) head.push(`<meta name="yandex-verification" content="${esc(c.yandex)}">`);
        if (c.google) head.push(`<meta name="google-site-verification" content="${esc(c.google)}">`);
        if (c.metrika) head.push(`<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${Number(c.metrika)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});</script>`);
        if (head.length) html = html.replace("</head>", head.join("\n") + "\n</head>");
      }
      cache.set(key, html && { html, gz: gzipSync(html) });
    }
    return cache.get(key);
  }
  function sendHtml(req, res, pg, code = 200) {
    if (!pg) return send(res, code === 404 ? 404 : 503, code === 404 ? "Страница не найдена" : "Сайт ещё собирается");
    const h = { "Content-Type": MIME[".html"], "Cache-Control": "no-cache", Vary: "Accept-Encoding", "X-Frame-Options": "SAMEORIGIN" };
    if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || ""))) { res.writeHead(code, { ...h, "Content-Encoding": "gzip", "Content-Length": pg.gz.length }); return res.end(req.method === "HEAD" ? undefined : pg.gz); }
    res.writeHead(code, { ...h, "Content-Length": Buffer.byteLength(pg.html) }); res.end(req.method === "HEAD" ? undefined : pg.html);
  }

  function saveFile(dataUrl, dir, allowKinds, max) {
    if (!dir) throw new HttpError(400, "Загрузка работает на сервере компании");
    const m = /^data:[\w/+.-]+;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
    if (!m) throw new HttpError(400, "Файл не прочитался, выберите его ещё раз");
    const buf = Buffer.from(m[1], "base64"), ext = fileKind(buf);
    if (!allowKinds.includes(ext)) throw new HttpError(400, allowKinds.includes("pdf") && allowKinds.length === 1 ? "Нужен PDF" : "Нужно фото JPG, PNG, WebP или PDF");
    if (buf.length > max) throw new HttpError(400, `Файл больше ${Math.round(max / 1048576)} МБ`);
    const name = createHash("sha256").update(buf).digest("hex").slice(0, 32) + "." + ext;
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, name))) writeFileSync(join(dir, name), buf);
    return { name, size: buf.length };
  }

  /* ── Комната инвестора: /room/<ссылка> ─────────────────────────── */
  const ROOM = {
    ru: ["Комната инвестора", "Материалы CZECHFARM для", "Документы", "Пока документов нет: компания добавит их и сообщит вам.", "Открыть", "Ссылка личная: пожалуйста, не пересылайте её. Компания видит, когда материалы открывали.", "Ссылка не работает", "Попросите у CZECHFARM новую ссылку."],
    uz: ["Investor xonasi", "CZECHFARM materiallari:", "Hujjatlar", "Hozircha hujjatlar yo‘q: kompaniya ularni qo‘shib, sizga xabar beradi.", "Ochish", "Havola shaxsiy: iltimos, uni boshqalarga yubormang. Kompaniya materiallar qachon ochilganini ko‘radi.", "Havola ishlamaydi", "CZECHFARMdan yangi havola so‘rang."],
    en: ["Investor room", "CZECHFARM materials for", "Documents", "No documents yet: the company will add them and let you know.", "Open", "This link is personal: please do not forward it. The company can see when the materials were opened.", "This link does not work", "Please ask CZECHFARM for a new link."],
    ar: ["غرفة المستثمر", "مواد CZECHFARM من أجل", "المستندات", "لا توجد مستندات بعد: ستضيفها الشركة وتبلغكم.", "فتح", "هذا الرابط شخصي: يرجى عدم مشاركته. ترى الشركة متى تم فتح المواد.", "هذا الرابط لا يعمل", "يرجى طلب رابط جديد من CZECHFARM."],
  };
  function roomHtml(r) {
    const lang = r?.link?.lang || "ru", T = ROOM[lang] || ROOM.ru, dir = lang === "ar" ? ' dir="rtl"' : "";
    const list = !r ? `<h1>${T[6]}</h1><p>${T[7]}</p>` : `<p class="k">${T[0]}</p><h1>${T[1]} ${esc(r.link.name)}${r.link.org ? `, ${esc(r.link.org)}` : ""}</h1><h2>${T[2]}</h2>${r.docs.length ? `<ul>${r.docs.map((d) => `<li><span><b>${esc(d.title)}</b><small>${esc(d.name)} · ${(d.size / 1048576).toFixed(1)} МБ</small></span><a href="/room/${esc(r.link.token)}/doc/${d.id}" target="_blank" rel="noopener">${T[4]}</a></li>`).join("")}</ul>` : `<p>${T[3]}</p>`}<p class="n">${T[5]}</p>`;
    return `<!doctype html><html lang="${lang}"${dir}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${T[0]} · CZECHFARM</title><link rel="icon" href="/protos/chechfarm/icon.svg">
<style>body{margin:0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;background:#071a18;color:#e5f4f0;min-height:100vh}main{max-width:760px;margin:0 auto;padding:56px 20px}.k{letter-spacing:.18em;text-transform:uppercase;font-size:12px;color:#e5c98f}h1{font:700 clamp(28px,5vw,40px)/1.15 Georgia,serif;margin:8px 0 32px}h2{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#9cc9c0}ul{list-style:none;padding:0;display:grid;gap:12px}li{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:16px 18px;border:1px solid rgb(229 244 240/.16);border-radius:14px;background:rgb(255 255 255/.04)}li span{display:grid;gap:2px}small{color:#9cc9c0}a{color:#071a18;background:#e5c98f;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;white-space:nowrap}.n{margin-top:32px;font-size:14px;color:#9cc9c0}</style></head><body><main>${list}</main></body></html>`;
  }

  async function admin(req, res, path, user) {
    const M = req.method, id = Number((/\/(\d+)(?:\/|$)/.exec(path) || [])[1]) || 0, who = user.name;
    const owner = () => { if (user.role !== "owner") throw new HttpError(403, "Это может только владелец"); };
    const lead = () => { if (user.role === "manager") throw new HttpError(403, "Это может руководитель или владелец"); };
    if (M === "GET" && path === "/summary") return core.summary(user);
    if (M === "GET" && path === "/meta") return { roles: ROLES, status: STATUS, kinds: KINDS, langs: LANGS, pages: PAGES, contactKeys: CONTACT_KEYS, me: user, users: core.users.list().filter((u) => !u.disabled).map((u) => ({ id: u.id, name: u.name })) };
    if (M === "GET" && path === "/leads") { const q = new URL(req.url, "http://x").searchParams; return { leads: core.leads.list(user, { status: q.get("status") || "", kind: q.get("kind") || "", q: q.get("q") || "" }) }; }
    if (M === "GET" && /^\/leads\/\d+$/.test(path)) { const l = core.leads.get(user, id); if (!l) throw new HttpError(404, "Нет такого обращения"); return l; }
    if (M === "POST" && /^\/leads\/\d+$/.test(path)) {
      const b = await body(req);
      if (b.status) core.leads.setStatus(user, id, b.status);
      if (typeof b.note === "string") core.leads.setNote(user, id, b.note);
      if (b.take) core.leads.take(user, id);
      if ("owner" in b) core.leads.assign(user, id, Number(b.owner) || 0);
      return core.leads.get(user, id);
    }
    if (M === "POST" && /^\/leads\/\d+\/crm$/.test(path)) { core.leads.check(user, id); return { crm: await core.leads.toCrm(id, who) }; }
    if (M === "POST" && /^\/leads\/\d+\/reply$/.test(path)) { await core.leads.reply(user, id, (await body(req)).text); return core.leads.get(user, id); }

    /* Продукты и новости — любой сотрудник. */
    if (M === "GET" && path === "/products") return { products: core.products.list() };
    if (M === "POST" && (path === "/products" || /^\/products\/\d+$/.test(path))) { const nid = core.products.save(id, await body(req), who); return { id: nid, products: core.products.list() }; }
    if (M === "POST" && /^\/products\/\d+\/(pub|unpub|del)$/.test(path)) { const a = path.split("/")[3]; if (a === "del") core.products.remove(id, who); else core.products.publish(id, a === "pub", who); return { products: core.products.list() }; }
    if (M === "GET" && path === "/news") return { news: core.news.list() };
    if (M === "POST" && (path === "/news" || /^\/news\/\d+$/.test(path))) { const nid = core.news.save(id, await body(req, 256 * 1024), who); return { id: nid, news: core.news.list() }; }
    if (M === "POST" && /^\/news\/\d+\/(pub|unpub|del)$/.test(path)) { const a = path.split("/")[3]; if (a === "del") core.news.remove(id, who); else core.news.publish(id, a === "pub", who); return { news: core.news.list() }; }
    if (M === "POST" && path === "/upload") { const b = await body(req, 22 * 1024 * 1024); const f = saveFile(b.data, uploadsDir, ["jpg", "png", "webp", "pdf"], 15 * 1048576); return { url: "/uploads/" + f.name }; }

    /* Сайт: контакты — любой; заголовки и счётчики — руководитель и владелец (в макете менеджер SEO не видит). */
    if (M === "GET" && path === "/site") return { contacts: core.contacts.get(), seo: user.role === "manager" ? null : core.seo.all(), counters: user.role === "manager" ? null : core.counters(), faq: core.faq.list(), botTexts: core.faq.texts() };
    if (M === "POST" && path === "/site/contacts") { core.contacts.save(await body(req), who); return { ok: true }; }
    if (M === "POST" && path === "/site/seo") { lead(); core.seo.save(await body(req), who); return { seo: core.seo.all() }; }
    if (M === "POST" && path === "/site/counters") { lead(); core.connect.counters(await body(req), who); return { ok: true }; }
    if (M === "POST" && path === "/site/faq") { const b = await body(req, 256 * 1024); if (b.texts) core.faq.setTexts(b.texts, who); return { faq: core.faq.save(b.faq, who), botTexts: core.faq.texts() }; }

    /* Комната инвестора — руководитель и владелец. */
    if (path.startsWith("/ir")) {
      lead();
      if (M === "GET" && path === "/ir") return { docs: core.ir.docs(), links: core.ir.links() };
      if (M === "POST" && path === "/ir/docs") { const b = await body(req, 40 * 1024 * 1024); const f = saveFile(b.data, irDir, ["pdf"], 25 * 1048576); core.ir.addDoc({ title: b.title, file: f.name, name: b.name, size: f.size }, who); return { docs: core.ir.docs() }; }
      if (M === "POST" && /^\/ir\/docs\/\d+\/del$/.test(path)) { const file = core.ir.removeDoc(id, who); if (file && irDir && !core.ir.fileUsed(file)) try { unlinkSync(join(irDir, file)); } catch { /* уже нет */ } return { docs: core.ir.docs() }; }
      if (M === "POST" && path === "/ir/links") { const url = core.ir.addLink(await body(req), who); return { url, links: core.ir.links() }; }
      const lk = /^\/ir\/links\/([\w-]+)(\/revoke)?$/.exec(path);
      if (lk && M === "POST" && lk[2]) { core.ir.revoke(lk[1], who); return { links: core.ir.links() }; }
      if (lk && M === "GET") return { views: core.ir.views(lk[1]) };
    }

    /* Подписчики бота и рассылки — руководитель и владелец (менеджеру не видно). */
    if (path === "/audience" && M === "GET") { lead(); return { counts: core.aud.subs.counts(), broadcasts: core.aud.bc.list(), segments: SEGMENTS }; }
    if (path === "/broadcasts" && M === "POST") { lead(); const b = await body(req, 16 * 1024); const bid = core.aud.bc.create({ text: b.text, photo: b.photo, seg: b.seg }, who); return { id: bid, broadcasts: core.aud.bc.list() }; }
    if (M === "POST" && /^\/broadcasts\/\d+\/cancel$/.test(path)) { lead(); core.aud.bc.cancel(id, who); return { broadcasts: core.aud.bc.list() }; }
    /* Кабинеты партнёров и клиентов: видят все, одобряет и блокирует руководитель или владелец. */
    if (path === "/accounts" && M === "GET") return { accounts: core.aud.acc.list(), status: ACC_STATUS };
    if (M === "POST" && /^\/accounts\/\d+$/.test(path)) { lead(); core.aud.acc.setStatus(id, (await body(req)).status, who); return { accounts: core.aud.acc.list() }; }

    /* Подключения и команда — владелец. */
    if (M === "GET" && path === "/settings") return core.settingsView();
    if (M === "POST" && /^\/connect\/(tg|amo|b24)$/.test(path)) { owner(); return await core.connect[path.slice(9)](await body(req), who); }
    if (M === "POST" && path === "/connect/crm-auto") { owner(); core.connect.crmAuto(!!(await body(req)).on, who); return core.settingsView(); }
    if (M === "POST" && /^\/connect\/(tg|crm)\/off$/.test(path)) { owner(); return await core.connect.off(path.split("/")[2], who); }
    if (M === "POST" && path === "/tg/link") return { url: core.connect.tgLink(user.id) };
    if (M === "GET" && path === "/users") return { users: core.users.list(), roles: ROLES, kinds: KINDS };
    if (M === "POST" && path === "/users") { owner(); core.users.add(await body(req), who); return { users: core.users.list() }; }
    if (M === "POST" && /^\/users\/\d+$/.test(path)) { owner(); const b = await body(req); if (b.role) core.users.setRole(id, b.role, who); if (b.kinds) core.users.setKinds(id, b.kinds, who); return { users: core.users.list() }; }
    if (M === "POST" && /^\/users\/\d+\/off$/.test(path)) { owner(); if (id === user.id) throw new HttpError(400, "Себя отключить нельзя"); core.users.disable(id, who); return { users: core.users.list() }; }
    if (M === "POST" && /^\/users\/\d+\/pass$/.test(path)) { owner(); core.users.setPass(id, (await body(req)).pass, who); return { ok: true }; }
    if (M === "POST" && path === "/me/pass") { const b = await body(req); if (!core.auth.check(user.login, b.old)) throw new HttpError(400, "Текущий пароль не подошёл"); core.users.setPass(user.id, b.pass, who); return { ok: true, relogin: true }; }
    if (M === "GET" && path === "/log") { lead(); return { log: core.log() }; }
    throw new HttpError(404, "Нет такого адреса");
  }

  async function api(req, res, url) {
    const p = url.pathname, M = req.method, ip = ipOf(req);
    if (p === "/api/health") return send(res, 200, { ok: true, commit });

    /* Кабинет партнёра и клиента. */
    if (p.startsWith("/api/acc/")) {
      const a = p.slice(9);
      if (M === "POST" && req.headers["content-type"]?.startsWith("application/json") !== true) throw new HttpError(415, "Ожидался JSON");
      if (a === "register" && M === "POST") {
        if (!allow("reg:" + ip, 5, 60 * 6e4)) throw new HttpError(429, "Слишком много регистраций подряд. Попробуйте позже");
        const b = await body(req, 8 * 1024);
        if (b.website) return send(res, 200, { ok: true });
        setCookie(res, core.aud.acc.register(b), 90 * 86400, ACOOKIE);
        return send(res, 200, { ok: true });
      }
      if (a === "login" && M === "POST") {
        const b = await body(req);
        if (!allow("alogin:" + ip, 10, 15 * 6e4) || !allow("alogin:" + String(b.email || "").toLowerCase(), 10, 15 * 6e4)) throw new HttpError(429, "Слишком много попыток, подождите 15 минут");
        const sid = core.aud.acc.login(b.email, b.pass);
        if (!sid) throw new HttpError(401, "Почта или пароль не подошли");
        setCookie(res, sid, 90 * 86400, ACOOKIE);
        return send(res, 200, { ok: true });
      }
      if (a === "logout" && M === "POST") { core.aud.acc.logout(cookies(req)[ACOOKIE]); setCookie(res, "", 0, ACOOKIE); return send(res, 200, { ok: true }); }
      const acc = accOf(req);
      if (!acc) throw new HttpError(401, "Войдите в кабинет");
      if (a === "me" && M === "GET") return send(res, 200, core.aud.acc.me(acc));
      if (a === "tg" && M === "POST") return send(res, 200, { url: core.aud.acc.tgLink(acc, core.settingsView().tg.bot) });
      throw new HttpError(404, "Нет такого адреса");
    }

    if (p === "/api/lead" && M === "POST") {
      if (!allow("lead:" + ip, 6, 10 * 6e4)) throw new HttpError(429, "Слишком много обращений подряд. Попробуйте через несколько минут");
      const b = await body(req, 16 * 1024);
      if (b.website) return send(res, 200, { no: "", key: "" });
      delete b.accountId; delete b.tgChat;
      const acc = accOf(req);
      if (acc) Object.assign(b, { accountId: acc.id, name: b.name || acc.name, org: b.org || acc.org, email: b.email || acc.email, phone: b.phone || acc.phone, country: b.country || acc.country });
      const r = await core.leads.add(b, "site");
      return send(res, 200, { no: r.no, key: r.key });
    }
    if (p === "/api/track" && M === "POST") {
      if (!allow("track:" + ip, 60, 6e4)) throw new HttpError(429, "Подождите минуту");
      return send(res, 200, { st: core.leads.statusOf((await body(req, 4096)).items) });
    }
    if (p === "/api/tg/hook" && M === "POST") {
      if (!sameSecret(req.headers["x-telegram-bot-api-secret-token"], core.tgSecret())) throw new HttpError(403, "нет");
      await core.hook(await body(req, 512 * 1024)).catch((e) => console.error("tg", e.message));
      return send(res, 200, { ok: true });
    }

    if (p.startsWith("/api/admin/")) {
      const path = p.slice(10);
      if (M === "POST") {
        /* Чужой сайт не отправит заголовок X-CF без разрешения CORS. */
        if (req.headers["x-cf"] !== "1") throw new HttpError(403, "Запрос не из панели");
        const o = req.headers.origin; if (o && publicUrl && o !== publicUrl) throw new HttpError(403, "Запрос не из панели");
      }
      const sid = cookies(req)[COOKIE], user = core.auth.user(sid);
      if (path === "/state" && M === "GET") return send(res, 200, { setup: core.users.count() === 0, user });
      if (path === "/setup" && M === "POST") {
        if (core.users.count() > 0) throw new HttpError(400, "Владелец уже заведён, войдите");
        if (!allow("setup:" + ip, 10, 15 * 6e4)) throw new HttpError(429, "Слишком много попыток, подождите 15 минут");
        const b = await body(req);
        if (!sameSecret(String(b.code || "").trim(), setupCode)) throw new HttpError(403, "Код установки не подошёл");
        core.users.add({ login: b.login, name: b.name, role: "owner", pass: b.pass }, "установка");
        setCookie(res, core.auth.login(b.login, b.pass), 90 * 86400);
        return send(res, 200, { ok: true });
      }
      if (path === "/login" && M === "POST") {
        const b = await body(req);
        if (!allow("login:" + ip, 10, 15 * 6e4) || !allow("login:" + String(b.login || "").toLowerCase(), 10, 15 * 6e4)) throw new HttpError(429, "Слишком много попыток, подождите 15 минут");
        const s = core.auth.login(b.login, b.pass);
        if (!s) throw new HttpError(401, "Логин или пароль не подошли");
        setCookie(res, s, 90 * 86400);
        return send(res, 200, { ok: true });
      }
      if (path === "/logout" && M === "POST") { core.auth.logout(sid); setCookie(res, "", 0); return send(res, 200, { ok: true }); }
      if (!user) throw new HttpError(401, "Войдите в панель");
      return send(res, 200, await admin(req, res, path, user));
    }
    throw new HttpError(404, "Нет такого адреса");
  }

  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      if (url.pathname.startsWith("/api/")) return await api(req, res, url);
      if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Метод не поддерживается");
      const p = decodeURIComponent(url.pathname);
      if (p === "/admin" || p === "/admin/") {
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; frame-src https:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        return staticFile(req, res, adminDir, "index.html", "no-cache") || send(res, 404, "Нет панели");
      }
      if (p.startsWith("/admin/")) return staticFile(req, res, adminDir, p.slice(7), "no-cache") || send(res, 404, "Нет файла");
      /* Ключ кадров сцены первого экрана: только своей странице. */
      if (p === "/promo/scene") {
        const site = req.headers["sec-fetch-site"];
        if (!/^[0-9a-f]{64}$/i.test(sceneKey) || (site && site !== "same-origin")) return send(res, 404, "нет");
        res.writeHead(200, { "Content-Type": "application/octet-stream", "Cache-Control": "private, no-store" });
        return res.end(Buffer.from(sceneKey, "hex"));
      }
      const room = /^\/room\/([\w-]{10,40})(?:\/doc\/(\d+))?$/.exec(p);
      if (room) {
        if (!allow("room:" + ipOf(req), 60, 6e4)) return send(res, 429, "Подождите минуту");
        const r = core.ir.open(room[1], Number(room[2]) || 0, ipOf(req));
        const nh = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store", "X-Frame-Options": "DENY" };
        if (room[2]) {
          if (!r?.doc || !irDir) return send(res, 404, "Документа нет", nh);
          return staticFile(req, res, irDir, r.doc.file, "private, no-store", { ...nh, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(r.doc.name || "document.pdf")}` }) || send(res, 404, "Документа нет", nh);
        }
        const html = roomHtml(r);
        res.writeHead(r ? 200 : 404, { ...nh, "Content-Type": MIME[".html"] });
        return res.end(html);
      }
      if (p === "/robots.txt") return send(res, 200, `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /room/\n${publicUrl ? `Sitemap: ${publicUrl}/sitemap.xml\n` : ""}`, { "Content-Type": MIME[".txt"], "Cache-Control": "max-age=3600" });
      if (p === "/sitemap.xml") {
        const urls = [];
        for (const l of ["ru", "uz", "en", "ar"]) for (const pg of SITE_PAGES) if (existsSync(join(siteDir, ...(l === "ru" ? [] : [l]), ...(pg ? [pg] : []), "index.html"))) urls.push(`${publicUrl}/${l === "ru" ? "" : l + "/"}${pg}`);
        return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>\n`, { "Content-Type": MIME[".xml"], "Cache-Control": "max-age=3600" });
      }
      if (p.startsWith("/protos/")) return staticFile(req, res, siteDir, p, "public, max-age=604800") || send(res, 404, "Нет файла");
      if (p.startsWith("/uploads/") && uploadsDir) return staticFile(req, res, uploadsDir, p.slice(9), "public, max-age=31536000, immutable") || send(res, 404, "Нет файла");
      const r = routeOf(p);
      if (r && p !== "/" && p.endsWith("/") && r[1]) { res.writeHead(301, { Location: p.replace(/\/+$/, "") }); return res.end(); }
      if (r) return sendHtml(req, res, page(r[0], r[1]));
      res.writeHead(404, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
      return res.end(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Страница не найдена · CZECHFARM</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#f5f3ee;color:#071a18;text-align:center}a{color:#0b5a53}</style></head><body><main><h1>404</h1><p>Такой страницы нет · Page not found</p><p><a href="/">CZECHFARM alliance</a></p></main></body></html>`);
    } catch (e) {
      const net = e?.name === "TimeoutError" || e?.name === "AbortError" || /fetch failed|ECONN|ENOTFOUND/.test(e?.message || "");
      const code = e instanceof HttpError ? e.code : net ? 502 : /[А-Яа-яЁё]/.test(e?.message || "") ? 400 : 500;
      if (code >= 500) console.error(e);
      return send(res, code, { error: code === 502 ? "Сервис не ответил, попробуйте ещё раз через минуту" : code === 500 ? "Ошибка на сервере, попробуйте ещё раз" : e.message });
    }
  };
}

/* Запуск: node server.mjs (в образе). */
if (import.meta.url === `file://${process.argv[1]}`) {
  const env = process.env, dir = new URL(".", import.meta.url).pathname;
  const publicUrl = (env.PUBLIC_URL || (env.DOMAIN ? `https://${env.DOMAIN}` : "")).replace(/\/$/, "");
  const dataDir = env.DATA_DIR || "/data";
  const db = openDb(join(dataDir, "czechfarm.db"));
  const core = makeCore({ db, secret: env.APP_SECRET, publicUrl });
  const handle = createApp({ core, siteDir: env.SITE_DIR || join(dir, "site"), adminDir: join(dir, "admin"), dataDir, setupCode: env.SETUP_CODE || "", publicUrl, trustProxy: env.TRUST_PROXY === "1", commit: env.COMMIT || "", sceneKey: env.SCENE_KEY || "" });
  const port = Number(env.PORT || 3000);
  /* Рассылки уходят порциями в фоне. */
  setInterval(() => { if (core.aud.bc.pending()) core.aud.bc.tick().catch((e) => console.error("рассылка", e.message)); }, 3000).unref();
  createServer(handle).listen(port, () => console.log(`CZECHFARM: порт ${port}, ${publicUrl || "без адреса"}${core.users.count() ? "" : ", ждёт первого входа по коду установки"}`));
  for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => { db.close(); process.exit(0); });
}
