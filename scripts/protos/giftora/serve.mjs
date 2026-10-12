import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4796/proto/<43 символа>/
const D = new URL(".", import.meta.url).pathname, PUB = new URL("../../../public", import.meta.url).pathname;
http.createServer((req, res) => {
  const pages = JSON.parse(readFileSync(D + "out/pages.json"));
  const u = new URL(req.url, "http://x");
  const m = u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key = m ? (m[2] || "").replace(/\/$/, "") : null;
  if (u.pathname.startsWith("/protos/") && existsSync(PUB + u.pathname)) { res.setHeader("content-type", "image/webp"); res.setHeader("cache-control", "max-age=3600"); res.end(readFileSync(PUB + u.pathname)); return; }
  if (u.pathname === "/favicon.ico") { res.statusCode = 204; res.end(); return; }
  if (!m || !(key in pages)) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/" + m[1]));
}).listen(4796, () => console.log("ok"));
