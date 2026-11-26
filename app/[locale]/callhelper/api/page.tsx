import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { CALLHELPER_API_BASE, CALLHELPER_API_DOCS, CALLHELPER_API_ERRORS, CALLHELPER_API_INTRO as I, CALLHELPER_API_PATH } from "@/content/callhelper-api";
import { CALLHELPER_ANCHOR } from "@/content/callhelper";
import { company } from "@/content/company";
import { isLocale } from "@/lib/i18n";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

/**
 * Описание API DevUz CallHelper для сервисов набора, телефонии и CRM
 * (владелец, 26.11.2026: «подготовить базу апи под интеграции, чтобы и они
 * могли к нам цепляться»). Только по-русски, как сам продукт.
 */
const DESCRIPTION =
  "Как подключить ИИ-суфлёр DevUz CallHelper к телефонии, сервису набора или CRM: ключ, сценарии, подсказки оператору во время звонка, итог звонка.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return buildMetadata({ locale, path: CALLHELPER_API_PATH, title: `${I.title}: подключение суфлёра`, description: DESCRIPTION, alternates: { ru: CALLHELPER_API_PATH } });
}

const METHOD: Record<string, string> = {
  GET: "border-green/40 text-green",
  POST: "border-gold/50 text-gold",
  PUT: "border-white/30 text-white",
  DELETE: "border-red-400/40 text-red-300",
};

export default async function CallHelperApiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== "ru") redirect(`/ru/${CALLHELPER_API_PATH}`);
  const base = absoluteUrl(CALLHELPER_API_BASE);

  return (
    <div className="box-page">
      <section className="border-b border-line">
        <Container className="pb-12 pt-32 md:pt-40">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}для разработчиков</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">{I.title}</h1>
          <p className="mt-5 max-w-3xl text-[1.02rem] leading-relaxed text-white/80">{I.lead}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`/ru#${CALLHELPER_ANCHOR}`} className="box-cta inline-flex items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink">
              Получить ключ: лист ожидания
            </a>
            <a href={company.telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-[0.95rem] font-semibold text-white hover:border-white/50">
              Спросить в Telegram
            </a>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Ключ", I.auth],
            ["Звук", I.audio],
            ["Минуты", I.minutes],
          ].map(([title, text]) => (
            <div key={title} className="box-glass rounded-2xl p-5">
              <h2 className="text-[1.05rem] font-semibold text-white">{title}</h2>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-white/75">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-[1.6rem] font-bold text-white">Адреса</h2>
        <p className="mt-2 text-[0.92rem] text-white/70">
          Основа всех адресов: <code className="break-all rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85rem] text-white">{base}</code>
        </p>
        <div className="mt-6 grid gap-4">
          {CALLHELPER_API_DOCS.map((d) => (
            <article key={`${d.method} ${d.path}`} className="rounded-2xl border border-line bg-surface/60 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-md border px-2 py-0.5 font-mono text-[0.75rem] ${METHOD[d.method]}`}>{d.method}</span>
                <code className="break-all font-mono text-[0.9rem] text-white">{d.path}</code>
              </div>
              <h3 className="mt-3 text-[1.02rem] font-semibold text-white">{d.title}</h3>
              <p className="mt-1 text-[0.92rem] leading-relaxed text-white/75">{d.what}</p>
              {d.body ? (
                <>
                  <p className="mt-3 text-[0.75rem] uppercase tracking-[0.15em] text-white/45">Шлёте</p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-ink/70 p-3 font-mono text-[0.78rem] leading-relaxed text-white/85">{d.body}</pre>
                </>
              ) : null}
              <p className="mt-3 text-[0.75rem] uppercase tracking-[0.15em] text-white/45">Получаете</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-ink/70 p-3 font-mono text-[0.78rem] leading-relaxed text-white/85">{d.reply}</pre>
            </article>
          ))}
        </div>

        <h2 className="mt-12 font-display text-[1.6rem] font-bold text-white">Пример: проверить ключ</h2>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-ink/70 p-4 font-mono text-[0.8rem] leading-relaxed text-white/85">
          {`curl ${base}/me \\\n  -H "Authorization: Bearer chk_ВАШ_КЛЮЧ"`}
        </pre>

        <h2 className="mt-12 font-display text-[1.6rem] font-bold text-white">Ошибки</h2>
        <p className="mt-2 text-[0.92rem] text-white/70">Ответ с ошибкой всегда такой: {`{ "error": "код" }`}.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] text-left text-[0.9rem]">
            <tbody>
              {CALLHELPER_API_ERRORS.map((e) => (
                <tr key={e.code} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.8rem] text-white">{e.code}</td>
                  <td className="px-4 py-2 text-white/55">{e.status}</td>
                  <td className="px-4 py-2 text-white/80">{e.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
