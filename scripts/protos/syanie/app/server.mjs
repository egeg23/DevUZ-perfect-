/* Сервер сайта «Сияние Севера» на сервере клиники: сайт, админка и вебхуки
   одним процессом на node:http, без фреймворка. Образ собирает GitHub
   (.github/workflows/syanie-app.yml), сервер клиники его только запускает. */
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { openDb } from "./lib/db.mjs";
import { makeCore, ROLES } from "./lib/core.mjs";
import { sameSecret } from "./lib/crypt.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};
const COOKIE = "sy_s";

/* Простой счётчик попыток по ключу: окно и потолок. */
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

export function createApp({ core, siteDir, adminDir, setupCode = "", publicUrl = "", trustProxy = false, commit = "" }) {
  const allow = limiter();
  const ipOf = (req) => (trustProxy && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "?";
  const cookies = (req) => Object.fromEntries(String(req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((x) => x[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]));
  const secure = publicUrl.startsWith("https://");
  const setCookie = (res, v, age) => res.setHeader("Set-Cookie", `${COOKIE}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`);

  function send(res, code, body, headers = {}) {
    const json = typeof body !== "string";
    res.writeHead(code, { "Content-Type": json ? MIME[".json"] : "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers });
    res.end(json ? JSON.stringify(body) : body);
  }

  async function body(req, limit = 64 * 1024) {
    let size = 0; const parts = [];
    for await (const ch of req) { size += ch.length; if (size > limit) throw new HttpError(413, "Слишком большой запрос"); parts.push(ch); }
    if (!size) return {};
    try { return JSON.parse(Buffer.concat(parts).toString("utf8")); } catch { throw new HttpError(400, "Ожидался JSON"); }
  }

  function staticFile(req, res, root, rel, cache) {
    const base = resolve(root), file = normalize(join(base, rel));
    if (file !== base && !file.startsWith(base + sep)) return false;
    if (!existsSync(file) || !statSync(file).isFile()) return false;
    const st = statSync(file), type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
    const h = { "Content-Type": type, "Cache-Control": cache, "Accept-Ranges": "bytes", "Last-Modified": st.mtime.toUTCString(), "X-Content-Type-Options": "nosniff" };
    /* Видео на iPhone идёт кусками: без Range Safari его не играет. */
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    if (m && (m[1] || m[2])) {
      let a = m[1] ? Number(m[1]) : st.size - Number(m[2]), b = m[1] && m[2] ? Number(m[2]) : st.size - 1;
      if (a < 0) a = 0;
      if (a >= st.size || b < a) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); res.end(); return true; }
      b = Math.min(b, st.size - 1);
      res.writeHead(206, { ...h, "Content-Range": `bytes ${a}-${b}/${st.size}`, "Content-Length": b - a + 1 });
      if (req.method === "HEAD") return res.end(), true;
      createReadStream(file, { start: a, end: b }).pipe(res); return true;
    }
    res.writeHead(200, { ...h, "Content-Length": st.size });
    if (req.method === "HEAD") return res.end(), true;
    createReadStream(file).pipe(res); return true;
  }

  /* Страницы сайта в образе не меняются: читаем один раз, адрес сайта
     (__SITE_URL__ в canonical и og) ставим из PUBLIC_URL, сжатую копию держим рядом. */
  const pages = new Map();
  function page(name) {
    if (!pages.has(name)) {
      const f = join(siteDir, name), html = existsSync(f) ? readFileSync(f, "utf8").split("__SITE_URL__").join(publicUrl) : "";
      pages.set(name, html && { html, gz: gzipSync(html) });
    }
    return pages.get(name);
  }
  function sendPage(req, res, name, code = 200) {
    const pg = page(name);
    if (!pg) return send(res, code, code === 404 ? "Страница не найдена" : "Сайт ещё собирается");
    const h = { "Content-Type": MIME[".html"], "Cache-Control": "no-cache", Vary: "Accept-Encoding" };
    if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || ""))) { res.writeHead(code, { ...h, "Content-Encoding": "gzip", "Content-Length": pg.gz.length }); return res.end(req.method === "HEAD" ? undefined : pg.gz); }
    res.writeHead(code, { ...h, "Content-Length": Buffer.byteLength(pg.html) }); res.end(req.method === "HEAD" ? undefined : pg.html);
  }

  async function admin(req, res, path, user) {
    const M = req.method, id = Number((/\/(\d+)(?:\/|$)/.exec(path) || [])[1]) || 0, who = user.name;
    const owner = () => { if (user.role !== "owner") throw new HttpError(403, "Это может только главный врач"); };
    if (M === "GET" && path === "/summary") return core.summary();
    if (M === "GET" && path === "/leads") return { leads: core.leads.list(), roles: ROLES };
    if (M === "GET" && /^\/leads\/\d+$/.test(path)) { const l = core.leads.get(id); if (!l) throw new HttpError(404, "Нет такой заявки"); return l; }
    if (M === "POST" && /^\/leads\/\d+$/.test(path)) { const b = await body(req); if (b.status) core.leads.setStatus(id, b.status, who); if (typeof b.note === "string") core.leads.setNote(id, b.note, who); return core.leads.get(id); }
    if (M === "POST" && /^\/leads\/\d+\/amo$/.test(path)) return { deal: await core.leads.toAmo(id, who) };
    if (M === "GET" && path === "/inbox") return { convs: core.inbox.list() };
    if (M === "GET" && /^\/inbox\/\d+$/.test(path)) { const c = core.inbox.get(id); if (!c) throw new HttpError(404, "Нет такого диалога"); return c; }
    if (M === "POST" && /^\/inbox\/\d+$/.test(path)) { const b = await body(req); await core.inbox.reply(id, b.text, who); return core.inbox.get(id); }
    if (M === "POST" && /^\/inbox\/\d+\/lead$/.test(path)) return { lead: await core.inbox.toLead(id, who) };
    if (M === "GET" && path === "/settings") return core.settingsView();
    if (M === "POST" && /^\/connect\/(amo|tg|wz)$/.test(path)) { owner(); const b = await body(req); return await core.connect[path.slice(9)](b, who); }
    if (M === "POST" && /^\/connect\/(amo|tg|wz)\/off$/.test(path)) { owner(); await core.connect.off(path.split("/")[2], who); return core.settingsView(); }
    if (M === "GET" && path === "/amo/pipelines") return { pipelines: await core.connect.amoPipelines() };
    if (M === "POST" && path === "/amo/options") { owner(); core.connect.amoOptions(await body(req), who); return core.settingsView(); }
    if (M === "POST" && path === "/tg/link") return { url: core.connect.tgLink(user.id) };
    if (M === "GET" && path === "/users") return { users: core.users.list(), roles: ROLES };
    if (M === "POST" && path === "/users") { owner(); const b = await body(req); core.users.add(b, who); return { users: core.users.list() }; }
    if (M === "POST" && /^\/users\/\d+\/off$/.test(path)) { owner(); if (id === user.id) throw new HttpError(400, "Себя отключить нельзя"); core.users.disable(id, who); return { users: core.users.list() }; }
    if (M === "POST" && /^\/users\/\d+\/pass$/.test(path)) { owner(); const b = await body(req); core.users.setPass(id, b.pass, who); return { ok: true }; }
    if (M === "POST" && path === "/me/pass") { const b = await body(req); if (!core.auth.check(user.login, b.old)) throw new HttpError(400, "Текущий пароль не подошёл"); core.users.setPass(user.id, b.pass, who); return { ok: true, relogin: true }; }
    if (M === "GET" && path === "/log") return { log: core.log() };
    throw new HttpError(404, "Нет такого адреса");
  }

  async function api(req, res, url) {
    const p = url.pathname, M = req.method, ip = ipOf(req);
    if (p === "/api/health") return send(res, 200, { ok: true, commit });

    /* ── Сайт: заявки и чат ─────────────────────────────────────── */
    if (p === "/api/lead" && M === "POST") {
      if (!allow("lead:" + ip, 6, 10 * 6e4)) throw new HttpError(429, "Слишком много заявок подряд. Позвоните нам, пожалуйста");
      const b = await body(req, 8 * 1024);
      if (b.website) return send(res, 200, { id: 0, key: "" });
      return send(res, 200, await core.leads.add({ src: b.src, name: b.name, phone: b.phone, what: b.what, wish: b.wish }));
    }
    const ls = /^\/api\/lead\/(\d+)$/.exec(p);
    if (ls && M === "GET") { const st = core.leads.statusFor(Number(ls[1]), url.searchParams.get("k") || ""); return send(res, st ? 200 : 404, st ? { status: st } : { error: "нет" }); }
    if (p === "/api/chat" && M === "POST") {
      if (!allow("chat:" + ip, 30, 10 * 6e4)) throw new HttpError(429, "Слишком много сообщений подряд");
      const b = await body(req, 8 * 1024);
      await core.siteChat.send(b.sid, b.text, b.name);
      return send(res, 200, { ok: true });
    }
    if (p === "/api/chat" && M === "GET") {
      if (!allow("poll:" + ip, 120, 6e4)) throw new HttpError(429, "Подождите минуту");
      return send(res, 200, { msgs: core.siteChat.poll(url.searchParams.get("sid") || "", url.searchParams.get("after")) });
    }

    /* ── Вебхуки ─────────────────────────────────────────────────── */
    if (p === "/api/tg/hook" && M === "POST") {
      if (!sameSecret(req.headers["x-telegram-bot-api-secret-token"], core.tgSecret())) throw new HttpError(403, "нет");
      await core.tgUpdate(await body(req, 512 * 1024)).catch((e) => console.error("tg", e.message));
      return send(res, 200, { ok: true });
    }
    const wh = /^\/api\/wazzup\/([\w-]+)$/.exec(p);
    if (wh && M === "POST") {
      if (!sameSecret(wh[1], core.wzSecret())) throw new HttpError(403, "нет");
      await core.wzHook(await body(req, 2 * 1024 * 1024)).catch((e) => console.error("wazzup", e.message));
      return send(res, 200, { ok: true });
    }

    /* ── Админка ─────────────────────────────────────────────────── */
    if (p.startsWith("/api/admin/")) {
      const path = p.slice(10);
      if (M === "POST") {
        /* Чужой сайт не отправит заголовок X-SY без разрешения CORS. */
        if (req.headers["x-sy"] !== "1") throw new HttpError(403, "Запрос не из админки");
        const o = req.headers.origin; if (o && publicUrl && o !== publicUrl) throw new HttpError(403, "Запрос не из админки");
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
      if (!user) throw new HttpError(401, "Войдите в админку");
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
        res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        return staticFile(req, res, adminDir, "index.html", "no-cache") || send(res, 404, "Нет админки");
      }
      if (p.startsWith("/admin/")) return staticFile(req, res, adminDir, p.slice(7), "no-cache") || send(res, 404, "Нет файла");
      if (p === "/robots.txt") return send(res, 200, `User-agent: *\nDisallow: /admin\nDisallow: /api/\n${publicUrl ? `Sitemap: ${publicUrl}/sitemap.xml\n` : ""}`, { "Content-Type": MIME[".txt"], "Cache-Control": "max-age=3600" });
      if (p === "/sitemap.xml") return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicUrl || ""}/</loc></url><url><loc>${publicUrl || ""}/privacy</loc></url></urlset>\n`, { "Content-Type": MIME[".xml"], "Cache-Control": "max-age=3600" });
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      if (p === "/" || p === "/index.html") return sendPage(req, res, "index.html");
      if (p === "/privacy" || p === "/privacy/") return sendPage(req, res, "privacy.html");
      if (p.startsWith("/protos/")) return staticFile(req, res, siteDir, p, "public, max-age=604800") || send(res, 404, "Нет файла");
      return sendPage(req, res, "404.html", 404);
    } catch (e) {
      /* Наши ошибки написаны по-русски — их показываем; чужие (сеть, код) — нет. */
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
  const db = openDb(join(env.DATA_DIR || "/data", "syanie.db"));
  const core = makeCore({ db, secret: env.APP_SECRET, publicUrl });
  const handle = createApp({ core, siteDir: env.SITE_DIR || join(dir, "site"), adminDir: join(dir, "admin"), setupCode: env.SETUP_CODE || "", publicUrl, trustProxy: env.TRUST_PROXY === "1", commit: env.COMMIT || "" });
  const port = Number(env.PORT || 3000);
  createServer(handle).listen(port, () => console.log(`Сияние Севера: порт ${port}, ${publicUrl || "без адреса"}${core.users.count() ? "" : ", ждёт первого входа по коду установки"}`));
  for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => { db.close(); process.exit(0); });
}
