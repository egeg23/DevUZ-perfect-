/**
 * Данные клиента в шаблон — только через эти функции.
 *
 * Всё, что приходит с чужого сайта или из ответа в боте, — текст, а не
 * разметка: экранируется. Адреса — только https и только картинка или
 * наш путь к фото ниши; телефон — цифрами; ник — латиницей. Остальное
 * выбрасывается молча: пустое поле честнее, чем сломанная ссылка.
 */

export const PHONE_DIGITS = 9;

export const esc = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Управляющие и невидимые знаки: строкой, чтобы \u2028 не попал в исходник как перевод строки.
const INVISIBLE = new RegExp("[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069]", "g");

/** Строка без управляющих символов и с ограничением длины. */
export function clean(text: string | null | undefined, max: number): string | null {
  if (typeof text !== "string") return null;
  const out = text
    .replace(INVISIBLE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!out) return null;
  return out.length > max ? `${out.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : out;
}

/** Картинка: https (их сайт), наш путь к фото ниши или маленькая data:image. */
export function imageUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (/^\/protos\/_niche\/[a-z-]+\/[a-z0-9-]+\.webp$/.test(value)) return value;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 90_000) return value;
  if (/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 40_000) {
    // SVG с их сайта может нести скрипт: такой знак не ставим.
    const svg = Buffer.from(value.split(",")[1] ?? "", "base64").toString("utf8");
    return /<script|on[a-z]+\s*=|javascript:|<foreignObject|href\s*=\s*["']?(?!#)/i.test(svg) ? null : value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (value.length > 600) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Цвет #rrggbb, не слишком светлый и не слишком тёмный для кнопки. */
export function brandColor(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(raw.trim());
  if (!m) return null;
  return `#${m[1].toLowerCase()}`;
}

export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < PHONE_DIGITS || digits.length > 15) return null;
  return `tel:+${digits}`;
}

export function handleOf(raw: string | null): string | null {
  if (!raw) return null;
  const m = /^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/|instagram\.com\/|www\.instagram\.com\/)?@?([A-Za-z0-9_.]{3,32})\/?$/.exec(raw.trim());
  return m ? m[1] : null;
}

export function waHref(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= PHONE_DIGITS && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

/** #rrggbb → hsl в целых: так цвет попадает в отпечаток (lib/proto/stamp). */
export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
