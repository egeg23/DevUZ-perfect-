import { buildAction, sentAction } from "@/app/admin/proto/actions";
import { AdminShell } from "@/components/admin/shell";
import { CopyMessage } from "@/components/admin/copy-message";
import { PROTO_NICHES, protoNicheByKey } from "@/content/proto/models";
import { requireAdmin } from "@/lib/admin/guard";
import { protosList } from "@/lib/proto/store";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const LABEL = "block text-xs text-faint";

/** Поля, которыми перебивают то, что нашёл аудитор. */
const OVERRIDES: readonly (readonly [string, string])[] = [
  ["name", "Название компании"],
  ["city", "Город — именительный: Ташкент"],
  ["hours", "Часы работы — как у него на сайте"],
  ["address", "Адрес"],
  ["phone", "Телефон"],
  ["telegram", "Телеграм — без собаки"],
  ["whatsapp", "Ватсап — номер"],
  ["wheel", "Снимок для трюка — ссылка на квадратный PNG от 1200 px"],
  ["prospect", "ID касания, если прототип по лиду"],
];

const STATUS: Record<string, string> = {
  draft: "черновик",
  ready: "готов",
  sent: "отправлен",
};

/** «13.09.26, 18:04» по Ташкенту — в базе время в UTC. */
function when(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Прототипы: собрать и отправить.
 *
 * Собирает менеджер сразу после первички, пока разговор свежий. Половина
 * фактов приходит с сайта клиента сама — название, описание, телефон,
 * мессенджеры, логотип; список услуг менеджер вписывает руками, потому что
 * на живом сайте под заголовками лежит поисковый мусор, а в разговоре
 * услуги названы верно.
 *
 * Черновик наружу не уходит: ссылка на него отдаёт 404, пока машинная
 * проверка не пройдена. Это не перестраховка — прототип уходит владельцу
 * чужого бизнеса с его именем в шапке, и выдуманная в нём цифра будет
 * утверждением о его компании.
 */
export default async function ProtoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const staff = await requireAdmin();
  const query = await searchParams;
  const { r } = query;
  const rows = await protosList();

  /*
   * Поля можно заполнить ссылкой: /admin/proto?url=tirex.uz&services=...
   *
   * Нужно там, где данные уже собраны в другом месте, — например, первичка
   * закончилась, и менеджеру остаётся нажать одну кнопку вместо того, чтобы
   * перепечатывать в форму то, что он только что услышал. Ничего не
   * сохраняется и никуда не уходит: это ровно значения по умолчанию.
   */
  const prefill = (name: string): string | undefined => query[name] || undefined;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Прототипы</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Страница, которую видно вместо разговора «а как это будет выглядеть».
        Собирается за минуту после первички: адрес его сайта, ниша и услуги,
        которые он сам назвал. Название, описание, телефон, мессенджеры и
        логотип снимаются с его сайта — поля ниже нужны, только если там
        этого нет.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Ничего, кроме сказанного им, на странице не появится: ни цифр, ни
        сроков, ни цен. Кнопка «Записаться» открывает его же телеграм или
        ватсап с готовым текстом — обращение падает ему, а не нам. Нет
        мессенджера — кнопка набирает номер, и текст страницы меняется под
        это сам.
      </p>

      {r && r !== "ok" ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{r}</p>
      ) : null}
      {r === "ok" ? (
        <p className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-sm text-green">
          Готово.
        </p>
      ) : null}

      <form action={buildAction} className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={LABEL}>Сайт клиента</span>
            <input
              name="url"
              required
              placeholder="tirex.uz"
              defaultValue={prefill("url")}
              className={`${INPUT} mt-1`}
            />
          </label>

          <label>
            <span className={LABEL}>Ниша</span>
            <select name="niche" className={`${INPUT} mt-1`} defaultValue={prefill("niche") ?? PROTO_NICHES[0].key}>
              {PROTO_NICHES.map((niche) => (
                <option key={niche.key} value={niche.key}>
                  {niche.ru}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL}>Язык страницы</span>
            <select name="locale" className={`${INPUT} mt-1`} defaultValue={prefill("locale") ?? "ru"}>
              <option value="ru">Русский</option>
              <option value="uz">O‘zbekcha</option>
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className={LABEL}>
              Услуги — по одной в строке, цена после тире. Пишите так, как он сам их называет.
            </span>
            <textarea
              name="services"
              required
              rows={6}
              defaultValue={prefill("services")}
              placeholder={"Замена шин — от 40 000 сум\nБалансировка колеса\nРемонт прокола"}
              className={`${INPUT} mt-1 font-mono text-xs leading-relaxed`}
            />
          </label>
        </div>

        {/* Раскрыт, если перебивки пришли ссылкой: иначе человек нажмёт
            «Собрать», не увидев подставленного за него. */}
        <details className="mt-4" open={OVERRIDES.some(([name]) => prefill(name))}>
          <summary className="cursor-pointer text-xs text-faint">
            Перебить то, что нашлось на сайте
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {OVERRIDES.map(([name, label]) => (
              <label key={name}>
                <span className={LABEL}>{label}</span>
                <input name={name} defaultValue={prefill(name)} className={`${INPUT} mt-1`} />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className={LABEL}>Строка о себе — его словами, не нашими</span>
              <input name="about" defaultValue={prefill("about")} className={`${INPUT} mt-1`} />
            </label>
          </div>
        </details>

        <button
          type="submit"
          className="mt-4 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-green-dim"
        >
          Собрать прототип
        </button>
      </form>

      {rows.length ? (
        <ul className="mt-6 space-y-3">
          {rows.map((proto) => {
            const link = absoluteUrl(`proto/${proto.token}`);
            const niche = protoNicheByKey(proto.niche);
            return (
              <li key={proto.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">{proto.name}</span>
                  <span className="text-xs text-faint">
                    {niche?.ru ?? proto.niche} · {proto.source} · {when(proto.created_at)}
                  </span>
                  <span
                    className={`ml-auto rounded px-2 py-0.5 font-mono text-[11px] ${
                      proto.status === "draft" ? "bg-gold/15 text-gold" : "bg-surface-2 text-faint"
                    }`}
                  >
                    {STATUS[proto.status] ?? proto.status}
                  </span>
                </div>

                {proto.problems.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-gold">
                    {proto.problems.map((problem, index) => (
                      <li key={index}>{problem.text}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-faint">
                  {proto.status === "draft" ? (
                    <span>
                      Черновик наружу не уходит: по ссылке будет 404, пока проверка не пройдена.
                    </span>
                  ) : (
                    <>
                      <code className="rounded bg-ink px-2 py-1 font-mono text-[11px] text-muted">{link}</code>
                      <CopyMessage text={link} label="Скопировать ссылку" />
                      {proto.status === "ready" ? (
                        <form action={sentAction}>
                          <input type="hidden" name="proto" value={proto.id} />
                          <button type="submit" className={BUTTON}>
                            Отправил клиенту
                          </button>
                        </form>
                      ) : null}
                      {/* Открыл и вернулся второй раз — звонить сегодня. Не открыл
                          за два дня — прототип не дошёл, и дело не в прототипе. */}
                      <span>
                        {proto.opened_at
                          ? `открыл ${when(proto.opened_at)}${proto.opens > 1 ? `, заходов: ${proto.opens}` : ""}`
                          : "ещё не открывал"}
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-faint">Прототипов пока нет.</p>
      )}
    </AdminShell>
  );
}
