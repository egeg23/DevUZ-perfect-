import type { Metadata } from "next";

import { rub } from "@/lib/claudery/scenario";
import { OFFER_PATH } from "@/lib/claudery/store";

import { Footer, sellerData } from "./docs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — подписки на нейросети" };

/**
 * Витрина Claudery: что продаётся и по какой цене. Владелец, 18.11.2026:
 * Platega согласует оплату, «если это просто продажа подписок на
 * нейросети… главное чтобы там не было ваших услуг», и смотрит сайт.
 * Товары и цены — те же, что на странице заказа (настройки бота), продавец —
 * из хранилища. Заказ оформляется в боте: на странице заказа — выбор и оплата.
 */
export default async function ClauderyShop() {
  const seller = await sellerData();
  const setup = seller.setup;
  const card = { border: "1px solid #e5e5e5", borderRadius: 14, padding: 16 } as const;
  const botUrl = seller.bot ? `https://t.me/${seller.bot}` : null;
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
      <p style={{ color: "#666", margin: 0 }}>Claudery</p>
      <h1 style={{ fontSize: 30, margin: "4px 0 8px" }}>Подписки на нейросети с готовым доступом</h1>
      <p style={{ margin: 0 }}>Выбираете подписку, оплачиваете, получаете доступ в Telegram. Подключение и поддержка покупателя бесплатно.</p>

      <h2 style={{ fontSize: 20, margin: "28px 0 12px" }}>Каталог</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {setup.products.map((p, i) => (
          <div key={i} style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, overflowWrap: "anywhere" }}>{p.title}</p>
              {p.note ? <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666", overflowWrap: "anywhere" }}>{p.note}</p> : null}
            </div>
            <p style={{ margin: 0, fontWeight: 600, whiteSpace: "nowrap" }}>{rub(p.price)}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, margin: "28px 0 12px" }}>Как купить</h2>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        <li>Откройте Telegram-бот Claudery и напишите, какая нейросеть нужна.</li>
        <li>Бот пришлёт ссылку на заказ: на странице заказа выберите подписку и оплатите по СБП.</li>
        <li>После подтверждения оплаты доступ придёт в Telegram.</li>
      </ol>
      {botUrl ? (
        <p style={{ margin: "16px 0 0" }}>
          <a href={botUrl} style={{ display: "inline-block", padding: "12px 18px", borderRadius: 12, background: "#111", color: "#fff", fontWeight: 600, textDecoration: "none" }}>
            Открыть бота Claudery
          </a>
        </p>
      ) : null}

      <h2 style={{ fontSize: 20, margin: "28px 0 12px" }}>Оплата и возврат</h2>
      <p style={{ margin: 0 }}>
        Оплата через платёжный сервис Platega (СБП). Если доступ не был передан, оплата возвращается полностью. Подробности — в <a href={OFFER_PATH}>оферте</a>.
      </p>

      <Footer s={seller} />
    </main>
  );
}
