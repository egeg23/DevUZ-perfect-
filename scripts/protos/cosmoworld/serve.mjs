import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: SCENE_KEY=<64 hex> node serve.mjs, затем http://localhost:4832/proto/<43 символа>/
// Ключ сцены отдаётся так же, как на сайте: /proto/<токен>/promo/scene (lib/proto/promo-store).
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPE={".svg":"image/svg+xml",".png":"image/png",".js":"text/javascript",".webp":"image/webp",".mp4":"video/mp4",".bin":"application/octet-stream"};
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",TYPE[u.pathname.slice(u.pathname.lastIndexOf("."))]||"application/octet-stream");res.end(readFileSync(PUB+u.pathname));return}
  if(/^\/proto\/[A-Za-z0-9_-]{43}\/promo\/scene$/.test(u.pathname)){const k=process.env.SCENE_KEY;if(!k){res.statusCode=404;res.end();return}res.end(Buffer.from(k,"hex"));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]));
}).listen(4832,()=>console.log("ok"));
