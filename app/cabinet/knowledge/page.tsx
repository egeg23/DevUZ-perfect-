import { addKnowledgeItem, importFromSite, removeKnowledgeItem, saveKnowledgeItem } from "@/app/cabinet/actions";
import { CabinetShell, Card, Notice, button, ghost, input } from "@/components/cabinet/shell";
import type { CabKey } from "@/content/ai-staff/cabinet";
import { cabinetPage } from "@/lib/ai-staff/page";
import { KNOWLEDGE_KINDS } from "@/lib/ai-staff/prompt";
import * as store from "@/lib/ai-staff/store";

export const dynamic = "force-dynamic";

export default async function CabinetKnowledge({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const cab = await cabinetPage({ owner: true });
  const { tenant, t, locale } = cab;
  const q = await searchParams;
  const items = await store.knowledge(tenant.id);
  const kinds = KNOWLEDGE_KINDS.map((k) => ({ value: k, label: t(`kind_${k}` as CabKey) }));

  return (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/knowledge" configure={cab.configure} support={cab.role === "support"}>
      {q.n === "saved" ? <Notice text={t("saved")} /> : null}
      {q.n === "import" ? <Notice text={`${t("importOk")}: ${q.c}${Number(q.d) > 0 ? ` · ${q.d} ${t("importDropped")}` : ""}`} /> : null}
      {q.n === "import_fail" ? <Notice tone="warn" text={t("importFail")} /> : null}
      <p className="text-sm text-muted">{t("kbIntro")}</p>

      <Card title={t("kbFromSite")} hint={t("kbFromSiteHint")}>
        <form action={importFromSite} className="flex flex-col gap-2 sm:flex-row">
          <input name="url" defaultValue={tenant.site_url ?? ""} placeholder="https://" required className={input} />
          <button className={button}>{t("kbLoad")}</button>
        </form>
      </Card>

      <Card title={t("kbAdd")}>
        <form action={addKnowledgeItem} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="kind" defaultValue="price" className={input}>
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <input name="title" placeholder={t("kbTitle")} maxLength={200} className={`${input} sm:col-span-2`} />
          </div>
          <textarea name="body" rows={5} placeholder={t("kbBodyPh")} maxLength={8000} className={input} />
          <button className={button}>{t("save")}</button>
        </form>
      </Card>

      {items.length === 0 ? <p className="text-sm text-muted">{t("kbEmpty")}</p> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <form action={saveKnowledgeItem} className="space-y-3">
            <input type="hidden" name="id" value={item.id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select name="kind" defaultValue={item.kind} className={input}>
                {kinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              <input name="title" defaultValue={item.title} placeholder={t("kbTitle")} maxLength={200} className={`${input} sm:col-span-2`} />
            </div>
            <textarea name="body" rows={4} defaultValue={item.body} maxLength={8000} className={input} />
            <div className="flex items-center gap-3">
              <button className={ghost}>{t("save")}</button>
              {item.source === "site" ? <span className="text-xs text-faint">{t("fromSite")}</span> : null}
            </div>
          </form>
          <form action={removeKnowledgeItem} className="mt-2">
            <input type="hidden" name="id" value={item.id} />
            <button className="text-xs text-faint hover:text-gold">{t("remove")}</button>
          </form>
        </Card>
      ))}
    </CabinetShell>
  );
}
