import http from "node:http"; import { readFileSync, existsSync, statSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4812/proto/<43 символа>/
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPES={png:"image/png",webp:"image/webp",mp4:"video/mp4",js:"text/javascript"};
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){
    const f=PUB+u.pathname,size=statSync(f).size;res.setHeader("content-type",TYPES[f.split(".").pop()]||"application/octet-stream");res.setHeader("accept-ranges","bytes");
    const r=/bytes=(\d+)-(\d*)/.exec(req.headers.range||"");
    if(r){const a=+r[1],b=r[2]?+r[2]:size-1;res.statusCode=206;res.setHeader("content-range",`bytes ${a}-${b}/${size}`);res.end(readFileSync(f).subarray(a,b+1));return}
    res.end(readFileSync(f));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]));
}).listen(4812,()=>console.log("ok"));
