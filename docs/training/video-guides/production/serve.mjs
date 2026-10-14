import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
const R="/home/user/DevUZ-perfect-", PUB=R+"/public";
const TOK="A".repeat(43);
const load=n=>{const b=JSON.parse(readFileSync(`${R}/content/proto-bundles/${n}.json`));const fill=p=>Object.entries(b.parts).reduce((o,[k,v])=>o.split(`@@${k}@@`).join(v),p);const o={};for(const[k,v]of Object.entries(b.pages))o[k]=fill(v);return o};
const B={asmo:load("asmo"),pkvesta:load("pkvesta")};
const ct=p=>p.endsWith(".png")?"image/png":p.endsWith(".jpg")||p.endsWith(".jpeg")?"image/jpeg":p.endsWith(".svg")?"image/svg+xml":p.endsWith(".mp4")?"video/mp4":p.endsWith(".js")?"text/javascript":p.endsWith(".css")?"text/css":"image/webp";
http.createServer((req,res)=>{const u=new URL(req.url,"http://x");const p=decodeURIComponent(u.pathname);
 if(!p.includes("..")&&existsSync(PUB+p)&&!p.endsWith("/")){res.setHeader("content-type",ct(p));res.end(readFileSync(PUB+p));return}
 const m=p.match(/^\/(\w+)\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
 const pages=m&&B[m[1]];const key=m?(m[3]||"").replace(/\/$/,""):null;
 if(!pages||!(key in pages)){console.log("404",p);res.statusCode=404;res.end("404");return}
 res.setHeader("content-type","text/html; charset=utf-8");res.end(pages[key].split("__PROTO_BASE__").join(`/${m[1]}/proto/${m[2]}`));
}).listen(4811,()=>console.log("ok"));
