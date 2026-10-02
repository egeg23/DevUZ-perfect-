import { cookies } from "next/headers";

import { signIn } from "./actions";
import { loginDict } from "@/content/admin-panel/login";
import { company } from "@/content/company";
import { PANEL_LANG_COOKIE, panelLocale, pick } from "@/lib/admin/i18n";

export const dynamic = "force-dynamic";

/**
 * Вход в панель. Ни поля пароля, ни поля почты здесь нет и не появится:
 * пароли у небольшой команды заканчиваются одинаково — общим паролем в
 * закреплённом сообщении. Единственный вход — команда /login боту, который
 * уже знает, кто ему пишет.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; e?: string }>;
}) {
  const { t: token, e: error } = await searchParams;
  // Сотрудника ещё нет — язык из куки-зеркала, без неё русский.
  const t = pick(loginDict, panelLocale((await cookies()).get(PANEL_LANG_COOKIE)?.value));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
        DevUz Studio
      </p>
      <h1 className="mt-3 text-2xl font-semibold">{t.title}</h1>

      {error ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          {error === "3" ? t.tooMany : error === "2" ? t.offline : error === "4" ? t.spent : t.broken}
        </p>
      ) : null}

      {token ? (
        <form action={signIn} className="mt-8">
          <input type="hidden" name="t" value={token} />
          <button
            type="submit"
            className="w-full rounded-xl bg-green px-5 py-3 text-sm font-semibold text-ink transition hover:bg-green-dim"
          >
            {t.signIn}
          </button>
          <p className="mt-3 text-xs text-faint">{t.burns}</p>
        </form>
      ) : (
        <>
          {/*
            Кнопка ведёт в бота с командой входа уже внутри: Telegram
            открывает чат и сам отправляет /start login, а бот отвечает
            ссылкой. Раньше здесь была инструкция из трёх пунктов, и два
            из них человек выполнял руками — найти чат и набрать команду.
          */}
          <a
            href={`https://t.me/${company.telegram}?start=login`}
            className="mt-8 block w-full rounded-xl bg-green px-5 py-3 text-center text-sm font-semibold text-ink transition hover:bg-green-dim"
          >
            {t.getLink}
          </a>
          <p className="mt-3 text-xs text-faint">
            {t.hintBefore}{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text">/login</code>
            {t.hintAfter}
          </p>
        </>
      )}
    </main>
  );
}
