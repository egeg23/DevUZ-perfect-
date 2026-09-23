import { company } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import { t, type Locale } from "@/lib/i18n";
import { telUrl, whatsappUrl } from "@/lib/phone-links";

/**
 * Телефоны студии: позвонить одним нажатием или открыть WhatsApp.
 *
 * Номера — из content/company.ts, одного места на весь сайт. Ссылка
 * WhatsApp открывает чат с уже набранным «Пишу с сайта DevUz Studio»:
 * человеку не нужно думать, с чего начать, а менеджер сразу видит, откуда
 * пришло сообщение.
 */

const WHATSAPP_ICON = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.31-1.97 1.36-.5.05-1.13.07-1.83-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36h.55c.18.01.41-.07.64.49.24.57.81 1.99.88 2.13.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.3-.12.59.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.14.45.12.62-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.66.78 1.95.92.29.14.48.21.55.33.07.12.07.69-.17 1.37Z" />
  </svg>
);

const PHONE_ICON = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 5.5A2.5 2.5 0 0 1 5.5 3h1.2c.5 0 .9.3 1 .8l1 3.8a1 1 0 0 1-.3 1l-1.6 1.4a14 14 0 0 0 6.2 6.2l1.4-1.6a1 1 0 0 1 1-.3l3.8 1c.5.1.8.5.8 1v1.2a2.5 2.5 0 0 1-2.5 2.5h-1C9.6 21 3 14.4 3 6.5v-1Z"
    />
  </svg>
);

/** Полный список: у каждого номера — «Позвонить» и, если он есть, «WhatsApp». Для блока «Связаться». */
export function PhoneList({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <div>
      <p className="text-[0.82rem] text-faint">{dict.contact.phonesTitle}</p>
      <ul className="mt-3 space-y-3">
        {company.phones.map((phone) => (
          <li key={phone.e164} className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <a
              href={telUrl(phone)}
              className="min-w-0 font-mono text-[0.95rem] text-text transition-colors hover:text-green"
            >
              <span aria-hidden="true" className="mr-1.5">
                {phone.flag}
              </span>
              {phone.display}
              <span className="sr-only"> — {t(phone.country, locale)}</span>
            </a>
            <span className="ml-auto flex gap-2">
              <a
                href={telUrl(phone)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[0.8rem] text-muted transition-colors hover:border-green/50 hover:text-green"
                aria-label={`${dict.contact.call}: ${phone.display}`}
              >
                {PHONE_ICON}
                {dict.contact.call}
              </a>
              {phone.whatsapp ? (
                <a
                  href={whatsappUrl(phone, dict.contact.whatsappText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[0.8rem] text-muted transition-colors hover:border-[#25D366]/60 hover:text-[#25D366]"
                  aria-label={`WhatsApp: ${phone.display}`}
                >
                  {WHATSAPP_ICON}
                  WhatsApp
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Коротко: номер-ссылка и значок WhatsApp рядом. Для подвала. */
export function PhoneLinesCompact({ dict }: { dict: Dictionary }) {
  return (
    <>
      {company.phones.map((phone) => (
        <li key={phone.e164} className="flex items-center gap-2.5">
          <a href={telUrl(phone)} className="font-mono text-muted transition-colors hover:text-text">
            <span aria-hidden="true" className="mr-1.5">
              {phone.flag}
            </span>
            {phone.display}
          </a>
          {phone.whatsapp ? (
            <a
              href={whatsappUrl(phone, dict.contact.whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-faint transition-colors hover:text-[#25D366]"
              aria-label={`WhatsApp: ${phone.display}`}
              title="WhatsApp"
            >
              {WHATSAPP_ICON}
            </a>
          ) : null}
        </li>
      ))}
    </>
  );
}
