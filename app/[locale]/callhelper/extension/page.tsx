import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { CALLHELPER_ANCHOR } from "@/content/callhelper";
import { CALLHELPER_API_PATH } from "@/content/callhelper-api";
import { CALLHELPER_EXT as E, CALLHELPER_EXT_PATH, CALLHELPER_EXT_ZIP } from "@/content/callhelper-extension";
import { isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

/**
 * Как поставить расширение DevUz CallHelper (extension/callhelper) и начать
 * звонок с суфлёром. Только по-русски, как сам продукт.
 */
const DESCRIPTION = "Как установить расширение DevUz CallHelper в Chrome и начать звонок с ИИ-суфлёром: пять шагов установки и четыре шага работы.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru") return {};
  return buildMetadata({ locale, path: CALLHELPER_EXT_PATH, title: E.title, description: DESCRIPTION, alternates: { ru: CALLHELPER_EXT_PATH } });
}

function Steps({ items }: { items: readonly { t: string; d: string }[] }) {
  return (
    <ol className="mt-5 grid gap-3">
      {items.map((s, i) => (
        <li key={s.t} className="flex gap-4 rounded-2xl border border-line bg-surface/60 p-4">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-green/50 font-mono text-[0.85rem] text-green">{i + 1}</span>
          <span>
            <b className="text-white">{s.t}</b>
            <span className="mt-1 block text-[0.92rem] leading-relaxed text-white/75">{s.d}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function CallHelperExtensionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== "ru") redirect(`/ru/${CALLHELPER_EXT_PATH}`);

  return (
    <div className="box-page">
      <section className="border-b border-line">
        <Container className="pb-12 pt-32 md:pt-40">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">{"// "}DevUz CallHelper</p>
          <h1 className="mt-4 font-display text-[clamp(1.9rem,4.4vw,3.1rem)] font-extrabold leading-[1.05] tracking-tight text-white">{E.title}</h1>
          <p className="mt-5 max-w-3xl text-[1.02rem] leading-relaxed text-white/80">{E.lead}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={CALLHELPER_EXT_ZIP} download className="box-cta inline-flex items-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink">
              {E.download}
            </a>
            <a href={`/ru#${CALLHELPER_ANCHOR}`} className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-[0.95rem] font-semibold text-white hover:border-white/50">
              Нет ключа: лист ожидания
            </a>
          </div>
          <p className="mt-4 text-[0.85rem] text-white/55">{E.browsers}</p>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-[1.5rem] font-bold text-white">Установка</h2>
            <Steps items={E.install} />
          </section>
          <section>
            <h2 className="font-display text-[1.5rem] font-bold text-white">Первый звонок</h2>
            <Steps items={E.use} />
          </section>
        </div>

        <h2 className="mt-12 font-display text-[1.5rem] font-bold text-white">Важно знать</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {E.notes.map((n) => (
            <li key={n} className="box-glass rounded-2xl p-4 text-[0.92rem] leading-relaxed text-white/80">
              {n}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[0.92rem] text-white/70">
          Подключаете суфлёр к своей телефонии или CRM?{" "}
          <Link href={`/ru/${CALLHELPER_API_PATH}`} className="text-green underline-offset-4 hover:underline">
            Описание API
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
