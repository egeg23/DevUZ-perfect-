import type { CSSProperties, ReactNode } from "react";

import { supportLinks, type Setup } from "@/lib/claudery/scenario";
import { OFFER_PATH, botState, loadSetup } from "@/lib/claudery/store";
import { appSecret } from "@/lib/secrets";

/**
 * Документы Claudery для банка и покупателя (Platega, 19.11.2026: политика
 * конфиденциальности, пользовательское соглашение, контакты поддержки —
 * «постоянно доступна пользователю… отдельными кнопками в бот или на сайт»).
 * Продавец и ИНН — из хранилища (`app.INVOICE_RU_*`) при показе, в
 * репозитории их нет. Подвал со ссылками — на каждой странице Claudery.
 */
export const DOCS_DATE = "19.11.2026";
export const TERMS_PATH = "/claudery/terms";
export const PRIVACY_PATH = "/claudery/privacy";
export const SHOP_PATH = "/claudery";

export type Seller = { payee: string | null; taxId: string | null; setup: Setup; bot: string | null };

export async function sellerData(): Promise<Seller> {
  const [payee, taxId, setup, bot] = await Promise.all([appSecret("INVOICE_RU_PAYEE"), appSecret("INVOICE_RU_TAX_ID"), loadSetup(), botState()]);
  return { payee, taxId, setup, bot: bot.username };
}

export function sellerLine(s: Seller): string {
  return `${s.payee ?? "индивидуальный предприниматель"}${s.taxId ? `, ИНН ${s.taxId}` : ""}`;
}

export const h2: CSSProperties = { fontSize: 20, margin: "24px 0 8px" };

export function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
      <p style={{ color: "#666", margin: 0 }}>Claudery</p>
      <h1 style={{ fontSize: 26, margin: "4px 0 4px" }}>{title}</h1>
      <p style={{ color: "#666", margin: "0 0 16px" }}>Редакция от {DOCS_DATE}</p>
      {children}
    </main>
  );
}

/** Контакты поддержки ссылками через запятую; не заданы — бот. */
export function Support({ s }: { s: Seller }) {
  const links = supportLinks(s.setup.support);
  if (links.length)
    return (
      <>
        {links.map((l, i) => (
          <span key={l.href}>
            {i ? ", " : ""}
            <a href={l.href}>{l.text}</a>
          </span>
        ))}
      </>
    );
  return s.bot ? <a href={`https://t.me/${s.bot}`}>@{s.bot}</a> : <>Telegram-бот Claudery</>;
}

export function Footer({ s }: { s: Seller }) {
  const a: CSSProperties = { color: "#444", marginRight: 16, display: "inline-block", marginTop: 6 };
  return (
    <footer id="support" style={{ margin: "32px 0 0", padding: "16px 0 0", borderTop: "1px solid #eee", fontSize: 14, color: "#666" }}>
      <p style={{ margin: "0 0 4px" }}>
        Поддержка: <Support s={s} />
      </p>
      <p style={{ margin: "0 0 4px" }}>Продавец: {sellerLine(s)}.</p>
      <nav>
        <a href={SHOP_PATH} style={a}>
          Каталог
        </a>
        <a href={OFFER_PATH} style={a}>
          Оферта
        </a>
        <a href={TERMS_PATH} style={a}>
          Пользовательское соглашение
        </a>
        <a href={PRIVACY_PATH} style={a}>
          Политика конфиденциальности
        </a>
      </nav>
    </footer>
  );
}
