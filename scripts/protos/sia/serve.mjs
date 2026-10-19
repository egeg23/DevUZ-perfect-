import http from "node:http"; import { readFileSync, existsSync, statSync } from "node:fs";
// Локальный показ: node serve.mjs, затем http://localhost:4813/proto/<43 символа>/
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
  // Промо: ключ — из PROMO_KEY_SIA (hex), как отдаёт его маршрут макета (lib/proto/promo).
  const pm=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})\/promo\/(index\.m3u8|key)$/);
  if(pm){const K=process.env.PROMO_KEY_SIA||"";if(!/^[0-9a-f]{32}$/.test(K)){res.statusCode=404;res.end();return}
    if(pm[2]==="key"){res.setHeader("content-type","application/octet-stream");res.end(Buffer.from(K,"hex"));return}
    const n=[...Array(40).keys()].filter(i=>existsSync(`${PUB}/protos/sia/promo/p${i}.ts`)).length;
    res.setHeader("content-type","application/vnd.apple.mpegurl");
    res.end(["#EXTM3U","#EXT-X-VERSION:3","#EXT-X-PLAYLIST-TYPE:VOD","#EXT-X-TARGETDURATION:4","#EXT-X-MEDIA-SEQUENCE:0",`#EXT-X-KEY:METHOD=AES-128,URI="/proto/${pm[1]}/promo/key",IV=0x${"0".repeat(32)}`,...[...Array(n).keys()].flatMap(i=>["#EXTINF:4.000,",`/protos/sia/promo/p${i}.ts`]),"#EXT-X-ENDLIST",""].join("\n"));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  res.end(pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]));
}).listen(4813,()=>console.log("ok"));
