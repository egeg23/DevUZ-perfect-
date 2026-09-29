import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/components/docs/invoice-document";
import { HelpHint } from "@/components/admin/help-link";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { contractCardDict, invoicePageDict } from "@/content/admin-panel/contracts";
import { PrintButton } from "@/components/store/print-button";
import { contractById } from "@/lib/admin/contract-store";
import { requireStaff } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { pick } from "@/lib/admin/i18n";
import { invoiceById } from "@/lib/admin/invoice-store";

export const dynamic = "force-dynamic";

/** Счёт на оплату этапа — глазами менеджера. */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string; invoice: string }>;
}) {
  const staff = await requireStaff();
  const locale = staff.panel_locale;
  const t = pick(invoicePageDict, locale);
  const card = pick(contractCardDict, locale);
  const { id, invoice: invoiceId } = await params;

  const [contract, invoice] = await Promise.all([contractById(id), invoiceById(invoiceId)]);
  // Счёт чужого договора по этому адресу не открывается: номер счёта в
  // адресе — это ввод, а не доказательство принадлежности.
  if (!contract || !invoice || invoice.contract_id !== contract.id) notFound();

  // Панель вокруг счёта — на языке сотрудника; сам счёт — документ
  // заказчику, он на языке договора и не переводится.
  return (
    <PanelLocaleProvider locale={locale}>
    <div className="min-h-screen bg-white py-8">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label={card.print} />
        <span className="inline-flex items-center gap-1.5 text-sm text-black/60">
          {card.howTo} <HelpHint topic={helpAnchor("/admin/contracts", "invoices")} label={card.invoicesHelp} />
        </span>
        <a href={`/admin/contracts/${contract.id}`} className="text-sm text-gray-600 hover:underline">
          {t.backToContract}
        </a>
        <span className="text-sm text-gray-500">
          {invoice.paid_at ? t.paid : t.payUntil(invoice.due_at)}
          {t.openedBy(staff.display_name)}
        </span>
      </div>

      <InvoiceDocument
        contract={contract}
        invoice={invoice}
        signatureSrc={`/admin/contracts/${contract.id}/signature`}
      />
    </div>
    </PanelLocaleProvider>
  );
}
