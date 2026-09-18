import { signIn } from "./actions";
import { company } from "@/content/company";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
        DevUz Studio
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Вход в панель</h1>

      {error ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          {error === "3"
            ? "Слишком много попыток. Подождите десять минут."
            : error === "2"
              ? "База недоступна — войти сейчас нельзя. Попробуйте через минуту."
              : error === "4"
                ? "Этим переходом уже входили или он просрочен. Нажмите кнопку в Telegram ещё раз — она выдаёт новый."
                : "Ссылка не сработала: она одноразовая и живёт 15 минут. Запросите новую."}
        </p>
      ) : null}

      {token ? (
        <form action={signIn} className="mt-8">
          <input type="hidden" name="t" value={token} />
          <button
            type="submit"
            className="w-full rounded-xl bg-green px-5 py-3 text-sm font-semibold text-ink transition hover:bg-green-dim"
          >
            Войти
          </button>
          <p className="mt-3 text-xs text-faint">
            Ссылка сгорит после нажатия.
          </p>
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
            Получить ссылку в Telegram
          </a>
          <p className="mt-3 text-xs text-faint">
            Откроется чат с ботом — он пришлёт ссылку, она живёт 15 минут. Если чат уже открыт,
            отправьте{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text">/login</code>.
          </p>
        </>
      )}
    </main>
  );
}
