/**
 * Адрес, пригодный для колонки inet.
 *
 * Postgres принимает в inet только настоящий адрес и отвергает всю вставку,
 * если строка ему не понравилась. Проверка «состоит из цифр и точек»
 * пропускала «1.2.3.4.5» и «999.1.1.1» — и такая строка роняла запись
 * целиком: заявка на покупку теряла строку в базе, а строка журнала не
 * появлялась вовсе. Молча, потому что ошибку вставки мы намеренно не
 * показываем пользователю.
 *
 * Возвращает null для всего, в чём не уверены. Потерять адрес в
 * диагностике не страшно; потерять из-за него заявку — страшно.
 */
export function asInet(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text || text.length > 45) return null;

  if (isIpv4(text)) return text;
  if (isIpv6(text)) return text;
  return null;
}

function isIpv4(text: string): boolean {
  const parts = text.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    // Ведущие нули Postgres принимает, но «08» в других местах читается как
    // восьмеричное — не тот разнобой, который стоит тащить в базу.
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith("0")) return false;
    return Number(part) <= 255;
  });
}

function isIpv6(text: string): boolean {
  if (!text.includes(":")) return false;
  if (!/^[0-9a-f:.]+$/i.test(text)) return false;

  // Сокращение «::» допускается ровно одно — это правило самой записи.
  const doubles = text.split("::").length - 1;
  if (doubles > 1) return false;

  // Хвост вида ::ffff:192.168.0.1 — обычный способ записать v4 внутри v6.
  const [head, tail] = splitMapped(text);
  if (tail && !isIpv4(tail)) return false;

  const groups = head.split(":").filter((group) => group !== "");
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return false;

  const max = tail ? 6 : 8;
  if (doubles === 0) return groups.length === max;
  return groups.length < max;
}

function splitMapped(text: string): [string, string | null] {
  const lastColon = text.lastIndexOf(":");
  const tail = text.slice(lastColon + 1);
  if (tail.includes(".")) return [text.slice(0, lastColon + 1), tail];
  return [text, null];
}
