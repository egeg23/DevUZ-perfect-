import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/components/docs/invoice-document";
import { PrintButton } from "@/components/store/print-button";
import { contractByToken, invoiceById } from "@/lib/admin/invoice-store";
import { isLocale } from "@/lib/i18n";
import { looksLikeAccessToken } from "@/lib/store/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** Счёт на оплату — глазами заказчика, по той же ссылке, что и договор. */
export default async function ClientInvoicePage({
  params,
}: {
  params: Promise<{ locale: string; token: string; invoice: string }>;
}) {
  const { locale, token, invoice: invoiceId } = await params;
  if (!isLocale(locale) || !looksLikeAccessToken(token)) notFound();

  const contract = await contractByToken(token);
  if (!contract) notFound();
  if (contract.status !== "approved" && contract.status !== "signed") notFound();

  const invoice = await invoiceById(invoiceId);
  // Счёт должен принадлежать именно этому договору: иначе ссылка одного
  // заказчика открывала бы счета всех остальных.
  if (!invoice || invoice.contract_id !== contract.id) notFound();

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label="Печать счёта" />
        <a href={`/${locale}/contract/${token}`} className="text-sm text-gray-600 hover:underline">
          ← к договору
        </a>
      </div>

      <InvoiceDocument
        contract={contract}
        invoice={invoice}
        signatureSrc={`/api/contract/${token}/signature`}
      />
    </div>
  );
}
