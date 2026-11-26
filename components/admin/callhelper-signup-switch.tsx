import { switchSignup } from "@/app/admin/callhelper/actions";
import { callhelperDict } from "@/content/admin-panel/callhelper";
import { pick, type PanelLocale } from "@/lib/admin/i18n";

/**
 * «Регистрация колл-центров» в разделе CallHelper — только владельцу.
 * Выключатель страницы продукта: открыта — колл-центр сам берёт пробный
 * период (lib/callhelper/signup.ts), закрыта — там лист ожидания.
 */
export function CallHelperSignupSwitch({ locale, open }: { locale: PanelLocale; open: boolean }) {
  const t = pick(callhelperDict, locale);
  return (
    <section id="signup" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t.signupTitle}</h2>
        <span className={open ? "text-xs font-semibold text-green" : "text-xs text-muted"}>{open ? t.signupOpen : t.signupClosed}</span>
      </div>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">{t.signupLead}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <form action={switchSignup}>
          <input type="hidden" name="open" value={open ? "0" : "1"} />
          <button type="submit" className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:border-green/60">
            {open ? t.signupCloseBtn : t.signupOpenBtn}
          </button>
        </form>
        <a href="/ru/callhelper" target="_blank" rel="noopener" className="text-xs text-green underline-offset-4 hover:underline">
          {t.signupPage}
        </a>
        <a href="/ru/callhelper/cabinet" target="_blank" rel="noopener" className="text-xs text-green underline-offset-4 hover:underline">
          {t.signupCabinet}
        </a>
      </div>
    </section>
  );
}
