import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4790/proto/<43 символа>/
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPES={manifest:"application/manifest+json",sw:"text/javascript"};
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",u.pathname.endsWith(".png")?"image/png":"image/webp");res.end(readFileSync(PUB+u.pathname));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  const last=key.split("/").pop();
  res.setHeader("content-type",(TYPES[last]||"text/html")+"; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]));
}).listen(4790,()=>console.log("ok"));
