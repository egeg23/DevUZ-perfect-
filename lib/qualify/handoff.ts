import { locales, type Locale } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/qualify/types";

/**
 * Разговор, живущий сразу в двух местах.
 *
 * Человек начинает в чате на сайте, а дописывает в Telegram — и это должен
 * быть один разговор, а не два знакомства подряд. Поэтому сайт кладёт сюда
 * переписку и отдаёт короткий токен, а бот по нему поднимает контекст в тот
 * момент, когда посетитель нажимает «Старт».
 *
 * Хранилище — память процесса. Осознанный выбор: окно между «нажал кнопку на
 * сайте» и «нажал Старт в Telegram» измеряется секундами, ради него не стоит
 * заводить таблицу. Перезапуск контейнера теряет незабранные передачи — бот в
 * этом случае просто здоровается заново и переспрашивает, что было; это
 * заметно хуже, чем продолжить, но не ломает ничего.
 */
export type BotSession = {
  locale: Locale;
  transcript: ChatMessage[];
  /** Бриф по этому разговору уже ушёл менеджеру. */
  qualified: boolean;
  requestNo?: string;
  /** Сработала гарантия двадцати секунд — скидка уже подтверждена. */
  discount: boolean;
  /** Разговор пришёл с сайта, а не начался в боте. */
  fromSite: boolean;
  /** Приветствие-продолжение уже отправлено. */
  resumed: boolean;
  updatedAt: number;
};

type PendingHandoff = {
  session: BotSession;
  createdAt: number;
};

/** Токен передачи живёт недолго: его используют сразу или не используют вовсе. */
const HANDOFF_TTL_MS = 60 * 60 * 1000;
/** Разговор в боте — дольше: человек может ответить и на следующий день. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const pending = new Map<string, PendingHandoff>();
const byChat = new Map<number, BotSession>();

/**
 * Алфавит токена — без символов, которые Telegram не пропустит в параметре
 * start: там допустимы только буквы, цифры, дефис и подчёркивание.
 */
const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function newToken(locale: Locale): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
  // Локаль едет прямо в токене. Сессия живёт в памяти процесса и переживает
  // ни перезапуск контейнера, ни час ожидания: если человек открыл Telegram
  // позже или мы как раз выкатили деплой, переписку восстановить нельзя — но
  // язык, на котором он с нами говорил, знать всё ещё нужно. Иначе бот
  // здоровается на языке его мессенджера, а не сайта.
  return `${locale}-${out}`;
}

/** Локаль из токена: работает даже когда сессия уже не существует. */
export function localeFromToken(token: string): Locale | null {
  const prefix = token.split("-")[0];
  return locales.includes(prefix as Locale) ? (prefix as Locale) : null;
}

function sweep(): void {
  const now = Date.now();
  for (const [token, item] of pending) {
    if (now - item.createdAt > HANDOFF_TTL_MS) pending.delete(token);
  }
  for (const [chatId, session] of byChat) {
    if (now - session.updatedAt > SESSION_TTL_MS) byChat.delete(chatId);
  }
}

/** Сайт передаёт разговор боту и получает токен для ссылки t.me. */
export function createHandoff(input: {
  locale: Locale;
  transcript: ChatMessage[];
  qualified: boolean;
  requestNo?: string;
  discount: boolean;
}): string {
  sweep();

  // Ограничение сверху — защита от того, чтобы одна вкладка не сложила в
  // память процесса мегабайты переписки.
  if (pending.size > 500) {
    const oldest = [...pending.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) pending.delete(oldest[0]);
  }

  const token = newToken(input.locale);
  pending.set(token, {
    createdAt: Date.now(),
    session: {
      locale: input.locale,
      transcript: input.transcript,
      qualified: input.qualified,
      requestNo: input.requestNo,
      discount: input.discount,
      fromSite: true,
      resumed: false,
      updatedAt: Date.now(),
    },
  });
  return token;
}

/**
 * Бот забирает переданный разговор и привязывает его к чату.
 *
 * Токен одноразовый: он уходит в открытую ссылку, которой человек может
 * поделиться, и второй желающий не должен получить чужую переписку.
 */
export function claimHandoff(token: string, chatId: number): BotSession | null {
  sweep();
  const item = pending.get(token);
  if (!item) return null;

  pending.delete(token);
  const session = { ...item.session, updatedAt: Date.now() };
  byChat.set(chatId, session);
  return session;
}

export function sessionFor(chatId: number): BotSession | null {
  const session = byChat.get(chatId);
  if (!session) return null;
  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    byChat.delete(chatId);
    return null;
  }
  return session;
}

/** Разговор человека, который пришёл в бота сам, минуя сайт. */
export function startSession(chatId: number, locale: Locale): BotSession {
  sweep();
  const session: BotSession = {
    locale,
    transcript: [],
    qualified: false,
    discount: false,
    fromSite: false,
    resumed: true,
    updatedAt: Date.now(),
  };
  byChat.set(chatId, session);
  return session;
}

export function saveSession(chatId: number, session: BotSession): void {
  byChat.set(chatId, { ...session, updatedAt: Date.now() });
}

export function forgetSession(chatId: number): void {
  byChat.delete(chatId);
}
