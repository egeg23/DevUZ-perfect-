// Тот же показ, что scripts/protos/cargopro/serve.mjs, но без бренда клиента:
// для продающей презентации другим карго-компаниям.
import http from "node:http"; import { readFileSync, existsSync } from "node:fs";
const D=new URL("../../scripts/protos/cargopro/",import.meta.url).pathname, PUB=new URL("../../public",import.meta.url).pathname;
const TYPE={".svg":"image/svg+xml",".png":"image/png",".js":"text/javascript",".webp":"image/webp",".mp4":"video/mp4",".bin":"application/octet-stream"};
const LOGO=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 249"><rect width="670" height="249" rx="24" fill="#222d4b"/><circle cx="110" cy="124" r="62" fill="none" stroke="#f08a24" stroke-width="14"/><path d="M80 124h60M110 94v60" stroke="#f6c445" stroke-width="12" stroke-linecap="round"/><text x="200" y="150" font-family="Arial, sans-serif" font-weight="700" font-size="84" fill="#fff">YOUR</text><text x="440" y="150" font-family="Arial, sans-serif" font-weight="400" font-size="84" fill="#f6c445">CARGO</text></svg>`;
const R=[[/CARGO PRO GROUP/g,"YOUR CARGO"],[/info@cargoprogroup\.com/g,"info@yourcargo.uz"],[/cargoprogroup_bot/g,"yourcargo_bot"],[/cargoprogroup\.uz/g,"yourcargo.uz"],[/\+998 78 148 0888/g,"+998 71 200 00 00"],[/\+998781480888/g,"+998712000000"],[/\+998 95 710 0888/g,"+998 90 100 00 00"],[/\+998957100888/g,"+998901000000"],[/\+998 55 515 88 08/g,"+998 90 200 00 00"],[/\+998555158808/g,"+998902000000"],[/Абдуллы Каххара, 56А/g,"Примерная, 1"],[/cargoprogroup/g,"yourcargo"],[/start=cargopro/g,"start=cargo"],[/cargopro\.bitrix24/g,"yourcargo.bitrix24"],[/CPG-/g,"YC-"],[/Abdulla Qahhor ko‘chasi,[^<"]*/g,"Namuna ko‘chasi, 1"]];
http.createServer((req,res)=>{
  const pages=JSON.parse(readFileSync(D+"out/pages.json"));
  const u=new URL(req.url,"http://x");
  if(u.pathname==="/protos/cargopro/logo.webp"){res.setHeader("content-type","image/svg+xml");res.end(LOGO);return}
  if(u.pathname.startsWith("/protos/")&&existsSync(PUB+u.pathname)){res.setHeader("content-type",TYPE[u.pathname.slice(u.pathname.lastIndexOf("."))]||"application/octet-stream");res.end(readFileSync(PUB+u.pathname));return}
  if(/^\/proto\/[A-Za-z0-9_-]{43}\/promo\/scene$/.test(u.pathname)){const k=process.env.SCENE_KEY;if(!k){res.statusCode=404;res.end();return}res.end(Buffer.from(k,"hex"));return}
  const m=u.pathname.match(/^\/proto\/([A-Za-z0-9_-]{43})(?:\/(.*))?$/);
  const key=m?(m[2]||"").replace(/\/$/,""):null;
  if(!m||!(key in pages)){res.statusCode=404;res.end("404");return}
  res.setHeader("content-type","text/html; charset=utf-8");
  let h=pages[key].split("__PROTO_BASE__").join("/proto/"+m[1]).replace(/\/\*~\*\//g,"");
  const names=["Азиз","Нодира","Бахтиёр","Шахло","Рустам","Дилноза","Жасур","Малика","Ойбек","Гулнора","Санжар","Камола","Тимур","Феруза","Улугбек","Лола","Шерзод","Зарина","Фаррух","Мадина","Эльёр","Севара","Бобур","Нигора","Акмаль"];
  const uz=/<html lang="uz"/.test(h);
  const lat=["Aziz","Nodira","Baxtiyor","Shahlo","Rustam","Dilnoza","Jasur","Malika","Oybek","Gulnora","Sanjar","Kamola","Temur","Feruza","Ulug‘bek","Lola","Sherzod","Zarina","Farrux","Madina","Elyor","Sevara","Bobur","Nigora","Akmal"];
  h=h.replace(/\[\[t:(\d+)\]\]/g,(_,n)=>(uz?lat:names)[n%25]);
  for(const [a,b] of R) h=h.replace(a,b);
  res.end(h);
}).listen(4853,()=>console.log("ok"));
