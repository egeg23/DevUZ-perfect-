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

import { BlockedAddress } from "@/lib/audit/url";


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
  if (a === 100 && b >= 64 && b <= 127) return true;    // CGNAT
  if (a >= 224) return true;                            // multicast и зарезервированное
  return false;
}

function isPrivateV6(ip: string): boolean {
  const v = ip.toLowerCase().split("%")[0];
  if (v === "::" || v === "::1") return true;
  // v4, завёрнутый в v6: ::ffff:10.0.0.1 обязан проверяться как v4, иначе
  // это готовый обход всей проверки выше.
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  if (/^f[cd]/.test(v)) return true;                    // fc00::/7, уникальные локальные
  if (/^fe[89ab]/.test(v)) return true;                 // fe80::/10, link-local
  if (/^ff/.test(v)) return true;                       // multicast
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
  const host = url.hostname;

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
