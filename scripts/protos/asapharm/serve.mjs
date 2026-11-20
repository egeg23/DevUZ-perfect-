import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4797/proto/<43 символа>/
// Ловушки [[t:N]] здесь — просто слово «Образец»: на сайте их ставит отпечаток.
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPES={webp:"image/webp",png:"image/png",mp4:"video/mp4",js:"text/javascript"};
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",TYPES[u.pathname.split(".").pop()]||"application/octet-stream");res.end(readFileSync(PUB+u.pathname));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]).replace(/\[\[t:\d+\]\]/g,"Образец").replace(/\/\*~\*\//g,""));
}).listen(4797,()=>console.log("ok"));
