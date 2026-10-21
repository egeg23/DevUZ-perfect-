import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4831/proto/<43 символа>/
const D=new URL(".",import.meta.url).pathname, PUB=new URL("../../../public",import.meta.url).pathname;
const TYPE={".png":"image/png",".js":"text/javascript",".mp4":"video/mp4",".glb":"model/gltf-binary",".webp":"image/webp",".html":"text/html; charset=utf-8"};
http.createServer((req,res)=>{
  const u=new URL(req.url,"http://x");
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",TYPE[u.pathname.slice(u.pathname.lastIndexOf("."))]||"application/octet-stream");res.end(readFileSync(PUB+u.pathname));return}
  if(u.pathname==="/still"){res.setHeader("content-type",TYPE[".html"]);res.end(readFileSync(D+"still.html"));return}
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type",TYPE[".html"]);
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]));
}).listen(4831,()=>console.log("ok"));
