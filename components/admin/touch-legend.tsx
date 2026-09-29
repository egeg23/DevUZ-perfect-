import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { HOURLY_CAP } from "@/lib/admin/outreach";
import { BOT_BUTTON } from "@/lib/admin/portion";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { outreachListDict, prospectStatusDict } from "@/content/admin-panel/prospect";
import { touchLegendDict } from "@/content/admin-panel/prospect-tools";

/**
 * Как читать цифры в «Касаниях».
 *
 * Владелец: «дай расшифровку цифр в касаниях — новички не понимают». У
 * карточки три числа справа, цветные метки находок и строки над списком, и
 * без подписи новичок видит «поиск 58 · −24…48 · 72» как шифр. Подсказки
 * при наведении были, но на телефоне наводить нечем.
 *
 * Свёрнуто по умолчанию: тем, кто уже знает, оно не нужно, а новичку одно
 * нажатие.
 *
 * Язык — сотрудника: страница передаёт `staff.panel_locale`. Названия
 * статусов берутся из того же словаря, что и подписи на карточках, —
 * расшифровка и карточка не могут назвать одно и то же по-разному.
 */
export function TouchLegend({ locale = "ru" }: { locale?: PanelLocale }) {
  const t = pick(touchLegendDict, locale);
  const status = pick(prospectStatusDict, locale);
  const self = pick(outreachListDict, locale).selfContacted;
  return (
    <details className="mt-6 rounded-xl border border-line bg-surface px-5 py-3 text-sm">
      <summary className="cursor-pointer text-xs uppercase tracking-wider text-faint hover:text-text">
        {t.summary}
      </summary>

      <dl className="mt-4 grid gap-x-6 gap-y-4 leading-relaxed sm:grid-cols-2">
        <Term name={<span className="font-mono text-green">{t.searchSample}</span>}>
          <b>{t.seoTitle}</b>
          {t.seoBody} <span className="text-green">{t.seoGood}</span>
          {t.seoGoodTail} <span className="text-gold">{t.seoMid}</span>
          {t.seoMidTail} <span className="text-red-300">{t.seoLow}</span>
          {t.seoLowTail}
        </Term>

        <Term name={<span className="font-mono text-red-300">−24…48</span>}>
          <b>{t.lostTitle}</b>
          {t.lostBody}
        </Term>

        <Term name={<span className="font-mono text-gold">52</span>}>
          <b>{t.scoreTitle}</b>
          {t.scoreBody} <span className="text-gold">{t.scoreYellow}</span>
          {t.scoreTail}
        </Term>

        <Term
          name={
            <span className="flex flex-wrap gap-1">
              <Chip tone="border-red-500/40 text-red-300">{t.critical}</Chip>
              <Chip tone="border-gold/40 text-gold">{t.major}</Chip>
              <Chip tone="border-line text-muted">{t.minor}</Chip>
            </span>
          }
        >
          <b>{t.findingsTitle}</b>
          {t.findingsBody}
        </Term>

        <Term name={<span className="text-faint">{t.queueSample(HOURLY_CAP)}</span>}>
          <b>{t.queueTitle}</b>
          {t.queueBody(HOURLY_CAP, self)}
        </Term>

        <Term name={<span className="text-faint">{t.planSample}</span>}>
          <b>{t.planTitle}</b>
          {t.planBody(self, BOT_BUTTON.self)}
        </Term>
      </dl>

      <p className="mt-4 text-xs text-faint">
        {t.statusesLead}
        <b>{status.new}</b>
        {t.statusNew}
        <b>{status.contacting}</b>
        {t.statusContacting}
        <b>{status.sending}</b>
        {t.statusSending}
        <b>{status.sent}</b>
        {t.statusSent}
        <b>{status.manual}</b>
        {t.statusManual}
        <b>{status.failed}</b>
        {t.statusFailed}
        <b>{status.skipped}</b>
        {t.statusSkipped}{" "}
        <HelpHint topic={helpAnchor("/admin/prospect", "numbers")} label={t.helpMore} />
      </p>
    </details>
  );
}

function Term({ name, children }: { name: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm">{name}</dt>
      <dd className="mt-1 text-xs text-muted">{children}</dd>
    </div>
  );
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${tone}`}>{children}</span>;
}
