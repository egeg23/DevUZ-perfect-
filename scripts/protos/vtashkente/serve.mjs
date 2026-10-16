import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4821/proto/<43 символа>/
const D = new URL(".", import.meta.url).pathname, PUB = new URL("../../../public", import.meta.url).pathname;
const TYPES = { png: "image/png", webp: "image/webp", jpg: "image/jpeg" };
http.createServer((req, res) => {
  const pages = JSON.parse(readFileSync(D + "out/pages.json"));
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/protos/") && existsSync(PUB + u.pathname)) { res.setHeader("content-type", TYPES[u.pathname.split(".").pop()] || "application/octet-stream"); res.end(readFileSync(PUB + u.pathname)); return; }
  const m = u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key = m ? (m[2] || "").replace(/\/$/, "") : null;
  if (!m || !(key in pages)) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/" + m[1]));
}).listen(4821, () => console.log("ok"));
