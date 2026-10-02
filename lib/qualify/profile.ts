import { readFile } from "node:fs/promises";
import path from "node:path";

import { BOT_AVATAR, BOT_NAME, BOT_PROFILE } from "@/content/bot-profile";
import {
  getMyProfileField,
  setMyProfileField,
  setMyProfilePhoto,
  type BotProfileField,
} from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Профиль бота — имя, описания и аватар — из content/bot-profile.ts.
 *
 * Синхронизируется при каждой выкатке вместе с меню команд
 * (app/api/telegram/menu). Ставится только то, что отличается: у setMyName
 * и соседей жёсткий лимит частоты, и лишний вызов на каждой выкатке однажды
 * упрётся в 429.
 *
 * Аватар — отдельно. Telegram не умеет сравнить картинку и каждую загрузку
 * добавляет в историю фото профиля. Поэтому загруженная версия пишется в
 * stats_snapshots, и фото уходит заново только с новой версией. Нет базы —
 * аватар не трогаем: лучше без нового фото, чем десяток одинаковых.
 */

const AVATAR_KEY = "bot_avatar";

export type FieldChange = { field: BotProfileField; lang: string | null; value: string };

/** Что поменять: всё, что сейчас стоит иначе. null у текущего — Telegram не ответил, не трогаем. */
export function profileChanges(
  current: (field: BotProfileField, lang: string | null) => string | null,
): FieldChange[] {
  const wanted: FieldChange[] = [{ field: "name", lang: null, value: BOT_NAME }];
  for (const { lang, text } of BOT_PROFILE) {
    wanted.push({ field: "short_description", lang, value: text.short });
    wanted.push({ field: "description", lang, value: text.description });
  }
  return wanted.filter((change) => {
    const now = current(change.field, change.lang);
    return now !== null && now !== change.value;
  });
}

export type ProfileSync = {
  ok: boolean;
  changed: string[];
  photo: "set" | "same" | "failed" | "skipped";
};

export async function syncBotProfile(): Promise<ProfileSync> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { ok: false, changed: [], photo: "skipped" };

  const current = new Map<string, string | null>();
  const key = (field: BotProfileField, lang: string | null) => `${field}:${lang ?? ""}`;
  const langs = [null, ...BOT_PROFILE.map((entry) => entry.lang).filter((lang) => lang !== null)];
  for (const lang of langs) {
    for (const field of ["name", "short_description", "description"] as const) {
      if (field === "name" && lang !== null) continue;
      current.set(key(field, lang), await getMyProfileField(field, lang ?? undefined));
    }
  }
  const unread = [...current.values()].filter((value) => value === null).length;

  const changed: string[] = [];
  let failed = unread;
  for (const change of profileChanges((field, lang) => current.get(key(field, lang)) ?? null)) {
    if (await setMyProfileField(change.field, change.value, change.lang ?? undefined)) {
      changed.push(key(change.field, change.lang));
    } else {
      failed++;
    }
  }

  const photo = await syncAvatar();
  return { ok: failed === 0 && photo !== "failed", changed, photo };
}

async function syncAvatar(): Promise<ProfileSync["photo"]> {
  const db = serviceClient();
  if (!db) return "skipped";

  const { data, error } = await db.from("stats_snapshots").select("payload").eq("key", AVATAR_KEY).maybeSingle();
  if (error) {
    console.error("бот: не прочитал версию аватара", error.message);
    return "skipped";
  }
  if ((data?.payload as { version?: string } | null)?.version === BOT_AVATAR.version) return "same";

  let jpeg: Uint8Array<ArrayBuffer>;
  try {
    jpeg = new Uint8Array(await readFile(path.join(process.cwd(), BOT_AVATAR.file)));
  } catch (cause) {
    console.error("бот: нет файла аватара", BOT_AVATAR.file, cause);
    return "failed";
  }
  if (!(await setMyProfilePhoto(jpeg))) return "failed";

  const { error: saveError } = await db
    .from("stats_snapshots")
    .upsert(
      { key: AVATAR_KEY, payload: { version: BOT_AVATAR.version }, computed_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (saveError) console.error("бот: аватар загружен, но версия не записана", saveError.message);
  return "set";
}
