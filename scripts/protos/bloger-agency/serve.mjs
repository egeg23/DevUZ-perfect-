import http from "node:http"; import { readFileSync } from "node:fs";
const D=new URL(".",import.meta.url).pathname;
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname==="/api/proto-ai"){res.setHeader("content-type","application/json");res.end(JSON.stringify({fallback:true}));return}
  if(u.pathname==="/gf.css"){res.setHeader("content-type","text/css");res.end(readFileSync(D+"gf/local.css"));return}
  if(u.pathname.startsWith("/gf/")){res.setHeader("content-type","font/woff2");res.end(readFileSync(D+u.pathname.slice(1)));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]).replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/g,"/gf.css"));
}).listen(4789,()=>console.log("ok"));
