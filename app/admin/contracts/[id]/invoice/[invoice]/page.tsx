import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/components/docs/invoice-document";
import { PrintButton } from "@/components/store/print-button";
import { contractById } from "@/lib/admin/contract-store";
import { requireStaff } from "@/lib/admin/guard";
import { invoiceById } from "@/lib/admin/invoice-store";

export const dynamic = "force-dynamic";

/** Счёт на оплату этапа — глазами менеджера. */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string; invoice: string }>;
}) {
  const staff = await requireStaff();
  const { id, invoice: invoiceId } = await params;

  const [contract, invoice] = await Promise.all([contractById(id), invoiceById(invoiceId)]);
  // Счёт чужого договора по этому адресу не открывается: номер счёта в
  // адресе — это ввод, а не доказательство принадлежности.
  if (!contract || !invoice || invoice.contract_id !== contract.id) notFound();

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label="Печать" />
        <a href={`/admin/contracts/${contract.id}`} className="text-sm text-gray-600 hover:underline">
          ← к договору
        </a>
        <span className="text-sm text-gray-500">
          {invoice.paid_at ? "оплачен" : `оплатить до ${invoice.due_at}`} · открыл {staff.display_name}
        </span>
      </div>

      <InvoiceDocument
        contract={contract}
        invoice={invoice}
        signatureSrc={`/admin/contracts/${contract.id}/signature`}
      />
    </div>
  );
}
