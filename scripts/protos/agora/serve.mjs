import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4870/proto/<43 символа>/ (сайт …/site, панель …/panel).
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPE={".svg":"image/svg+xml",".png":"image/png",".js":"text/javascript",".webp":"image/webp",".mp4":"video/mp4"};
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",TYPE[u.pathname.slice(u.pathname.lastIndexOf("."))]||"application/octet-stream");res.end(readFileSync(PUB+u.pathname));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  // Ловушки и метки чисел на сайте заменяет отпечаток; здесь — просто слово.
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]).replace(/\[\[t:(\d+)\]\]/g,"Demo$1").replace(/\/\*~\*\//g,""));
}).listen(4870,()=>console.log("ok"));
