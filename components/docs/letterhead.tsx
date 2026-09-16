import { LogoMark } from "@/components/brand/logo";
import { company } from "@/content/company";
import { sellerBank } from "@/lib/store/requisites";

/**
 * Фирменный бланк DevUz Studio.
 *
 * Владелец: «все делаем на фирменных бланках Devuz Studio».
 *
 * Один бланк на все документы студии — договор, счёт, акт. Не потому что
 * так меньше кода, а потому что бланк — это то, по чему заказчик узнаёт
 * отправителя. Два разных бланка у одной студии читаются как два разных
 * отправителя, и первым это замечает бухгалтер заказчика.
 *
 * Свёрстан под печать, а не под экран:
 *
 * — Белый фон и чёрный текст заданы явно. На сайте тёмная тема, и документ,
 *   унаследовавший её, уходит в принтер чёрным прямоугольником.
 * — Ширина 210 мм — A4. Поля 20 мм слева и справа: меньше — и текст уезжает
 *   под дырокол подшивки.
 * — Шапка и подвал помечены `break-inside-avoid`, чтобы не разрывались
 *   между страницами.
 * — Реквизиты в подвале идут из тех же переменных, что и счёт. Разойдутся
 *   номер счёта в договоре и в счёте — платёж уйдёт не туда, и выяснится
 *   это через неделю.
 */
export function Letterhead({
  /** Что за документ: «Договор № DU-2026-01», «Счёт № 14». */
  title,
  /** Подзаголовок под названием: «на выполнение работ по разработке». */
  subtitle,
  /** Город и дата — строкой под шапкой, как принято в документах. */
  place,
  date,
  children,
}: {
  title: string;
  subtitle?: string;
  place?: string;
  date?: string;
  children: React.ReactNode;
}) {
  const bank = sellerBank();
  const legal = company.legal;

  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white px-[20mm] py-[15mm] text-[10.5pt] leading-relaxed text-black print:px-[15mm] print:py-0">
      <header className="flex items-start justify-between gap-6 break-inside-avoid border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <p className="text-[13pt] font-bold leading-none tracking-tight">DevUz Studio</p>
            <p className="mt-1 text-[8.5pt] text-black/60">
              Разработка сайтов, приложений и ИИ-продуктов · Ташкент
            </p>
          </div>
        </div>
        <div className="text-right text-[8.5pt] leading-snug text-black/70">
          <p>devuz.studio</p>
          <p>{company.telegramUrl.replace("https://", "")}</p>
          <p>{legal.address.ru}</p>
        </div>
      </header>

      <h1 className="mt-8 text-center text-[14pt] font-bold">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-center text-[10pt] text-black/70">{subtitle}</p>
      ) : null}

      {place || date ? (
        <div className="mt-5 flex justify-between text-[10pt]">
          <span>{place}</span>
          <span>{date}</span>
        </div>
      ) : null}

      <div className="mt-6">{children}</div>

      <footer className="mt-10 break-inside-avoid border-t border-black/20 pt-3 text-[8pt] leading-snug text-black/60">
        <p>
          <b className="text-black/80">{legal.name}</b> · {legal.address.ru} · ПИНФЛ {legal.pinfl}
        </p>
        {bank ? (
          <p className="mt-0.5">
            {bank.bankName} · р/с {bank.account} · МФО {bank.mfo}
          </p>
        ) : (
          // Молчать нельзя: документ без банковских реквизитов выглядит
          // законченным, а оплатить по нему невозможно.
          <p className="mt-0.5 text-red-700">
            Банковские реквизиты не заданы — заполните INVOICE_* на сервере
          </p>
        )}
      </footer>
    </div>
  );
}
