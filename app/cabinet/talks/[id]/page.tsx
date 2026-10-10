import Link from "next/link";
import { notFound } from "next/navigation";

import { removeTalk, replyInTalk, setTalkMode, teachAnswer } from "@/app/cabinet/actions";
import { CabinetShell, Card, Notice, button, ghost, input } from "@/components/cabinet/shell";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetTalk({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ n?: string }> }) {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  const { id } = await params;
  const { n } = await searchParams;
  const conv = await store.conversationById(tenant.id, id);
  if (!conv) notFound();
  const who = { customer: t("customer"), ai: t("ai"), human: t("human") };
  // Вопросы, на которые ИИ ответил «уточню у менеджера»: последний вопрос
  // покупателя перед каждым таким ответом.
  const unanswered = conv
    ? [
        ...new Set(
          conv.messages.flatMap((m, i) =>
            m.role === "ai" && m.fallback
              ? [conv.messages.slice(0, i).reverse().find((x) => x.role === "customer")?.text ?? ""].filter(Boolean)
              : [],
          ),
        ),
      ]
    : [];
  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/talks" configure={cab.configure} support={cab.role === "support"}>
      {n === "taught" ? <Notice text={t("taught")} /> : null}
      <Link href="/cabinet/talks" className="text-sm text-muted">
        ← {t("back")}
      </Link>
      <Card title={conv.customer_name || conv.customer_handle || t("customer")}>
        <div className="space-y-2">
          {conv.messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "customer" ? "border border-line bg-ink" : "ml-auto bg-surface-2"}`}>
              <div className="mb-0.5 text-xs text-muted">
                {who[m.role]}
                {m.fallback ? <span className="ml-2 text-gold">{t("needsKb")}</span> : null}
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap gap-3">
        <form action={setTalkMode}>
          <input type="hidden" name="id" value={conv.id} />
          <input type="hidden" name="mode" value={conv.mode === "human" ? "ai" : "human"} />
          <button className={ghost}>{conv.mode === "human" ? t("giveBack") : t("takeOver")}</button>
        </form>
        {cab.configure ? (
          <form action={removeTalk}>
            <input type="hidden" name="id" value={conv.id} />
            <button className="text-sm text-faint hover:text-gold">{t("remove")}</button>
          </form>
        ) : null}
      </div>
      {cab.configure
        ? unanswered.map((question) => (
            <Card key={question} title={t("teach")} hint={t("teachHint")}>
              <form action={teachAnswer} className="space-y-2">
                <input type="hidden" name="id" value={conv.id} />
                <input name="question" defaultValue={question.slice(0, 200)} maxLength={200} className={input} />
                <textarea name="answer" rows={3} maxLength={4000} required placeholder={t("teachPh")} className={input} />
                <button className={button}>{t("save")}</button>
              </form>
            </Card>
          ))
        : null}
      {conv.kind === "tg_bot" ? (
        <Card title={t("replyAsBot")}>
          <form action={replyInTalk} className="space-y-2">
            <input type="hidden" name="id" value={conv.id} />
            <textarea name="text" rows={3} maxLength={3000} required className={input} />
            <button className={button}>{t("send")}</button>
          </form>
        </Card>
      ) : null}
    </CabinetShell>
  );
}
