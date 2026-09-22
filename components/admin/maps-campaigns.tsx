import {
  createMapsCampaignAction,
  runMapsCampaignAction,
  toggleMapsCampaignAction,
} from "@/app/admin/prospect/actions";
import type { Campaign } from "@/lib/maps/store";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

const NOTICE: Record<string, { text: string; tone: "ok" | "warn" }> = {
  created: { text: "Кампания заведена, первый поиск уже прошёл — найденное проверяется в фоне.", tone: "ok" },
  ran: { text: "Поиск прошёл — найденное проверяется в фоне и появится в пуле через несколько минут.", tone: "ok" },
  cap: { text: "Дневной лимит запросов к картам исчерпан — поиск продолжится завтра в 06:00.", tone: "warn" },
  failed: { text: "Google Maps не ответил. Проверьте ключ в .env или попробуйте позже.", tone: "warn" },
  invalid: { text: "Нужны ниша и город.", tone: "warn" },
  gone: { text: "Такой кампании уже нет.", tone: "warn" },
};

/**
 * Автопоиск компаний по картам — блок в «Касаниях».
 *
 * Ниша и город → Google Maps → проверка сайта → пул, откуда утром берётся
 * порция дня. Раньше сайты сюда вбивали руками, и на этом всё стояло.
 */
export function MapsCampaigns({
  campaigns,
  configured,
  usage,
  cap,
  pending,
  canEdit,
  notice,
}: {
  campaigns: Campaign[];
  configured: boolean;
  usage: number;
  cap: number;
  pending: number;
  canEdit: boolean;
  notice?: string;
}) {
  const message = notice ? NOTICE[notice] : null;
  return (
    <section id="maps" className={`mt-6 scroll-mt-24 ${CARD}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-faint">Автопоиск компаний по картам</p>
        {configured ? (
          <p className="text-xs text-faint">
            запросов сегодня: {usage} из {cap}
            {pending ? ` · ждут проверки: ${pending}` : ""}
          </p>
        ) : null}
      </div>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
        Ниша и город — система каждое утро в 06:00 ищет компании на Google Maps, проверяет их сайты
        и кладёт годные в пул касаний, откуда в 07:00 раздаётся порция дня. Компании без сайта
        попадают туда же с телефоном с карт — им как раз есть что предложить. Для Ташкента поиск
        идёт и по районам.
      </p>

      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            message.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {!configured ? (
        <div className="mt-3 text-sm text-muted">
          <p>Не подключено. Что нужно сделать один раз:</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
            <li>
              В <code className="font-mono text-text">console.cloud.google.com</code> — проект (можно тот
              же, что для Google Analytics) → включите «Places API (New)». Нужна привязанная карта
              оплаты: без неё Google API не открывает, но первая тысяча запросов в месяц бесплатна.
            </li>
            <li>
              «APIs &amp; Services» → «Credentials» → «Create credentials» → «API key». В ограничениях
              ключа выберите только «Places API (New)».
            </li>
            <li>
              На сервере в <code className="font-mono text-text">/opt/devuz/.env</code>:{" "}
              <code className="font-mono text-text">GOOGLE_PLACES_API_KEY=ключ</code>, затем{" "}
              <code className="font-mono text-text">docker compose up -d</code> или следующая выкатка.
            </li>
          </ol>
          <p className="mt-2 text-xs text-faint">
            Один запрос — до 20 компаний. Потолок — {cap} запросов в день, это около {cap * 30} в месяц:
            внутри бесплатной тысячи.
          </p>
        </div>
      ) : null}

      {campaigns.length ? (
        <ul className="mt-4 divide-y divide-line-soft text-sm">
          {campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <span className={c.active ? "" : "text-faint"}>
                {c.niche} · {c.city}
              </span>
              <span className="text-xs text-muted">
                найдено {c.found} · в пуле {c.added}
                {c.exhausted ? " · выдача исчерпана" : c.active ? "" : " · на паузе"}
              </span>
              {canEdit ? (
                <span className="ml-auto flex gap-3">
                  {configured && c.active && !c.exhausted ? (
                    <form action={runMapsCampaignAction}>
                      <input type="hidden" name="campaign" value={c.id} />
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        искать сейчас
                      </button>
                    </form>
                  ) : null}
                  <form action={toggleMapsCampaignAction}>
                    <input type="hidden" name="campaign" value={c.id} />
                    <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                    <button type="submit" className="text-xs text-faint hover:text-green">
                      {c.active ? "пауза" : "возобновить"}
                    </button>
                  </form>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canEdit ? (
        <form action={createMapsCampaignAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input name="niche" required placeholder="Ниша: стоматология" className={INPUT} aria-label="Ниша" />
          <input name="city" required defaultValue="Ташкент" className={INPUT} aria-label="Город" />
          <button
            type="submit"
            className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs transition hover:border-green/40 hover:text-green"
          >
            Искать
          </button>
        </form>
      ) : null}
    </section>
  );
}
