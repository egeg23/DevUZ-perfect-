/**
 * Защита от SSRF: посетитель даёт адрес, сервер по нему идёт.
 *
 * Это самое опасное место аудитора. Без проверки любой желающий заставит наш
 * контейнер сходить на `http://127.0.0.1:3000/api/...`, на приватную сеть
 * хостера или на метаданные облака — и мы вернём ему ответ в отчёте. Поэтому
 * адрес проверяется дважды: до запроса и на каждом редиректе, потому что
 * публичный домен волен ответить `302` на `http://169.254.169.254/`.
 *
 * Резолвим имя сами и сверяем именно те адреса, по которым пойдём. Проверять
 * строку хоста бесполезно: `db.internal.example.com` выглядит публичным, а
 * указывает в 10.0.0.0/8.
 */
import { lookup } from "node:dns/promises";
import net from "node:net";

// Разбор адреса переехал в lib/audit/url.ts: он чистый, и его импортирует
// браузер. Реэкспорт оставлен намеренно — все, кто звал normalizeUrl отсюда,
// продолжают работать, и точка входа в защиту остаётся одна.
export {
  BlockedAddress,
  normalizeUrl,
  type GuardFailure,
} from "@/lib/audit/url";

import { BlockedAddress, portAllowed } from "@/lib/audit/url";


/**
 * Диапазоны, куда ходить нельзя.
 *
 * CGNAT (100.64/10) в списке не для симметрии: у мобильных операторов за ним
 * живёт вся абонентская сеть, и запрос туда из дата-центра — это запрос в
 * чужую внутреннюю инфраструктуру.
 */
function isPrivateV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;              // link-local и метаданные облаков
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;                // IETF-назначенные
  if (a === 198 && (b === 18 || b === 19)) return true; // стенды для замеров, бывают внутри сетей
  if (a === 100 && b >= 64 && b <= 127) return true;    // CGNAT
  if (a >= 224) return true;                            // multicast и зарезервированное
  return false;
}

/** IPv6 целиком, восемью группами: короткая запись «::» и хвост a.b.c.d раскрыты. */
function expandV6(ip: string): number[] | null {
  let v = ip.toLowerCase().split("%")[0];
  const dotted = v.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const p = dotted[2].split(".").map(Number);
    if (p.some((n) => !Number.isInteger(n) || n > 255)) return null;
    v = `${dotted[1]}${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const halves = v.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...tail];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
}

const v4Of = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

function isPrivateV6(ip: string): boolean {
  const g = expandV6(ip);
  if (!g) return true;
  const zeroTo = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (zeroTo(8)) return true;                                  // ::
  if (zeroTo(7) && g[7] === 1) return true;                    // ::1
  // v4 внутри v6 обязан проверяться как v4, в любой записи — ::ffff:10.0.0.1
  // и ::ffff:a00:1 одно и то же, иначе это готовый обход всей проверки выше.
  if (zeroTo(5) && g[5] === 0xffff) return isPrivateV4(v4Of(g[6], g[7]));   // ::ffff:0:0/96
  if (zeroTo(6)) return true;                                  // ::a.b.c.d, устаревшая запись
  if (g[0] === 0x64 && g[1] === 0xff9b) return true;           // NAT64: шлюз ходит за нас по v4
  if (g[0] === 0x2002) return isPrivateV4(v4Of(g[1], g[2]));   // 6to4 несёт v4 внутри
  if (g[0] === 0x2001 && g[1] === 0) return true;              // Teredo
  if ((g[0] & 0xfe00) === 0xfc00) return true;                 // fc00::/7, уникальные локальные
  if ((g[0] & 0xffc0) === 0xfe80) return true;                 // fe80::/10, link-local
  if ((g[0] & 0xff00) === 0xff00) return true;                 // multicast
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateV4(ip);
  if (family === 6) return isPrivateV6(ip);
  return true; // не адрес — считаем опасным
}


/**
 * Резолвит имя и возвращает адрес, по которому можно идти.
 *
 * Возвращается именно IP, а не имя: между проверкой и запросом DNS успевает
 * смениться, и это не теория — на этом строится классический обход
 * (DNS rebinding). Подключаться нужно к проверенному адресу, подставляя имя
 * в заголовок Host и в SNI.
 */
export async function resolveSafely(url: URL): Promise<string> {
  // Схема и порт — здесь же, а не только в normalizeUrl: часть адресов
  // (ссылки со страниц, robots.txt, повторная проверка) приходит сюда без
  // него, и «тот же хост, другой порт» вёл бы в любую службу на том же IP.
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new BlockedAddress("scheme", url.protocol);
  if (!portAllowed(url.port)) throw new BlockedAddress("port", url.port);
  // URL держит IPv6 в скобках: «[::1]». Без них net.isIP узнаёт адрес.
  const host = url.hostname.replace(/^\[(.*)\]$/, "$1");

  // Литеральный адрес проверяем как есть — резолвить нечего.
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new BlockedAddress("private", host);
    return host;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new BlockedAddress("dns", host);
  }
  if (!addresses.length) throw new BlockedAddress("dns", host);

  // Достаточно одного внутреннего адреса, чтобы отказать: имя, которое
  // резолвится и наружу, и внутрь, — это ровно тот случай, против которого
  // всё написано.
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) throw new BlockedAddress("private", `${host} → ${address}`);
  }
  return addresses[0].address;
}
